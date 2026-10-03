from app import db
from datetime import datetime, timedelta
import uuid
import secrets

class Reservation(db.Model):
    """Reservation/Booking model"""
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))  # Unique booking ID for QR
    qr_token = db.Column(db.String(64), unique=True, nullable=True, default=lambda: secrets.token_urlsafe(32))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    station_id = db.Column(db.Integer, db.ForeignKey('stations.id'), nullable=False)
    port_id = db.Column(db.Integer, db.ForeignKey('ports.id'), nullable=False)
    
    # Status: ACTIVE, COMPLETED, EXPIRED, CANCELLED
    status = db.Column(db.String(20), default='ACTIVE')
    
    # Timestamps
    reserved_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)  # Calculated: reserved_at + 30 minutes
    started_at = db.Column(db.DateTime, nullable=True)  # When user actually started charging
    completed_at = db.Column(db.DateTime, nullable=True)  # When charging completed
    cancelled_at = db.Column(db.DateTime, nullable=True)  # When user cancelled
    
    # Metadata
    duration_minutes = db.Column(db.Integer, default=30)  # Reservation duration in minutes
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Auto-calculate expiry time on creation
        if self.reserved_at:
            self.expires_at = self.reserved_at + timedelta(minutes=self.duration_minutes)
    
    def is_expired(self):
        """Check if reservation has expired"""
        return datetime.utcnow() > self.expires_at
    
    def get_remaining_time(self):
        """Get remaining time in seconds"""
        if self.is_expired():
            return 0
        remaining = self.expires_at - datetime.utcnow()
        return max(0, int(remaining.total_seconds()))
    
    def to_dict(self, include_user=False, include_station=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'booking_id': self.booking_id,
            'user_id': self.user_id,
            'station_id': self.station_id,
            'port_id': self.port_id,
            'status': self.status,
            'reserved_at': self.reserved_at.isoformat() + 'Z' if self.reserved_at else None,
            'expires_at': self.expires_at.isoformat() + 'Z' if self.expires_at else None,
            'started_at': self.started_at.isoformat() + 'Z' if self.started_at else None,
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None,
            'cancelled_at': self.cancelled_at.isoformat() + 'Z' if self.cancelled_at else None,
            'duration_minutes': self.duration_minutes,
            'remaining_time': self.get_remaining_time(),
            'is_expired': self.is_expired(),
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }
        
        if include_user:
            data['user'] = self.user.to_dict()
        
        if include_station:
            data['station'] = self.station.to_dict()

        data['port'] = self.port.to_dict() if self.port else None
        
        return data
    
    def __repr__(self):
        return f'<Reservation {self.booking_id}>'