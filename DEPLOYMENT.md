# FriendsChat Deployment Guide

## Production Deployment Checklist

### 1. Environment Configuration

Create a production `.env` file with secure values:

```bash
# Production MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/friendschat?retryWrites=true&w=majority

# Generate secure JWT secret (use: openssl rand -base64 64)
JWT_SECRET=your_production_jwt_secret_here

# Generate secure encryption key (exactly 32 characters)
ENCRYPTION_KEY=your_32_char_production_key_here

# Production port
PORT=3000

# Environment
NODE_ENV=production
```

### 2. MongoDB Atlas Setup

1. **Create Production Cluster**
   - Log into MongoDB Atlas
   - Create a new cluster (M0 free tier or higher)
   - Choose region closest to your server

2. **Configure Network Access**
   - Add your server's IP address to whitelist
   - Or use 0.0.0.0/0 for all IPs (less secure)

3. **Create Database User**
   - Create a user with readWrite permissions
   - Use strong password
   - Note username and password for connection string

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `friendschat`

### 3. Server Requirements

**Minimum Specifications:**
- Node.js 14.x or higher
- 512 MB RAM minimum (1 GB recommended)
- 10 GB disk space
- Ubuntu 20.04 LTS or similar

**Recommended Hosting Providers:**
- DigitalOcean
- AWS EC2
- Heroku
- Google Cloud Platform
- Microsoft Azure

### 4. Deployment Steps

#### Option A: Traditional Server (Ubuntu/Debian)

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Git
sudo apt install -y git

# 4. Clone repository
cd /opt
sudo git clone https://github.com/code2344/FriendsChat.git
cd FriendsChat

# 5. Install dependencies
sudo npm install --production

# 6. Create .env file
sudo nano .env
# (Paste production environment variables)

# 7. Install PM2 for process management
sudo npm install -g pm2

# 8. Start application with PM2
sudo pm2 start src/server.js --name friendschat

# 9. Configure PM2 to start on boot
sudo pm2 startup
sudo pm2 save

# 10. Check application status
sudo pm2 status
sudo pm2 logs friendschat
```

#### Option B: Heroku Deployment

```bash
# 1. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create Heroku app
heroku create friendschat-app

# 4. Set environment variables
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set ENCRYPTION_KEY="your_encryption_key"
heroku config:set NODE_ENV="production"

# 5. Deploy
git push heroku main

# 6. Open application
heroku open

# 7. View logs
heroku logs --tail
```

#### Option C: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  friendschat:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

Deploy:
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 5. SSL/TLS Configuration

#### Using Nginx as Reverse Proxy

```bash
# 1. Install Nginx
sudo apt install -y nginx

# 2. Create Nginx configuration
sudo nano /etc/nginx/sites-available/friendschat
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 3. Enable site
sudo ln -s /etc/nginx/sites-available/friendschat /etc/nginx/sites-enabled/

# 4. Test configuration
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# 7. Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 8. Auto-renewal
sudo certbot renew --dry-run
```

### 6. Security Hardening

**Rate Limiting (Critical for Authorization Codes)**

The authorization code feature requires rate limiting to prevent abuse:

1. **Nginx Rate Limiting**
   ```nginx
   # Add to nginx.conf
   limit_req_zone $binary_remote_addr zone=auth_codes:10m rate=10r/m;
   
   location /api/authorization-codes {
       limit_req zone=auth_codes burst=5 nodelay;
       proxy_pass http://localhost:3000;
   }
   ```

2. **Application-Level (Alternative)**
   - Install: `npm install express-rate-limit`
   - Add middleware to protect authorization code routes
   - See AUTHORIZATION_CODES.md for detailed recommendations

3. **CloudFlare (Recommended)**
   - Enable CloudFlare rate limiting rules
   - Set up alerts for suspicious patterns
   - Monitor authorization code access attempts

```bash
# 1. Setup firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 2. Install fail2ban
sudo apt install -y fail2ban

# 3. Configure automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 4. Create non-root user for running app
sudo useradd -m -s /bin/bash friendschat
sudo chown -R friendschat:friendschat /opt/FriendsChat
```

### 7. Monitoring & Logging

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs friendschat --lines 100

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# System monitoring
sudo apt install -y htop
htop
```

### 8. Backup Strategy

```bash
# Create backup script
sudo nano /opt/backup-friendschat.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB (requires mongodump)
# Configure MongoDB Atlas backups in their dashboard

# Backup application files
tar -czf $BACKUP_DIR/friendschat_$DATE.tar.gz /opt/FriendsChat

# Keep only last 7 days of backups
find $BACKUP_DIR -name "friendschat_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /opt/backup-friendschat.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /opt/backup-friendschat.sh
```

### 9. Performance Optimization

1. **Enable Gzip Compression** (in Nginx)
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

2. **Database Indexing**
```javascript
// Add indexes in MongoDB
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.messages.createIndex({ "channel": 1, "createdAt": -1 })
db.directMessages.createIndex({ "sender": 1, "recipient": 1, "createdAt": -1 })
```

3. **Caching** (Optional - Redis)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

### 10. Post-Deployment Verification

```bash
# Check application is running
curl http://localhost:3000

# Check SSL certificate
curl https://your-domain.com

# Monitor system resources
htop

# Check application logs
pm2 logs friendschat

# Verify MongoDB connection
# Check logs for "MongoDB connected successfully"

# Test master admin login
# Navigate to https://your-domain.com/login
# Username: SuperCode111, Password: NewTown2011
```

### 11. Maintenance

**Weekly Tasks:**
- Review application logs
- Check disk space
- Monitor system resources
- Review pending user registrations
- Check for security updates

**Monthly Tasks:**
- Review and update dependencies
- Check backup integrity
- Review SSL certificate expiration
- Database performance optimization
- Security audit

### 12. Troubleshooting

**Application won't start:**
```bash
# Check logs
pm2 logs friendschat --lines 50

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 env 0
```

**Database connection issues:**
- Verify MongoDB Atlas network access
- Check connection string in .env
- Verify database user credentials
- Check MongoDB Atlas cluster status

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew
```

### 13. Scaling Considerations

For high traffic:
1. Use load balancer (Nginx, HAProxy, or cloud load balancer)
2. Deploy multiple instances
3. Use Redis for session storage
4. Implement caching layer
5. Use CDN for static assets
6. Upgrade MongoDB Atlas tier
7. Implement rate limiting

### 14. Support & Updates

**Updating the application:**
```bash
cd /opt/FriendsChat
sudo git pull
sudo npm install --production
sudo pm2 restart friendschat
```

**Rolling back:**
```bash
cd /opt/FriendsChat
sudo git log --oneline
sudo git checkout <commit-hash>
sudo pm2 restart friendschat
```

## Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables set
- [ ] Application deployed and running
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] PM2 configured for auto-restart
- [ ] Nginx reverse proxy configured
- [ ] Backup system in place
- [ ] Monitoring configured
- [ ] Master admin account verified
- [ ] Test user registration flow
- [ ] Test messaging functionality
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team notified of deployment

## Emergency Contacts

- Server Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Master Admin: Ruben Sutton (ruben.sutton@school.edu)

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
