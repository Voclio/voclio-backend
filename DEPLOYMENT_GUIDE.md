# Voclio API - Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ running
- Domain with SSL certificate (for production)
- SMTP credentials or Resend API key
- AI API keys (AssemblyAI, OpenRouter or Gemini)

---

## 📋 Step-by-Step Deployment

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd voclio-api

# Install dependencies
npm install

# Create logs directory
mkdir -p logs
mkdir -p uploads/voice
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Required Variables:**
```bash
# Server
NODE_ENV=production
PORT=3000

# Database (CRITICAL - Don't use defaults!)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=voclio_db
DB_USER=voclio_user
DB_PASSWORD=<STRONG-PASSWORD-HERE>

# JWT Secrets (CRITICAL - Generate strong secrets!)
JWT_SECRET=<GENERATE-32-CHAR-SECRET>
JWT_REFRESH_SECRET=<GENERATE-32-CHAR-SECRET>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS (CRITICAL - Set your domains!)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Email (Choose one)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com

# AI Services (At least one required)
ASSEMBLYAI_API_KEY=your-assemblyai-key
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key

# OAuth (Optional - for calendar integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/google/callback

WEBEX_CLIENT_ID=your-webex-client-id
WEBEX_CLIENT_SECRET=your-webex-client-secret
WEBEX_REDIRECT_URI=https://yourdomain.com/api/webex/callback
```

### 3. Generate Strong Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy these to your .env file
```

### 4. Initialize Database

```bash
# Create database
createdb voclio_db

# Run schema
psql voclio_db < database/schema.sql

# Or use the init script
npm run init-db
```

### 5. Test Configuration

```bash
# Start server (will validate config)
npm start

# You should see:
# ✅ Database models synchronized
# ✅ Email service is ready
# 🕐 Starting cron jobs...
# 🚀 Voclio API Server
# ✨ Server is ready to accept requests
```

If you see errors, check:
- Database credentials
- JWT secrets (not default values)
- ALLOWED_ORIGINS is set

### 6. Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":...}
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop services
docker-compose down
```

**What's Included:**
- PostgreSQL database
- Voclio API server
- Redis (for future caching)
- Automatic health checks
- Volume persistence

### Environment Variables for Docker

Create `.env` file in project root (docker-compose will use it):

```bash
# Same as above, but use service names for hosts
DB_HOST=postgres
DB_PORT=5432
# ... rest of variables
```

---

## 🌐 Reverse Proxy Setup (Nginx)

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Increase body size for file uploads
    client_max_body_size 10M;
}
```

### Apply Configuration

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔄 Process Management (PM2)

### Install PM2

```bash
npm install -g pm2
```

### Start Application

```bash
# Start with PM2
pm2 start server.js --name voclio-api

# Start with environment file
pm2 start server.js --name voclio-api --env production

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### PM2 Commands

```bash
# View logs
pm2 logs voclio-api

# Monitor
pm2 monit

# Restart
pm2 restart voclio-api

# Stop
pm2 stop voclio-api

# Delete
pm2 delete voclio-api
```

### PM2 Ecosystem File (Optional)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'voclio-api',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

Start with:
```bash
pm2 start ecosystem.config.js
```

---

## 📊 Monitoring

### Log Files

```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# PM2 logs (if using PM2)
pm2 logs voclio-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/health

# Database connectivity
psql -h localhost -U voclio_user -d voclio_db -c "SELECT 1"
```

### Key Metrics to Monitor

1. **Error Rate**: Check `logs/error.log` for spikes
2. **Response Time**: Monitor slow requests
3. **Rate Limiting**: Check for abuse patterns
4. **Database Connections**: Monitor pool usage
5. **Disk Space**: Logs and uploads directories
6. **Memory Usage**: Node.js process memory

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Strong JWT secrets (32+ characters)
- [ ] Strong database password
- [ ] CORS configured with actual domains
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Database not publicly accessible
- [ ] Environment variables not in git
- [ ] Rate limiting enabled
- [ ] File upload limits configured
- [ ] Logs directory has proper permissions
- [ ] Regular backups configured

### Recommended Security Headers (Already in Helmet)

- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ X-XSS-Protection
- ✅ Content-Security-Policy
- ✅ Strict-Transport-Security (via Nginx)

---

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
npm run migrate

# Restart application
pm2 restart voclio-api

# Or with Docker
docker-compose down
docker-compose up -d --build
```

### Database Backups

```bash
# Manual backup
pg_dump voclio_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (crontab)
0 2 * * * pg_dump voclio_db > /backups/voclio_$(date +\%Y\%m\%d).sql
```

### Log Rotation

Winston handles log rotation automatically (5MB max, 5 files).

For additional rotation:

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/voclio

# Add:
/path/to/voclio-api/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Error: "JWT_SECRET must be set to a strong secret value"**
- Solution: Generate strong secret and add to `.env`

**Error: "Database connection failed"**
- Check database is running: `systemctl status postgresql`
- Verify credentials in `.env`
- Check database exists: `psql -l`

**Error: "ALLOWED_ORIGINS must be set in production"**
- Add your domains to `.env`: `ALLOWED_ORIGINS=https://yourdomain.com`

### High Memory Usage

```bash
# Check Node.js memory
pm2 monit

# Restart if needed
pm2 restart voclio-api
```

### Slow API Responses

1. Check database queries in logs
2. Monitor AI API response times
3. Check disk I/O (uploads directory)
4. Consider adding Redis caching

### File Upload Failures

1. Check disk space: `df -h`
2. Check directory permissions: `ls -la uploads/`
3. Check file size limits in Nginx
4. Check logs for specific errors

---

## 📞 Support

### Getting Help

1. Check logs: `logs/error.log`
2. Check documentation: `docs/` directory
3. Review API documentation: `http://localhost:3000/api`

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token, may be expired |
| 429 Too Many Requests | Rate limit hit, wait 15 minutes |
| 408 Request Timeout | AI processing taking too long, check API keys |
| 500 Internal Error | Check `logs/error.log` for details |

---

## 🎯 Performance Tuning

### Node.js Optimization

```bash
# Increase memory limit if needed
NODE_OPTIONS="--max-old-space-size=2048" pm2 start server.js
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);

-- Analyze tables
ANALYZE tasks;
ANALYZE notes;
ANALYZE voice_recordings;
```

### Nginx Caching (Optional)

```nginx
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    # ... rest of proxy config
}
```

---

## ✅ Post-Deployment Checklist

- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Can upload voice recording
- [ ] Can transcribe audio
- [ ] Can create tasks from voice
- [ ] Email notifications work
- [ ] Rate limiting works (test with many requests)
- [ ] CORS blocks unauthorized origins
- [ ] HTTPS works (no mixed content warnings)
- [ ] Logs are being written
- [ ] Backups are configured
- [ ] Monitoring is set up

---

**Last Updated**: 2026-04-23
**Version**: 1.0.0
