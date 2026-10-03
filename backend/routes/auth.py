from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models.user import User
from utils.validation import (
    validate_registration_data,
    validate_login_data,
    validate_email,
    validate_password,
    ValidationError
)
from utils.auth import create_tokens, token_required

auth_bp = Blueprint('auth', __name__)

# ==================== REGISTER ====================
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Request body:
    {
        "email": "user@example.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "1234567890" (optional)
    }
    """
    data = request.get_json()
    
    if not data:
        return {'error': 'No data provided'}, 400
    
    # Validate input
    errors = validate_registration_data(data)
    if errors:
        return {'errors': errors}, 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return {'error': 'Email already registered'}, 409
    
    try:
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        tokens = create_tokens(user.id, user.email, user.is_admin)
        
        return {
            'message': 'Registration successful',
            'user': user.to_dict(),
            'tokens': tokens,
        }, 201
    
    except Exception as e:
        db.session.rollback()
        return {'error': f'Registration failed: {str(e)}'}, 500

# ==================== LOGIN ====================
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and get JWT tokens
    
    Request body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    data = request.get_json()
    
    if not data:
        return {'error': 'No data provided'}, 400
    
    # Validate input
    errors = validate_login_data(data)
    if errors:
        return {'errors': errors}, 400
    
    try:
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return {'error': 'Invalid email or password'}, 401
        
        # Check password
        if not user.check_password(data['password']):
            return {'error': 'Invalid email or password'}, 401
        
        # Generate tokens
        tokens = create_tokens(user.id, user.email, user.is_admin)
        
        return {
            'message': 'Login successful',
            'user': user.to_dict(),
            'tokens': tokens,
        }, 200
    
    except Exception as e:
        return {'error': f'Login failed: {str(e)}'}, 500

# ==================== GET CURRENT USER ====================
@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(user_id):
    """
    Get current authenticated user info
    
    Headers:
    Authorization: Bearer <access_token>
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}, 404
        
        return {
            'user': user.to_dict(include_sensitive=True),
        }, 200
    
    except Exception as e:
        return {'error': f'Failed to fetch user: {str(e)}'}, 500

# ==================== UPDATE LOCATION ====================
@auth_bp.route('/location', methods=['POST'])
@token_required
def update_location(user_id):
    """
    Update user's current location
    
    Headers:
    Authorization: Bearer <access_token>
    
    Request body:
    {
        "latitude": 28.6139,
        "longitude": 77.2090
    }
    """
    data = request.get_json()
    
    if not data or 'latitude' not in data or 'longitude' not in data:
        return {'error': 'Latitude and longitude are required'}, 400
    
    try:
        from utils.validation import validate_coordinates
        lat, lng = validate_coordinates(data['latitude'], data['longitude'])
        
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        user.latitude = lat
        user.longitude = lng
        db.session.commit()
        
        return {
            'message': 'Location updated',
            'user': user.to_dict(include_sensitive=True),
        }, 200
    
    except ValidationError as e:
        return {'error': str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {'error': f'Failed to update location: {str(e)}'}, 500

# ==================== LOGOUT ====================
@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(user_id):
    """
    Logout (note: JWT tokens are stateless, so actual logout happens on client side)
    This endpoint can be used for logging out from server-side blacklist if implemented
    
    Headers:
    Authorization: Bearer <access_token>
    """
    return {
        'message': 'Logout successful. Please discard your token on the client side.',
    }, 200

# ==================== VERIFY TOKEN ====================
@auth_bp.route('/verify', methods=['POST'])
@token_required
def verify_token(user_id):
    """
    Verify if JWT token is still valid
    
    Headers:
    Authorization: Bearer <access_token>
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}, 404
        
        return {
            'valid': True,
            'user': user.to_dict(),
        }, 200
    except Exception as e:
        return {'error': f'Token verification failed: {str(e)}'}, 500