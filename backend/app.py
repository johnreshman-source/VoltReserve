import os
import sys
import secrets

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from sqlalchemy import inspect, text
from config import config

# When the app is launched as a script, make sure imports like `from app import db`
# resolve to this same module instance instead of creating a second `app` module.
if __name__ == '__main__':
    sys.modules.setdefault('app', sys.modules[__name__])

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name=None):
    """Application factory"""
    
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints (we'll create these next)
    with app.app_context():
        # Import models to register them
        from models.user import User
        from models.station import Station
        from models.port import Port
        from models.reservation import Reservation
        
        # Import routes
        from routes.auth import auth_bp
        from routes.stations import stations_bp
        from routes.reservations import reservations_bp
        from routes.qr import qr_bp
        from routes.device import device_bp
        from routes.admin import admin_bp
        
        # Register blueprints
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(stations_bp, url_prefix='/api/stations')
        app.register_blueprint(reservations_bp, url_prefix='/api/reservations')
        app.register_blueprint(qr_bp, url_prefix='/api/qr')
        app.register_blueprint(device_bp, url_prefix='/api/device')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        
        # Create tables
        db.create_all()

        # Add the QR token column to databases created before QR support.
        reservation_columns = {
            column['name'] for column in inspect(db.engine).get_columns('reservations')
        }
        if 'qr_token' not in reservation_columns:
            db.session.execute(text('ALTER TABLE reservations ADD COLUMN qr_token VARCHAR(64)'))
            db.session.commit()

        from models.reservation import Reservation
        for reservation in Reservation.query.filter_by(qr_token=None).all():
            reservation.qr_token = secrets.token_urlsafe(32)
        db.session.commit()
        
        # Initialize default station if it doesn't exist
        station = Station.query.first()
        if not station:
            station = Station(
                name=app.config['STATION_NAME'],
                latitude=app.config['STATION_LAT'],
                longitude=app.config['STATION_LNG'],
                address="123 EV Street, Green City"
            )
            db.session.add(station)
            db.session.commit()
            
            # Create 3 ports for the station
            for i in range(1, 4):
                port = Port(
                    port_number=i,
                    station_id=station.id,
                    status='AVAILABLE'
                )
                db.session.add(port)
            
            db.session.commit()
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500
    
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)