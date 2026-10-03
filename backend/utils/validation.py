import re
from datetime import datetime

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not email or not re.match(pattern, email):
        raise ValidationError('Invalid email format')
    return email

def validate_password(password):
    """Validate password strength"""
    if not password:
        raise ValidationError('Password is required')
    if len(password) < 6:
        raise ValidationError('Password must be at least 6 characters')
    return password

def validate_name(name, field_name='Name'):
    """Validate name field"""
    if not name or len(name.strip()) == 0:
        raise ValidationError(f'{field_name} is required')
    if len(name) > 50:
        raise ValidationError(f'{field_name} must be less than 50 characters')
    return name.strip()

def validate_phone(phone):
    """Validate phone number"""
    if phone:
        # Remove spaces and dashes
        phone = phone.replace(' ', '').replace('-', '')
        if not re.match(r'^\d{10,15}$', phone):
            raise ValidationError('Invalid phone number format')
    return phone

def validate_coordinates(lat, lng):
    """Validate latitude and longitude"""
    try:
        lat = float(lat)
        lng = float(lng)
        if lat < -90 or lat > 90:
            raise ValidationError('Latitude must be between -90 and 90')
        if lng < -180 or lng > 180:
            raise ValidationError('Longitude must be between -180 and 180')
        return lat, lng
    except (TypeError, ValueError):
        raise ValidationError('Invalid coordinates')

def validate_registration_data(data):
    """Validate complete registration data"""
    errors = {}
    
    try:
        validate_email(data.get('email', ''))
    except ValidationError as e:
        errors['email'] = str(e)
    
    try:
        validate_password(data.get('password', ''))
    except ValidationError as e:
        errors['password'] = str(e)
    
    try:
        validate_name(data.get('first_name', ''), 'First name')
    except ValidationError as e:
        errors['first_name'] = str(e)
    
    try:
        validate_name(data.get('last_name', ''), 'Last name')
    except ValidationError as e:
        errors['last_name'] = str(e)
    
    if data.get('phone'):
        try:
            validate_phone(data.get('phone'))
        except ValidationError as e:
            errors['phone'] = str(e)
    
    return errors

def validate_login_data(data):
    """Validate login data"""
    errors = {}
    
    try:
        validate_email(data.get('email', ''))
    except ValidationError as e:
        errors['email'] = str(e)
    
    if not data.get('password'):
        errors['password'] = 'Password is required'
    
    return errors