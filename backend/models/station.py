from app import db
from datetime import datetime

class Station(db.Model):
    """VoltReserve charging station model"""
    __tablename__ = 'stations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    esp32_online = db.Column(db.Boolean, default=False)
    last_heartbeat = db.Column(db.DateTime, nullable=True)  # Last time ESP32 contacted us
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ports = db.relationship('Port', backref='station', lazy=True, cascade='all, delete-orphan')
    reservations = db.relationship('Reservation', backref='station', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_ports=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'is_active': self.is_active,
            'esp32_online': self.esp32_online,
            'last_heartbeat': self.last_heartbeat.isoformat() + 'Z' if self.last_heartbeat else None,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
        }
        
        if include_ports:
            data['ports'] = [port.to_dict() for port in self.ports]
        
        return data
    
    def get_available_ports(self):
        """Get all available ports"""
        return [port for port in self.ports if port.status == 'AVAILABLE']
    
    def get_port_status_summary(self):
        """Get summary of all port statuses"""
        return {
            'available': len([p for p in self.ports if p.status == 'AVAILABLE']),
            'reserved': len([p for p in self.ports if p.status == 'RESERVED']),
            'occupied': len([p for p in self.ports if p.status == 'OCCUPIED']),
        }
    
    def __repr__(self):
        return f'<Station {self.name}>'