-- ============================================
-- VoltReserve Database Schema
-- Complete MySQL Database Setup
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS voltreserve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voltreserve;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    latitude FLOAT,
    longitude FLOAT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_is_admin (is_admin),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STATIONS TABLE
-- ============================================
CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    esp32_online BOOLEAN DEFAULT FALSE,
    last_heartbeat DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_esp32_online (esp32_online),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PORTS TABLE
-- ============================================
CREATE TABLE ports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    port_number INT NOT NULL,
    station_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    sensor_value INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_port_per_station (station_id, port_number),
    INDEX idx_station (station_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    qr_token VARCHAR(64) UNIQUE,
    user_id INT NOT NULL,
    station_id INT NOT NULL,
    port_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    duration_minutes INT DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (port_id) REFERENCES ports(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_station (station_id),
    INDEX idx_port (port_id),
    INDEX idx_status (status),
    INDEX idx_booking_id (booking_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_reserved_at (reserved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================

-- View: Current reservations with all details
CREATE OR REPLACE VIEW v_active_reservations AS
SELECT 
    r.id,
    r.booking_id,
    r.user_id,
    r.station_id,
    r.port_id,
    r.status,
    r.reserved_at,
    r.expires_at,
    TIMESTAMPDIFF(SECOND, NOW(), r.expires_at) as remaining_seconds,
    u.email as user_email,
    u.first_name,
    u.last_name,
    s.name as station_name,
    p.port_number
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN stations s ON r.station_id = s.id
JOIN ports p ON r.port_id = p.id
WHERE r.status = 'ACTIVE' AND r.expires_at > NOW();

-- View: Station status summary
CREATE OR REPLACE VIEW v_station_status AS
SELECT 
    s.id,
    s.name,
    s.address,
    s.latitude,
    s.longitude,
    s.esp32_online,
    s.last_heartbeat,
    COUNT(p.id) as total_ports,
    SUM(CASE WHEN p.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_ports,
    SUM(CASE WHEN p.status = 'RESERVED' THEN 1 ELSE 0 END) as reserved_ports,
    SUM(CASE WHEN p.status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_ports
FROM stations s
LEFT JOIN ports p ON s.id = p.station_id
GROUP BY s.id;

-- View: User booking history
CREATE OR REPLACE VIEW v_user_bookings AS
SELECT 
    r.id,
    r.booking_id,
    r.status,
    r.reserved_at,
    r.expires_at,
    r.started_at,
    r.completed_at,
    s.name as station_name,
    p.port_number,
    DATEDIFF(r.completed_at, r.reserved_at) as duration_days
FROM reservations r
JOIN stations s ON r.station_id = s.id
JOIN ports p ON r.port_id = p.id
WHERE r.user_id = (SELECT id FROM users LIMIT 1)
ORDER BY r.reserved_at DESC;

-- ============================================
-- STORED PROCEDURES (Optional - for automation)
-- ============================================

-- Procedure: Expire old reservations
DELIMITER //
CREATE PROCEDURE sp_expire_old_reservations()
BEGIN
    UPDATE reservations 
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' 
    AND expires_at < NOW();
    
    -- Release ports from expired reservations
    UPDATE ports p
    SET status = 'AVAILABLE'
    WHERE id IN (
        SELECT port_id FROM reservations 
        WHERE status = 'EXPIRED' AND expires_at < NOW()
    );
END //
DELIMITER ;

-- Procedure: Get station summary
DELIMITER //
CREATE PROCEDURE sp_get_station_summary(IN p_station_id INT)
BEGIN
    SELECT * FROM v_station_status WHERE id = p_station_id;
END //
DELIMITER ;

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- Insert default station
INSERT INTO stations (name, address, latitude, longitude, is_active, esp32_online)
VALUES (
    'VoltReserve Station',
    '123 EV Street, Green City, 110001',
    28.6139,
    77.2090,
    TRUE,
    FALSE
) ON DUPLICATE KEY UPDATE id=id;

-- Get the station ID (for ports insertion)
-- Ports will be auto-created by Flask app on first run

-- ============================================
-- TRIGGERS (Optional - for audit logging)
-- ============================================

-- Trigger: Log reservation changes
CREATE TABLE IF NOT EXISTS reservation_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    action VARCHAR(50),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reservation (reservation_id)
);

DELIMITER //
CREATE TRIGGER tr_log_reservation_status
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO reservation_audit_log 
        (reservation_id, action, old_status, new_status)
        VALUES 
        (NEW.id, 'STATUS_CHANGE', OLD.status, NEW.status);
    END IF;
END //
DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- These are already created above, but here's a summary:
-- - users: email, is_admin, created_at
-- - stations: is_active, esp32_online, coordinates
-- - ports: station, status
-- - reservations: user, station, port, status, booking_id, expires_at

-- ============================================
-- DATABASE PRIVILEGES (Optional)
-- ============================================

-- Create user for application (replace passwords!)
CREATE USER IF NOT EXISTS 'voltreserve_app'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON voltreserve.* TO 'voltreserve_app'@'localhost';
FLUSH PRIVILEGES;

-- Create read-only user for analytics (optional)
CREATE USER IF NOT EXISTS 'voltreserve_readonly'@'localhost' IDENTIFIED BY 'readonly_password_here';
GRANT SELECT ON voltreserve.* TO 'voltreserve_readonly'@'localhost';
FLUSH PRIVILEGES;

-- ============================================
-- DATABASE SETUP COMPLETE
-- ============================================