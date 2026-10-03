from flask import Blueprint, request, jsonify
from app import db
from models.reservation import Reservation
from models.port import Port
from models.station import Station
from models.user import User
from utils.auth import token_required
from utils.distance import is_within_radius
from datetime import datetime, timedelta
from config import config as config_dict
from services.qr_service import QRCodeService
import secrets
import os

reservations_bp = Blueprint('reservations', __name__)

# Get configuration
current_config = config_dict[os.getenv('FLASK_ENV', 'development')]

# ==================== CREATE RESERVATION ====================
@reservations_bp.route('', methods=['POST'])
@token_required
def create_reservation(user_id):
    """
    Create a new reservation
    
    Headers:
    Authorization: Bearer <access_token>
    
    Request body:
    {
        "station_id": 1,
        "port_id": 1
    }
    """
    data = request.get_json()
    
    if not data or not data.get('station_id') or not data.get('port_id'):
        return {'error': 'Station ID and Port ID are required'}, 400
    
    try:
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        # Validate user location is set
        if not user.latitude or not user.longitude:
            return {'error': 'User location not set'}, 400
        
        station = Station.query.get(data['station_id'])
        if not station:
            return {'error': 'Station not found'}, 404
        
        port = Port.query.get(data['port_id'])
        if not port:
            return {'error': 'Port not found'}, 404
        
        # Check port belongs to station
        if port.station_id != station.id:
            return {'error': 'Port does not belong to this station'}, 400
        
        # Check if user is within reservation radius
        if not is_within_radius(
            user.latitude, user.longitude,
            station.latitude, station.longitude,
            current_config.RESERVATION_RADIUS_KM
        ):
            return {
                'error': f'User is outside reservation radius of {current_config.RESERVATION_RADIUS_KM} km'
            }, 400
        
        # Proactively clean up if this port has an expired but uncleaned reservation
        expired_res = Reservation.query.filter_by(
            port_id=port.id, 
            status='ACTIVE'
        ).filter(Reservation.expires_at < datetime.utcnow()).first()
        
        if expired_res:
            expired_res.status = 'EXPIRED'
            port.status = 'AVAILABLE'
            db.session.commit()
            
        # Check for existing active reservation by this user at this station
        existing_reservation = Reservation.query.filter_by(
            user_id=user_id,
            station_id=station.id,
            status='ACTIVE'
        ).first()
        
        # Also clean up user's own expired reservations
        if existing_reservation and existing_reservation.is_expired():
            existing_reservation.status = 'EXPIRED'
            existing_reservation.port.status = 'AVAILABLE'
            db.session.commit()
            existing_reservation = None
            
        if existing_reservation:
            return {
                'error': 'You already have an active reservation at this station'
            }, 409

        # Use optimistic concurrency control to atomically reserve the port
        updated_count = Port.query.filter_by(id=port.id, status='AVAILABLE').update({'status': 'RESERVED'})
        if updated_count == 0:
            return {
                'error': f'Port is currently {port.status} and cannot be reserved'
            }, 409
        
        # Create reservation
        reservation = Reservation(
            user_id=user_id,
            station_id=station.id,
            port_id=port.id,
            status='ACTIVE',
            reserved_at=datetime.utcnow(),
            duration_minutes=current_config.RESERVATION_TIMEOUT_MINUTES
        )
        reservation.expires_at = reservation.reserved_at + timedelta(
            minutes=current_config.RESERVATION_TIMEOUT_MINUTES
        )
        reservation.qr_token = secrets.token_urlsafe(32)
        
        db.session.add(reservation)
        db.session.commit()
        
        return {
            'message': 'Reservation created successfully',
            'reservation': reservation.to_dict(),
            'qr': QRCodeService.generate_qr_code(reservation),
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to create reservation: {str(e)}'}, 500

# ==================== GET USER RESERVATIONS ====================
@reservations_bp.route('', methods=['GET'])
@token_required
def get_user_reservations(user_id):
    """
    Get all reservations for current user
    
    Headers:
    Authorization: Bearer <access_token>
    
    Query parameters:
    - status: Filter by status (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
    """
    try:
        status_filter = request.args.get('status')
        
        query = Reservation.query.filter_by(user_id=user_id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        reservations = query.order_by(Reservation.reserved_at.desc()).all()
        
        # Clean up expired reservations (set status to EXPIRED)
        for res in reservations:
            if res.status == 'ACTIVE' and res.is_expired():
                res.status = 'EXPIRED'
                res.port.status = 'AVAILABLE'
        
        db.session.commit()
        
        reservations_data = [r.to_dict(include_station=True) for r in reservations]
        
        return {
            'reservations': reservations_data,
            'count': len(reservations_data),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch reservations: {str(e)}'}, 500

# ==================== GET SINGLE RESERVATION ====================
@reservations_bp.route('/<int:reservation_id>', methods=['GET'])
@token_required
def get_reservation(user_id, reservation_id):
    """
    Get specific reservation details
    
    Headers:
    Authorization: Bearer <access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation
        if reservation.user_id != user_id:
            return {'error': 'Unauthorized'}, 403
        
        return {
            'reservation': reservation.to_dict(include_user=True, include_station=True),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch reservation: {str(e)}'}, 500

# ==================== GET ACTIVE RESERVATION ====================
@reservations_bp.route('/active', methods=['GET'])
@token_required
def get_active_reservation(user_id):
    """
    Get user's active reservation (if any)
    
    Headers:
    Authorization: Bearer <access_token>
    """
    try:
        reservation = Reservation.query.filter_by(
            user_id=user_id,
            status='ACTIVE'
        ).first()
        
        if not reservation:
            return {
                'reservation': None,
                'message': 'No active reservation',
            }, 200
        
        # Check if expired
        if reservation.is_expired():
            reservation.status = 'EXPIRED'
            reservation.port.status = 'AVAILABLE'
            db.session.commit()
            
            return {
                'reservation': None,
                'message': 'Reservation has expired',
            }, 200
        
        return {
            'reservation': reservation.to_dict(include_station=True),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch active reservation: {str(e)}'}, 500

# ==================== CANCEL RESERVATION ====================
@reservations_bp.route('/<int:reservation_id>', methods=['DELETE'])
@token_required
def cancel_reservation(user_id, reservation_id):
    """
    Cancel an active reservation
    
    Headers:
    Authorization: Bearer <access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation
        if reservation.user_id != user_id:
            return {'error': 'Unauthorized'}, 403
        
        # Check if reservation is active
        if reservation.status != 'ACTIVE':
            return {'error': f'Cannot cancel {reservation.status} reservation'}, 400
        
        # Update reservation status
        reservation.status = 'CANCELLED'
        reservation.cancelled_at = datetime.utcnow()
        
        # Release port
        port = Port.query.get(reservation.port_id)
        if port:
            port.status = 'AVAILABLE'
        
        db.session.commit()
        
        return {
            'message': 'Reservation cancelled successfully',
            'reservation': reservation.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to cancel reservation: {str(e)}'}, 500

# ==================== START CHARGING ====================
@reservations_bp.route('/<int:reservation_id>/start', methods=['POST'])
@token_required
def start_charging(user_id, reservation_id):
    """
    Mark reservation as started (user began charging)
    
    Headers:
    Authorization: Bearer <access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation
        if reservation.user_id != user_id:
            return {'error': 'Unauthorized'}, 403
        
        # Check if reservation is active
        if reservation.status != 'ACTIVE':
            return {'error': f'Cannot start {reservation.status} reservation'}, 400
        
        # Mark as started
        reservation.started_at = datetime.utcnow()
        port = Port.query.get(reservation.port_id)
        if port:
            port.status = 'OCCUPIED'
        
        db.session.commit()
        
        return {
            'message': 'Charging started',
            'reservation': reservation.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to start charging: {str(e)}'}, 500

# ==================== COMPLETE CHARGING ====================
@reservations_bp.route('/<int:reservation_id>/complete', methods=['POST'])
@token_required
def complete_charging(user_id, reservation_id):
    """
    Mark reservation as completed (charging finished)
    
    Headers:
    Authorization: Bearer <access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation
        if reservation.user_id != user_id:
            return {'error': 'Unauthorized'}, 403
        
        # Mark as completed
        reservation.status = 'COMPLETED'
        reservation.completed_at = datetime.utcnow()
        
        port = Port.query.get(reservation.port_id)
        if port:
            port.status = 'AVAILABLE'
        
        db.session.commit()
        
        return {
            'message': 'Charging completed',
            'reservation': reservation.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to complete charging: {str(e)}'}, 500