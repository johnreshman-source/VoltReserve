from flask import Blueprint, request, jsonify
from app import db
from models.station import Station
from models.port import Port
from models.reservation import Reservation
from datetime import datetime, timedelta
from config import config as config_dict
import os

device_bp = Blueprint('device', __name__)

# Get configuration
current_config = config_dict[os.getenv('FLASK_ENV', 'development')]

# ==================== UPDATE PORT STATUS (FROM ESP32) ====================
@device_bp.route('/status', methods=['POST'])
def update_device_status():
    """
    Update port status from ESP32
    Called by ESP32 to report sensor readings and port occupancy
    
    Request body:
    {
        "station_id": 1,
        "ports": [
            {
                "port_number": 1,
                "sensor_value": 1,
                "occupied": false
            },
            {
                "port_number": 2,
                "sensor_value": 0,
                "occupied": true
            },
            {
                "port_number": 3,
                "sensor_value": 1,
                "occupied": false
            }
        ],
        "esp32_id": "ESP32_001"
    }
    """
    data = request.get_json()
    
    if not data or not data.get('station_id') or not data.get('ports'):
        return {'error': 'Station ID and ports data are required'}, 400
    
    try:
        station = Station.query.get(data['station_id'])
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        # Update station heartbeat
        station.esp32_online = True
        station.last_heartbeat = datetime.utcnow()
        
        # Update port statuses
        for port_data in data['ports']:
            port = Port.query.filter_by(
                station_id=station.id,
                port_number=port_data.get('port_number')
            ).first()
            
            if not port:
                continue
            
            # Update sensor value
            port.sensor_value = port_data.get('sensor_value')
            
            # Update port status based on occupancy
            occupied = port_data.get('occupied', False)
            
            if occupied and port.status not in ['OCCUPIED', 'RESERVED']:
                # Device detected occupancy
                port.status = 'OCCUPIED'
            elif not occupied and port.status == 'OCCUPIED':
                # Device no longer detects occupancy
                # Check if there's an active reservation
                active_reservation = Reservation.query.filter_by(
                    port_id=port.id,
                    status='ACTIVE'
                ).first()
                
                if active_reservation and not active_reservation.is_expired():
                    # Keep as RESERVED
                    port.status = 'RESERVED'
                else:
                    # Mark as available
                    port.status = 'AVAILABLE'
        
        # Check for expired reservations and mark ports as available
        reservations = Reservation.query.filter_by(
            station_id=station.id,
            status='ACTIVE'
        ).all()
        
        for res in reservations:
            if res.is_expired():
                res.status = 'EXPIRED'
                res.port.status = 'AVAILABLE'
        
        db.session.commit()
        
        return {
            'message': 'Device status updated successfully',
            'station_id': station.id,
            'esp32_online': station.esp32_online,
            'timestamp': datetime.utcnow().isoformat(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update device status: {str(e)}'}, 500

# ==================== GET DEVICE STATUS ====================
@device_bp.route('/status/<int:station_id>', methods=['GET'])
def get_device_status(station_id):
    """
    Get current device/station status
    
    Path parameters:
    - station_id: Station ID
    """
    try:
        station = Station.query.get(station_id)
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        # Check if ESP32 is considered offline
        if station.last_heartbeat:
            time_since_heartbeat = datetime.utcnow() - station.last_heartbeat
            if time_since_heartbeat.total_seconds() > current_config.ESP32_TIMEOUT_SECONDS:
                station.esp32_online = False
        
        # Get port status
        ports = []
        for port in station.ports:
            port_dict = port.to_dict()
            
            # Add active reservation info
            active_reservation = Reservation.query.filter_by(
                port_id=port.id,
                status='ACTIVE'
            ).first()
            
            if active_reservation:
                if active_reservation.is_expired():
                    active_reservation.status = 'EXPIRED'
                    port.status = 'AVAILABLE'
                    db.session.commit()
                else:
                    port_dict['reservation'] = {
                        'booking_id': active_reservation.booking_id,
                        'expires_at': active_reservation.expires_at.isoformat(),
                        'remaining_time': active_reservation.get_remaining_time(),
                    }
            
            ports.append(port_dict)
        
        return {
            'station_id': station.id,
            'station_name': station.name,
            'esp32_online': station.esp32_online,
            'last_heartbeat': station.last_heartbeat.isoformat() if station.last_heartbeat else None,
            'ports': ports,
            'timestamp': datetime.utcnow().isoformat(),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to get device status: {str(e)}'}, 500

# ==================== DEMO MODE - SIMULATE PORT OCCUPANCY ====================
@device_bp.route('/demo/occupy', methods=['POST'])
def demo_occupy_port():
    """
    DEMO MODE: Simulate port occupancy (for testing without ESP32)
    
    Request body:
    {
        "station_id": 1,
        "port_number": 1,
        "occupied": true
    }
    """
    if os.getenv('FLASK_ENV') != 'development':
        return {'error': 'Demo mode only available in development'}, 403
    
    data = request.get_json()
    
    if not data or not data.get('station_id') or not data.get('port_number'):
        return {'error': 'Station ID and port number are required'}, 400
    
    try:
        station = Station.query.get(data['station_id'])
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        port = Port.query.filter_by(
            station_id=station.id,
            port_number=data['port_number']
        ).first()
        
        if not port:
            return {'error': 'Port not found'}, 404
        
        occupied = data.get('occupied', False)
        
        if occupied:
            port.status = 'OCCUPIED'
            port.sensor_value = 0
        else:
            port.status = 'AVAILABLE'
            port.sensor_value = 1
        
        db.session.commit()
        
        return {
            'message': f'Port {data["port_number"]} set to {"OCCUPIED" if occupied else "AVAILABLE"}',
            'port': port.to_dict(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Demo mode failed: {str(e)}'}, 500

# ==================== DEMO MODE - SIMULATE HEARTBEAT ====================
@device_bp.route('/demo/heartbeat', methods=['POST'])
def demo_heartbeat():
    """
    DEMO MODE: Simulate ESP32 heartbeat (for testing without ESP32)
    
    Request body:
    {
        "station_id": 1
    }
    """
    if os.getenv('FLASK_ENV') != 'development':
        return {'error': 'Demo mode only available in development'}, 403
    
    data = request.get_json()
    
    if not data or not data.get('station_id'):
        return {'error': 'Station ID is required'}, 400
    
    try:
        station = Station.query.get(data['station_id'])
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        station.esp32_online = True
        station.last_heartbeat = datetime.utcnow()
        db.session.commit()
        
        return {
            'message': 'ESP32 heartbeat recorded',
            'station_id': station.id,
            'esp32_online': True,
            'last_heartbeat': station.last_heartbeat.isoformat(),
        }, 200
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Heartbeat failed: {str(e)}'}, 500

# ==================== HEALTH CHECK ====================
@device_bp.route('/health/<int:station_id>', methods=['GET'])
def health_check(station_id):
    """
    Health check for a station device
    
    Path parameters:
    - station_id: Station ID
    """
    try:
        station = Station.query.get(station_id)
        
        if not station:
            return {'status': 'unknown'}, 404
        
        # Check if ESP32 is online (heartbeat within timeout)
        is_online = False
        if station.last_heartbeat:
            time_since_heartbeat = datetime.utcnow() - station.last_heartbeat
            is_online = time_since_heartbeat.total_seconds() <= current_config.ESP32_TIMEOUT_SECONDS
        
        return {
            'station_id': station.id,
            'station_name': station.name,
            'status': 'online' if is_online else 'offline',
            'esp32_online': is_online,
            'last_heartbeat': station.last_heartbeat.isoformat() if station.last_heartbeat else None,
            'timestamp': datetime.utcnow().isoformat(),
        }, 200
    
    except Exception as e:
        return {'status': 'error', 'error': str(e)}, 500