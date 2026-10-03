from app import db
from datetime import datetime

class Port(db.Model):
    """Charging port model"""
    __tablename__ = 'ports'
    
    id = db.Column(db.Integer, primary_key=True)
    port_number = db.Column(db.Integer, nullable=False)  # 1, 2, or 3
    station_id = db.Column(db.Integer, db.ForeignKey('stations.id'), nullable=False)
    status = db.Column(db.String(20), default='AVAILABLE')  # AVAILABLE, RESERVED, OCCUPIED
    sensor_value = db.Column(db.Integer, nullable=True)  # Raw sensor reading from ESP32
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reservations = db.relationship('Reservation', backref='port', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'port_number': self.port_number,
            'station_id': self.station_id,
            'status': self.status,
            'sensor_value': self.sensor_value,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Port {self.port_number} - {self.status}>'