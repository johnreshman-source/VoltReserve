from math import radians, sin, cos, sqrt, atan2

def calculate_distance(lat1, lng1, lat2, lng2):
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    
    Args:
        lat1, lng1: User's coordinates
        lat2, lng2: Station's coordinates
    
    Returns:
        Distance in km (float)
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlng / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c
    
    return round(distance, 2)

def is_within_radius(user_lat, user_lng, station_lat, station_lng, radius_km):
    """
    Check if user is within reservation radius of station
    
    Args:
        user_lat, user_lng: User's coordinates
        station_lat, station_lng: Station's coordinates
        radius_km: Allowed radius in kilometers
    
    Returns:
        Boolean
    """
    distance = calculate_distance(user_lat, user_lng, station_lat, station_lng)
    return distance <= radius_km