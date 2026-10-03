from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask_jwt_extended.exceptions import JWTExtendedException

def create_tokens(user_id, user_email, is_admin=False):
    """Create access and refresh tokens"""
    additional_claims = {
        'email': user_email,
        'is_admin': is_admin,
    }
    
    access_token = create_access_token(
        identity=str(user_id),
        additional_claims=additional_claims
    )
    
    refresh_token = create_refresh_token(
        identity=str(user_id),
        additional_claims=additional_claims
    )
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
    }

def token_required(fn):
    """Decorator to check if valid JWT token is provided"""
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return fn(int(user_id), *args, **kwargs)
        except JWTExtendedException as e:
            return {'error': 'Invalid or expired token'}, 401
    
    return decorated_function

def admin_required(fn):
    """Decorator to check if user is admin"""
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = int(get_jwt_identity())
            
            # Import here to avoid circular imports
            from models.user import User
            from app import db
            
            user = User.query.get(user_id)
            if not user or not user.is_admin:
                return {'error': 'Admin access required'}, 403
            
            return fn(user_id, *args, **kwargs)
        except JWTExtendedException:
            return {'error': 'Invalid or expired token'}, 401
    
    return decorated_function

def get_user_from_token():
    """Extract user ID from current JWT token"""
    try:
        verify_jwt_in_request()
        return get_jwt_identity()
    except:
        return None