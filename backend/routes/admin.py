from flask import Blueprint, request, jsonify
from app import db
from models.user import User
from models.station import Station
from models.port import Port
from models.reservation import Reservation
from utils.auth import admin_required
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

# ==================== GET DASHBOARD STATS ====================
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats(user_id):
    """
    Get overall system statistics
    
    Headers:
    Authorization: Bearer <admin_access_token>
    """
    try:
        # Count statistics
        total_users = User.query.count()
        total_stations = Station.query.count()
        total_ports = Port.query.count()
        
        # Reservation statistics
        total_reservations = Reservation.query.count()
        active_reservations = Reservation.query.filter_by(status='ACTIVE').count()
        completed_reservations = Reservation.query.filter_by(status='COMPLETED').count()
        expired_reservations = Reservation.query.filter_by(status='EXPIRED').count()
        cancelled_reservations = Reservation.query.filter_by(status='CANCELLED').count()
        
        # Port status summary
        available_ports = Port.query.filter_by(status='AVAILABLE').count()
        reserved_ports = Port.query.filter_by(status='RESERVED').count()
        occupied_ports = Port.query.filter_by(status='OCCUPIED').count()
        
        # Device status
        online_stations = Station.query.filter_by(esp32_online=True).count()
        offline_stations = Station.query.filter_by(esp32_online=False).count()
        
        # Today's bookings
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_reservations = Reservation.query.filter(
            Reservation.reserved_at >= today_start
        ).count()
        
        # Get reservations from last 7 days
        week_start = datetime.utcnow() - timedelta(days=7)
        week_reservations = Reservation.query.filter(
            Reservation.reserved_at >= week_start
        ).count()
        
        return {
            'users': {
                'total': total_users,
                'admins': User.query.filter_by(is_admin=True).count(),
            },
            'stations': {
                'total': total_stations,
                'online': online_stations,
                'offline': offline_stations,
            },
            'ports': {
                'total': total_ports,
                'available': available_ports,
                'reserved': reserved_ports,
                'occupied': occupied_ports,
            },
            'reservations': {
                'total': total_reservations,
                'active': active_reservations,
                'completed': completed_reservations,
                'expired': expired_reservations,
                'cancelled': cancelled_reservations,
                'today': today_reservations,
                'this_week': week_reservations,
            },
            'timestamp': datetime.utcnow().isoformat(),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to get stats: {str(e)}'}, 500

# ==================== GET ALL USERS ====================
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users(user_id):
    """
    Get all users with pagination
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Query parameters:
    - page: Page number (default: 1)
    - per_page: Users per page (default: 20)
    - is_admin: Filter by admin status (true/false)
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        is_admin_filter = request.args.get('is_admin', type=lambda x: x.lower() == 'true')
        
        query = User.query
        
        if is_admin_filter is not None:
            query = query.filter_by(is_admin=is_admin_filter)
        
        paginated = query.order_by(User.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        users_data = [user.to_dict() for user in paginated.items]
        
        return {
            'users': users_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            },
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch users: {str(e)}'}, 500

# ==================== GET USER DETAILS ====================
@admin_bp.route('/users/<int:target_user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id, target_user_id):
    """
    Get detailed information about a specific user
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - target_user_id: User ID to retrieve
    """
    try:
        user = User.query.get(target_user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        # Get user's reservations
        reservations = Reservation.query.filter_by(user_id=target_user_id).order_by(
            Reservation.reserved_at.desc()
        ).limit(10).all()
        
        user_dict = user.to_dict(include_sensitive=True)
        user_dict['reservations'] = [r.to_dict() for r in reservations]
        
        return {
            'user': user_dict,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch user: {str(e)}'}, 500

# ==================== PROMOTE/DEMOTE USER ====================
@admin_bp.route('/users/<int:target_user_id>/admin', methods=['PUT'])
@admin_required
def update_user_admin_status(user_id, target_user_id):
    """
    Promote or demote user to/from admin
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - target_user_id: User ID to update
    
    Request body:
    {
        "is_admin": true
    }
    """
    data = request.get_json()
    
    if not data or 'is_admin' not in data:
        return {'error': 'is_admin parameter is required'}, 400
    
    try:
        # Prevent self-demotion
        if user_id == target_user_id and not data['is_admin']:
            return {'error': 'Cannot demote yourself from admin'}, 400
        
        user = User.query.get(target_user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        user.is_admin = data['is_admin']
        db.session.commit()
        
        return {
            'message': f"User {'promoted' if data['is_admin'] else 'demoted'} successfully",
            'user': user.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update user: {str(e)}'}, 500

# ==================== GET ALL STATIONS ====================
@admin_bp.route('/stations', methods=['GET'])
@admin_required
def get_admin_stations(user_id):
    """
    Get all stations with detailed status
    
    Headers:
    Authorization: Bearer <admin_access_token>
    """
    try:
        stations = Station.query.all()
        
        stations_data = []
        for station in stations:
            station_dict = station.to_dict(include_ports=True)
            
            # Add port reservation info
            for port_dict in station_dict['ports']:
                port = Port.query.get(port_dict['id'])
                if port:
                    active_reservation = Reservation.query.filter_by(
                        port_id=port.id,
                        status='ACTIVE'
                    ).first()
                    
                    if active_reservation:
                        port_dict['reservation'] = {
                            'booking_id': active_reservation.booking_id,
                            'user_email': active_reservation.user.email,
                            'expires_at': active_reservation.expires_at.isoformat(),
                            'remaining_time': active_reservation.get_remaining_time(),
                        }
            
            # Add status summary
            station_dict['status_summary'] = station.get_port_status_summary()
            
            stations_data.append(station_dict)
        
        return {
            'stations': stations_data,
            'count': len(stations_data),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch stations: {str(e)}'}, 500

# ==================== UPDATE STATION STATUS ====================
@admin_bp.route('/stations/<int:station_id>', methods=['PUT'])
@admin_required
def update_station(user_id, station_id):
    """
    Update station configuration
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - station_id: Station ID
    
    Request body:
    {
        "name": "New Name",
        "address": "New Address",
        "is_active": true
    }
    """
    data = request.get_json()
    
    try:
        station = Station.query.get(station_id)
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        if 'name' in data:
            station.name = data['name']
        if 'address' in data:
            station.address = data['address']
        if 'is_active' in data:
            station.is_active = data['is_active']
        
        station.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'message': 'Station updated successfully',
            'station': station.to_dict(include_ports=True),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update station: {str(e)}'}, 500

# ==================== GET ALL RESERVATIONS ====================
@admin_bp.route('/reservations', methods=['GET'])
@admin_required
def get_all_reservations(user_id):
    """
    Get all reservations with filtering
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Query parameters:
    - status: Filter by status (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
    - station_id: Filter by station
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20)
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status')
        station_filter = request.args.get('station_id', type=int)
        
        query = Reservation.query
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if station_filter:
            query = query.filter_by(station_id=station_filter)
        
        paginated = query.order_by(Reservation.reserved_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        reservations_data = []
        for res in paginated.items:
            res_dict = res.to_dict()
            res_dict['user_email'] = res.user.email
            res_dict['station_name'] = res.station.name
            res_dict['port_number'] = res.port.port_number
            reservations_data.append(res_dict)
        
        return {
            'reservations': reservations_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            },
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch reservations: {str(e)}'}, 500

# ==================== FORCE CANCEL RESERVATION ====================
@admin_bp.route('/reservations/<int:reservation_id>/cancel', methods=['POST'])
@admin_required
def admin_cancel_reservation(user_id, reservation_id):
    """
    Admin can force cancel any reservation
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    
    Request body:
    {
        "reason": "Optional cancellation reason"
    }
    """
    data = request.get_json() or {}
    
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        if reservation.status not in ['ACTIVE', 'RESERVED']:
            return {'error': f'Cannot cancel {reservation.status} reservation'}, 400
        
        reservation.status = 'CANCELLED'
        reservation.cancelled_at = datetime.utcnow()
        
        port = Port.query.get(reservation.port_id)
        if port:
            port.status = 'AVAILABLE'
        
        db.session.commit()
        
        return {
            'message': 'Reservation cancelled by admin',
            'reservation': reservation.to_dict(),
            'reason': data.get('reason', 'Admin cancelled'),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to cancel reservation: {str(e)}'}, 500

# ==================== GET PORT HISTORY ====================
@admin_bp.route('/ports/<int:port_id>/history', methods=['GET'])
@admin_required
def get_port_history(user_id, port_id):
    """
    Get reservation history for a specific port
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - port_id: Port ID
    
    Query parameters:
    - days: Number of days to look back (default: 7)
    """
    try:
        port = Port.query.get(port_id)
        
        if not port:
            return {'error': 'Port not found'}, 404
        
        days = request.args.get('days', 7, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        reservations = Reservation.query.filter(
            Reservation.port_id == port_id,
            Reservation.reserved_at >= since
        ).order_by(Reservation.reserved_at.desc()).all()
        
        history = []
        for res in reservations:
            res_dict = res.to_dict()
            res_dict['user_email'] = res.user.email
            history.append(res_dict)
        
        return {
            'port': port.to_dict(),
            'history': history,
            'count': len(history),
            'days': days,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch port history: {str(e)}'}, 500

# ==================== GET SYSTEM HEALTH ====================
@admin_bp.route('/health', methods=['GET'])
@admin_required
def get_system_health(user_id):
    """
    Get overall system health status
    
    Headers:
    Authorization: Bearer <admin_access_token>
    """
    try:
        stations = Station.query.all()
        
        health = {
            'timestamp': datetime.utcnow().isoformat(),
            'overall_status': 'healthy',
            'stations': [],
        }
        
        station_offline_count = 0
        
        for station in stations:
            # Check if ESP32 is online
            is_online = True
            if station.last_heartbeat:
                time_since_heartbeat = datetime.utcnow() - station.last_heartbeat
                is_online = time_since_heartbeat.total_seconds() <= 60  # 60 second timeout
            
            if not is_online:
                station_offline_count += 1
            
            # Get port info
            port_status = station.get_port_status_summary()
            
            station_health = {
                'station_id': station.id,
                'station_name': station.name,
                'esp32_online': is_online,
                'last_heartbeat': station.last_heartbeat.isoformat() if station.last_heartbeat else None,
                'ports': port_status,
                'health': 'online' if is_online else 'offline',
            }
            
            health['stations'].append(station_health)
        
        # Determine overall health
        if station_offline_count > 0:
            health['overall_status'] = 'degraded' if station_offline_count < len(stations) else 'offline'
        
        health['offline_stations'] = station_offline_count
        health['total_stations'] = len(stations)
        
        return health, 200
    
    except Exception as e:
        return {'error': f'Failed to get system health: {str(e)}'}, 500

# ==================== GET ACTIVITY LOG ====================
@admin_bp.route('/activity', methods=['GET'])
@admin_required
def get_activity_log(user_id):
    """
    Get recent system activity
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Query parameters:
    - hours: Hours to look back (default: 24)
    - limit: Number of records (default: 50)
    """
    try:
        hours = request.args.get('hours', 24, type=int)
        limit = request.args.get('limit', 50, type=int)
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Get recent reservations
        recent_reservations = Reservation.query.filter(
            Reservation.reserved_at >= since
        ).order_by(Reservation.reserved_at.desc()).limit(limit).all()
        
        activity = []
        for res in recent_reservations:
            activity.append({
                'type': 'reservation',
                'action': 'created',
                'status': res.status,
                'booking_id': res.booking_id,
                'user_email': res.user.email,
                'station_name': res.station.name,
                'port_number': res.port.port_number,
                'timestamp': res.reserved_at.isoformat(),
            })
        
        # Sort by timestamp descending
        activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return {
            'activity': activity,
            'count': len(activity),
            'hours': hours,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch activity log: {str(e)}'}, 500

# ==================== FORCE EXPIRE RESERVATION ====================
@admin_bp.route('/reservations/<int:reservation_id>/expire', methods=['POST'])
@admin_required
def admin_expire_reservation(user_id, reservation_id):
    """
    Admin can force expire an active reservation
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - reservation_id: Reservation ID
    """
    try:
        reservation = Reservation.query.get(reservation_id)
        
        if not reservation:
            return {'error': 'Reservation not found'}, 404
        
        if reservation.status != 'ACTIVE':
            return {'error': f'Cannot expire {reservation.status} reservation'}, 400
        
        reservation.status = 'EXPIRED'
        
        port = Port.query.get(reservation.port_id)
        if port:
            port.status = 'AVAILABLE'
        
        db.session.commit()
        
        return {
            'message': 'Reservation expired by admin',
            'reservation': reservation.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to expire reservation: {str(e)}'}, 500

# ==================== RESET PORT ====================
@admin_bp.route('/ports/<int:port_id>/reset', methods=['POST'])
@admin_required
def reset_port(user_id, port_id):
    """
    Admin can force reset a port to AVAILABLE
    
    Headers:
    Authorization: Bearer <admin_access_token>
    
    Path parameters:
    - port_id: Port ID
    """
    try:
        port = Port.query.get(port_id)
        
        if not port:
            return {'error': 'Port not found'}, 404
        
        # Cancel any active reservation on this port
        active_reservation = Reservation.query.filter_by(
            port_id=port_id,
            status='ACTIVE'
        ).first()
        
        if active_reservation:
            active_reservation.status = 'CANCELLED'
            active_reservation.cancelled_at = datetime.utcnow()
        
        port.status = 'AVAILABLE'
        port.sensor_value = None
        
        db.session.commit()
        
        return {
            'message': 'Port reset to AVAILABLE',
            'port': port.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to reset port: {str(e)}'}, 500