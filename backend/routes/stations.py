from flask import Blueprint, request, jsonify
from app import db
from models.station import Station
from models.port import Port
from models.user import User
from utils.auth import token_required
from utils.distance import calculate_distance
from config import config as config_dict
import os
import requests

stations_bp = Blueprint('stations', __name__)

# Get configuration
current_config = config_dict[os.getenv('FLASK_ENV', 'development')]

# ==================== GET ALL STATIONS ====================
@stations_bp.route('', methods=['GET'])
def get_stations():
    """
    Get all charging stations
    
    Optional query parameters:
    - latitude: User's latitude (for distance calculation)
    - longitude: User's longitude (for distance calculation)
    """
    try:
        stations = Station.query.filter_by(is_active=True).all()
        
        stations_data = []
        for station in stations:
            station_dict = station.to_dict(include_ports=True)
            
            # Calculate distance if user location provided
            if request.args.get('latitude') and request.args.get('longitude'):
                try:
                    user_lat = float(request.args.get('latitude'))
                    user_lng = float(request.args.get('longitude'))
                    distance = calculate_distance(
                        user_lat, user_lng,
                        station.latitude, station.longitude
                    )
                    station_dict['distance'] = distance
                except ValueError:
                    pass
            
            stations_data.append(station_dict)
        
        return {
            'stations': stations_data,
            'count': len(stations_data),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch stations: {str(e)}'}, 500

# ==================== GET COMBINED STATIONS ====================
@stations_bp.route('/combined', methods=['GET'])
def get_combined_stations():
    """
    Get both local ESP32 stations and OpenChargeMap external stations
    
    Optional query parameters:
    - latitude: User's latitude
    - longitude: User's longitude
    - region: External station region (default tamil_nadu)
    - distance: Radius in km for nearby external search
    """
    try:
        # 1. Get Local Stations
        stations = Station.query.filter_by(is_active=True).all()
        combined_data = []
        
        user_lat = request.args.get('latitude')
        user_lng = request.args.get('longitude')
        
        for station in stations:
            station_dict = station.to_dict(include_ports=True)
            station_dict['is_external'] = False  # Mark as local ESP32 station
            
            if user_lat and user_lng:
                try:
                    distance = calculate_distance(
                        float(user_lat), float(user_lng),
                        station.latitude, station.longitude
                    )
                    station_dict['distance'] = distance
                except ValueError:
                    pass
            combined_data.append(station_dict)
            
        # 2. Fetch from OpenChargeMap. The API does not reliably filter by
        # state, so Tamil Nadu results are narrowed by coordinates below.
        if current_config.OPENCHARGEMAP_API_KEY:
            try:
                region = request.args.get('region', 'tamil_nadu').lower()
                url = f"{current_config.OPENCHARGEMAP_API_URL}/poi/"
                params = {
                    'key': current_config.OPENCHARGEMAP_API_KEY,
                    'maxresults': 1000,
                    'compact': True,
                    'verbose': False
                }

                if region == 'india':
                    params.update({
                        'latitude': 22.5,
                        'longitude': 79.0,
                        'distance': 1500,
                        'distanceunit': 'km',
                    })
                elif region == 'nearby' and user_lat and user_lng:
                    params.update({
                        'latitude': user_lat,
                        'longitude': user_lng,
                        'distance': request.args.get('distance', 25),
                        'distanceunit': 'km',
                    })
                elif region in ('tamil_nadu', 'tamilnadu'):
                    params.update({
                        'latitude': 11.1271,
                        'longitude': 78.6569,
                        'distance': 350,
                        'distanceunit': 'km',
                    })
                elif user_lat and user_lng:
                    params.update({
                        'latitude': user_lat,
                        'longitude': user_lng,
                        'distance': request.args.get('distance', 10),
                        'distanceunit': 'km',
                    })
                else:
                    # Do not make an unbounded global request when no region
                    # or location was supplied.
                    params['latitude'] = current_config.STATION_LAT
                    params['longitude'] = current_config.STATION_LNG
                    params['distance'] = request.args.get('distance', 10)
                    params['distanceunit'] = 'km'

                response = requests.get(url, params=params, timeout=5)
                if response.status_code == 200:
                    external_stations = response.json()
                    
                    for ext in external_stations:
                        # Map OpenChargeMap data to our format
                        addr = ext.get('AddressInfo', {})
                        latitude = addr.get('Latitude')
                        longitude = addr.get('Longitude')

                        # OpenChargeMap currently ignores stateorprovince;
                        # keep only stations inside Tamil Nadu's bounds.
                        if region in ('tamil_nadu', 'tamilnadu') and not (
                            latitude is not None and longitude is not None and
                            8.0 <= float(latitude) <= 13.6 and
                            76.2 <= float(longitude) <= 80.4
                        ):
                            continue

                        if region == 'nearby' and user_lat and user_lng:
                            distance = calculate_distance(
                                float(user_lat), float(user_lng),
                                float(latitude), float(longitude)
                            )
                        else:
                            distance = addr.get('Distance')

                        ext_dict = {
                            'id': f"ext_{ext.get('ID')}",
                            'name': addr.get('Title', 'External Station'),
                            'address': addr.get('AddressLine1', 'Unknown Address'),
                            'latitude': latitude,
                            'longitude': longitude,
                            'is_external': True,
                            'operator': ext.get('OperatorInfo', {}).get('Title', 'Unknown Operator'),
                            'distance': distance,
                            'ports': [], # External stations can't be reserved through our backend
                            'esp32_online': False
                        }
                        combined_data.append(ext_dict)
            except Exception as e:
                print(f"Failed to fetch external stations: {e}")
                
        # If no external stations were found (e.g. no API key or API failed), provide some fallback Indian real-world stations
        if not any(st.get('is_external') for st in combined_data):
            fallback_stations = [
                {'title': 'Tata Power EZ Charge - Delhi', 'lat': 28.6139, 'lng': 77.2090, 'address': 'Connaught Place, New Delhi', 'op': 'Tata Power'},
                {'title': 'Ather Grid - Bangalore', 'lat': 12.9716, 'lng': 77.5946, 'address': 'MG Road, Bangalore', 'op': 'Ather Energy'},
                {'title': 'ChargeZone - Mumbai', 'lat': 19.0760, 'lng': 72.8777, 'address': 'Bandra Kurla Complex, Mumbai', 'op': 'ChargeZone'},
                {'title': 'Jio-bp pulse - Chennai', 'lat': 13.0827, 'lng': 80.2707, 'address': 'T Nagar, Chennai', 'op': 'Jio-bp'},
                {'title': 'Zeon Charging - Coimbatore', 'lat': 11.0168, 'lng': 76.9558, 'address': 'Avinashi Road, Coimbatore', 'op': 'Zeon Charging'}
            ]
            for idx, f in enumerate(fallback_stations):
                dist = None
                if user_lat and user_lng:
                    dist = calculate_distance(float(user_lat), float(user_lng), f['lat'], f['lng'])
                combined_data.append({
                    'id': f'fallback_{idx}',
                    'name': f['title'],
                    'address': f['address'],
                    'latitude': f['lat'],
                    'longitude': f['lng'],
                    'is_external': True,
                    'operator': f['op'],
                    'distance': dist,
                    'ports': [],
                    'esp32_online': False
                })
                
        # Sort by distance if available
        combined_data.sort(key=lambda x: x.get('distance', 9999))
        
        return {
            'stations': combined_data,
            'count': len(combined_data),
        }, 200
        
    except Exception as e:
        return {'error': f'Failed to fetch combined stations: {str(e)}'}, 500

# ==================== GET SINGLE STATION ====================
@stations_bp.route('/<int:station_id>', methods=['GET'])
def get_station(station_id):
    """
    Get single station with all ports and current reservations
    
    Path parameters:
    - station_id: Station ID
    """
    try:
        station = Station.query.get(station_id)
        
        if not station:
            return {'error': 'Station not found'}, 404
        
        station_dict = station.to_dict(include_ports=True)
        
        # Add port reservation info
        for port_dict in station_dict['ports']:
            port = Port.query.get(port_dict['id'])
            if port:
                # Get active reservation for this port
                from models.reservation import Reservation
                active_reservation = Reservation.query.filter_by(
                    port_id=port.id,
                    status='ACTIVE'
                ).first()
                
                if active_reservation:
                    port_dict['reservation'] = {
                        'booking_id': active_reservation.booking_id,
                        'expires_at': active_reservation.expires_at.isoformat(),
                        'remaining_time': active_reservation.get_remaining_time(),
                    }
        
        return {
            'station': station_dict,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch station: {str(e)}'}, 500

# ==================== GET NEARBY STATIONS ====================
@stations_bp.route('/nearby', methods=['GET'])
@token_required
def get_nearby_stations(user_id):
    """
    Get stations nearby user (within configured radius)
    
    Headers:
    Authorization: Bearer <access_token>
    
    Query parameters:
    - radius: Optional radius in km (default: 2)
    """
    try:
        user = User.query.get(user_id)
        if not user or not user.latitude or not user.longitude:
            return {'error': 'User location not set'}, 400
        
        radius = float(request.args.get('radius', current_config.RESERVATION_RADIUS_KM))
        
        stations = Station.query.filter_by(is_active=True).all()
        nearby_stations = []
        
        for station in stations:
            distance = calculate_distance(
                user.latitude, user.longitude,
                station.latitude, station.longitude
            )
            
            if distance <= radius:
                station_dict = station.to_dict(include_ports=True)
                station_dict['distance'] = distance
                nearby_stations.append(station_dict)
        
        # Sort by distance
        nearby_stations.sort(key=lambda x: x['distance'])
        
        return {
            'stations': nearby_stations,
            'count': len(nearby_stations),
            'radius': radius,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch nearby stations: {str(e)}'}, 500

# ==================== GET PORT STATUS ====================
@stations_bp.route('/<int:station_id>/ports/<int:port_number>', methods=['GET'])
def get_port_status(station_id, port_number):
    """
    Get status of specific port
    
    Path parameters:
    - station_id: Station ID
    - port_number: Port number (1, 2, or 3)
    """
    try:
        station = Station.query.get(station_id)
        if not station:
            return {'error': 'Station not found'}, 404
        
        port = Port.query.filter_by(
            station_id=station_id,
            port_number=port_number
        ).first()
        
        if not port:
            return {'error': 'Port not found'}, 404
        
        port_dict = port.to_dict()
        
        # Get active reservation if any
        from models.reservation import Reservation
        active_reservation = Reservation.query.filter_by(
            port_id=port.id,
            status='ACTIVE'
        ).first()
        
        if active_reservation:
            port_dict['reservation'] = {
                'booking_id': active_reservation.booking_id,
                'expires_at': active_reservation.expires_at.isoformat(),
                'remaining_time': active_reservation.get_remaining_time(),
            }
        
        return {
            'port': port_dict,
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch port status: {str(e)}'}, 500

# ==================== GET STATION SUMMARY ====================
@stations_bp.route('/<int:station_id>/summary', methods=['GET'])
def get_station_summary(station_id):
    """
    Get quick summary of station status
    
    Path parameters:
    - station_id: Station ID
    """
    try:
        station = Station.query.get(station_id)
        if not station:
            return {'error': 'Station not found'}, 404
        
        summary = {
            'station_id': station.id,
            'station_name': station.name,
            'esp32_online': station.esp32_online,
            'ports': station.get_port_status_summary(),
            'total_ports': len(station.ports),
        }
        
        return summary, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch station summary: {str(e)}'}, 500