# VoltReserve Deployment Guide

Complete guide for deploying VoltReserve to production.

## Pre-Deployment Checklist

- [ ] Database backup strategy in place
- [ ] SSL/TLS certificates obtained
- [ ] Environment variables configured
- [ ] Backend tests passing
- [ ] Frontend build tested
- [ ] ESP32 firmware updated
- [ ] Admin account created
- [ ] Monitoring setup in place

## Production Environment Setup

### 1. Server Requirements

**Recommended Specs:**
- OS: Ubuntu 20.04 LTS or later
- CPU: 2+ cores
- RAM: 4GB+ (8GB recommended)
- Storage: 50GB+ SSD
- Network: Stable internet connection

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.9 python3-pip python3-venv -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y

# Install MySQL
sudo apt install mysql-server -y

# Install Nginx
sudo apt install nginx -y

# Install SSL certificates (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y

# Install Supervisor (process manager)
sudo apt install supervisor -y
```

### 3. Database Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
mysql -u root -p < database/schema.sql

# Create app user
mysql -u root -p -e "
CREATE USER 'voltreserve_app'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON voltreserve.* TO 'voltreserve_app'@'localhost';
FLUSH PRIVILEGES;
"

# Backup database regularly
mysqldump -u voltreserve_app -p voltreserve > backup.sql
```

### 4. Backend Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/voltreserve.git
cd voltreserve/backend

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure production environment
cp .env.example .env
nano .env  # Edit with production values

# Test backend
python app.py  # Should run without errors
```

### 5. Frontend Deployment

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output goes to dist/ directory
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/voltreserve`:

```nginx
# Frontend
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /var/www/voltreserve/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}

# API Backend
server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/voltreserve /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

### 7. SSL/TLS Certificate

```bash
# Get certificate
sudo certbot certonly --nginx -d example.com -d api.example.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 8. Process Management (Supervisor)

Create `/etc/supervisor/conf.d/voltreserve.conf`:

```ini
[program:voltreserve-backend]
directory=/var/www/voltreserve/backend
command=/var/www/voltreserve/backend/venv/bin/python app.py
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/voltreserve/backend.log

[program:voltreserve-scheduler]
directory=/var/www/voltreserve/backend
command=/var/www/voltreserve/backend/venv/bin/python scheduler.py
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/voltreserve/scheduler.log
```

Start supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start voltreserve-backend
```

### 9. Monitoring & Logging

```bash
# Create log directory
sudo mkdir -p /var/log/voltreserve
sudo chown www-data:www-data /var/log/voltreserve

# Monitor logs
tail -f /var/log/voltreserve/backend.log
```

### 10. Backup Strategy

```bash
# Daily database backup
0 2 * * * mysqldump -u voltreserve_app -p voltreserve > /backups/voltreserve_$(date +\%Y\%m\%d).sql

# Upload to cloud storage
# AWS S3, Google Cloud Storage, Azure Blob, etc.
```

## Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

```dockerfile
# Frontend Dockerfile
FROM node:16-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Performance Optimization

### Database
- Enable query caching
- Optimize indexes
- Regular maintenance
- Connection pooling

### Backend
- Enable gzip compression
- Use CDN for static files
- Implement caching
- Rate limiting

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Service workers

## Security Hardening

```bash
# Firewall configuration
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## Monitoring & Alerts

Setup monitoring with:
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **AlertManager** - Alerting
- **New Relic** or **DataDog** - APM

## Troubleshooting

### Backend won't start
```bash
# Check logs
journalctl -u voltreserve-backend -n 50

# Check port
sudo netstat -tulpn | grep 5000

# Test connection
curl http://localhost:5000/api/health
```

### Database connection issues
```bash
# Test MySQL
mysql -h localhost -u voltreserve_app -p voltreserve

# Check credentials
cat backend/.env | grep DATABASE_URL
```

### High memory usage
```bash
# Monitor processes
top -u www-data

# Restart services
sudo supervisorctl restart voltreserve-backend
```

## Maintenance

### Regular Tasks
- Monitor disk space
- Review error logs
- Update dependencies
- Database optimization
- Security patches

### Monthly
- Database backup verification
- Performance review
- User feedback analysis
- Feature planning

### Quarterly
- Security audit
- Dependency updates
- Performance benchmarking
- Disaster recovery test

---

See README.md for development setup guide.