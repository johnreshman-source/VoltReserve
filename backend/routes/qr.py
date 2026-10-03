from flask import Blueprint, request, jsonify
from app import db
from models.reservation import Reservation
from models.port import Port
from utils.auth import token_required, admin_required
from services.qr_service import QRCodeService
from datetime import datetime

qr_bp = Blueprint('qr', __name__)

# ==================== GENERATE QR CODE ====================
@qr_bp.route('/generate', methods=['POST'])
@token_required
def generate_qr_code(user_id):
    """
    Generate QR code for active reservation
    
    Headers:
    Authorization: Bearer <access_token>
    
    Request body:
    {
        "reservation_id": 1
    }
    """
    data = request.get_json()
    
    if not data or not data.get('reservation_id'):
        return {'error': 'Reservation ID is required'}, 400
    
    try:
        reservation = Reservation.query.get(data['reservation_id'])
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation
        if reservation.user_id != user_id:
            return {'error': 'Unauthorized'}, 403
        
        # Check if reservation is active and within its time window.
        if reservation.status != 'ACTIVE' or reservation.is_expired():
            if reservation.status == 'ACTIVE' and reservation.is_expired():
                reservation.status = 'EXPIRED'
                reservation.port.status = 'AVAILABLE'
                db.session.commit()
            return {'error': f'Cannot generate QR for {reservation.status} reservation'}, 400
        
        # Generate QR code
        qr_result = QRCodeService.generate_qr_code(reservation)
        
        return {
            'message': 'QR code generated successfully',
            'qr': qr_result,
            'reservation': reservation.to_dict(),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to generate QR code: {str(e)}'}, 500

# ==================== GET QR CODE ====================
@qr_bp.route('/reservation/<int:reservation_id>', methods=['GET'])
@token_required
def get_qr_code(user_id, reservation_id):
    """
    Get QR code for a reservation
    
    Headers:
    Authorization: Bearer <access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        # Check if user owns this reservation or is admin
        if reservation.user_id != user_id:
            from models.user import User
            user = User.query.get(user_id)
            if not user or not user.is_admin:
                return {'error': 'Unauthorized'}, 403
        
        if reservation.status != 'ACTIVE' or reservation.is_expired():
            if reservation.status == 'ACTIVE' and reservation.is_expired():
                reservation.status = 'EXPIRED'
                reservation.port.status = 'AVAILABLE'
                db.session.commit()
            return {'error': 'QR code is no longer valid'}, 400

        qr_result = QRCodeService.generate_qr_code(reservation)
        
        return {
            'qr': qr_result,
            'reservation_id': reservation_id,
            'booking_id': reservation.booking_id,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to get QR code: {str(e)}'}, 500

# ==================== VERIFY QR CODE ====================
@qr_bp.route('/verify', methods=['POST'])
def verify_qr_code():
    """
    Verify QR code at charging station (can be called without auth)
    This would typically be called by the ESP32 or station display
    
    Request body:
    {
        "qr_data": "VOLTRESERVE:abc123|STATION:VoltReserve|PORT:1"
    }
    
    OR
    
    {
        "booking_id": "abc123"
    }
    """
    data = request.get_json()
    
    if not data:
        return {'error': 'No data provided'}, 400
    
    try:
        booking_id = None
        qr_token = None
        
        # Extract booking ID from either QR data or booking_id field
        if data.get('qr_data'):
            qr_parsed = QRCodeService.parse_qr_data(data['qr_data'])
            booking_id = qr_parsed.get('booking')
            qr_token = qr_parsed.get('token')
        
        if not booking_id or not qr_token:
            return {'error': 'Invalid QR data or QR token'}, 400
        
        # Find reservation by booking ID
        reservation = Reservation.query.filter_by(
            booking_id=booking_id,
            qr_token=qr_token,
        ).first()
        
        if not reservation:
            return {
                'valid': False,
                'message': 'Booking not found',
            }, 404
        
        # Check if reservation is active and not expired
        if reservation.status != 'ACTIVE':
            return {
                'valid': False,
                'message': f'Reservation is {reservation.status}',
            }, 400
        
        if reservation.is_expired():
            # Mark as expired
            reservation.status = 'EXPIRED'
            reservation.port.status = 'AVAILABLE'
            db.session.commit()
            
            return {
                'valid': False,
                'message': 'Reservation has expired',
            }, 400

        expected_values = {
            'reservation': str(reservation.id),
            'user': str(reservation.user_id),
            'station': str(reservation.station_id),
            'port': str(reservation.port_id),
        }
        if any(qr_parsed.get(key) != value for key, value in expected_values.items()):
            return {
                'valid': False,
                'message': 'QR reservation details do not match',
            }, 400
        
        # QR is valid
        return {
            'valid': True,
            'message': 'QR code verified successfully',
            'reservation': {
                'booking_id': reservation.booking_id,
                'station_id': reservation.station_id,
                'station_name': reservation.station.name,
                'port_id': reservation.port_id,
                'port_number': reservation.port.port_number,
                'user_email': reservation.user.email,
                'expires_at': reservation.expires_at.isoformat(),
                'remaining_time': reservation.get_remaining_time(),
            },
        }, 200

    except Exception as e:
        return {'error': f'Failed to verify QR code: {str(e)}'}, 500

@qr_bp.route('/verify/admin', methods=['POST'])
@admin_required
def verify_admin_qr_code(user_id):
    """Verify a reservation QR code from an authenticated admin dashboard."""
    return verify_qr_code()

# ==================== GET QR BY BOOKING ID ====================
@qr_bp.route('/booking/<booking_id>', methods=['GET'])
def get_qr_by_booking_id(booking_id):
    """
    Get QR code using booking ID (used by station displays)
    
    Path parameters:
    - booking_id: Unique booking ID
    """
    try:
        reservation = Reservation.query.filter_by(booking_id=booking_id).first()
        
        if not reservation:
            return {'error': 'Booking not found'}, 404
        
        if reservation.status != 'ACTIVE' or reservation.is_expired():
            return {'error': 'QR code is no longer valid'}, 400

        qr_result = QRCodeService.generate_qr_code(reservation)
        
        return {
            'qr': qr_result,
            'reservation': {
                'booking_id': reservation.booking_id,
                'status': reservation.status,
                'expires_at': reservation.expires_at.isoformat(),
            },
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to get QR code: {str(e)}'}, 500