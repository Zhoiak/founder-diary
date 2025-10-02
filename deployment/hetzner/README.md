# 🚀 Founder Diary - Hetzner Deployment Guide

Complete self-hosted deployment on Hetzner AX41-NVMe with Supabase stack.

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Hetzner AX41-NVMe                        │
│  ┌─────────────┐  ┌──────────────────────────────────────┐  │
│  │    Caddy    │  │           Docker Compose             │  │
│  │ (Reverse    │  │  ┌─────────────────────────────────┐ │  │
│  │  Proxy)     │  │  │        Supabase Stack           │ │  │
│  │             │  │  │  • PostgreSQL + Extensions      │ │  │
│  │ Auto-HTTPS  │  │  │  • Kong API Gateway             │ │  │
│  │ Let's       │  │  │  • GoTrue Auth                  │ │  │
│  │ Encrypt     │  │  │  • PostgREST API                │ │  │
│  └─────────────┘  │  │  • Realtime Server              │ │  │
│                   │  │  • Storage API                  │ │  │
│  ┌─────────────┐  │  │  • Studio Dashboard             │ │  │
│  │ Monitoring  │  │  └─────────────────────────────────┘ │  │
│  │ • Prometheus│  │  ┌─────────────────────────────────┐ │  │
│  │ • Grafana   │  │  │      Founder Diary App          │ │  │
│  │ • Alerting  │  │  │      (Next.js Container)        │ │  │
│  └─────────────┘  │  └─────────────────────────────────┘ │  │
│                   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Domain Structure

- **app.founder-diary.com** → Next.js Application
- **supabase.founder-diary.com** → Supabase API Gateway
- **studio.founder-diary.com** → Supabase Studio (Admin)
- **monitoring.founder-diary.com** → Grafana Dashboard

## 🛠️ Prerequisites

### Server Requirements
- **Hetzner AX41-NVMe** (or similar)
  - 6 cores / 12 threads (AMD Ryzen 5 3600)
  - 64 GB DDR4 RAM
  - 2 × 512 GB NVMe SSD
  - 1 Gbps network

### Software Requirements
- Ubuntu 24.04 LTS
- Docker & Docker Compose
- Caddy web server
- Restic (for backups)

## 🚀 Quick Start Deployment

### 1. Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# Install Restic for backups
apt install restic -y
```

### 2. Clone and Setup

```bash
# Create deployment directory
mkdir -p /opt/founder-diary
cd /opt/founder-diary

# Clone repository
git clone https://github.com/your-username/founder-diary.git .

# Copy Hetzner deployment files
cp -r deployment/hetzner/* .

# Create required directories
mkdir -p volumes/{db,storage,logs,functions}
mkdir -p logs/caddy
```

### 3. Environment Configuration

```bash
# Copy and edit environment file
cp .env.example .env
nano .env

# Generate secure passwords
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For JWT_SECRET

# Configure SMTP settings (use Postmark, Mailgun, etc.)
```

### 4. SSL/TLS Setup

```bash
# Copy Caddyfile
cp Caddyfile /etc/caddy/Caddyfile

# Test Caddy configuration
caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
systemctl enable caddy
systemctl start caddy
```

### 5. Deploy Supabase Stack

```bash
# Download Supabase configuration files
curl -L https://github.com/supabase/supabase/archive/master.zip -o supabase.zip
unzip supabase.zip
cp -r supabase-master/docker/volumes ./

# Start Supabase services
docker compose up -d

# Check services status
docker compose ps
```

### 6. Deploy Monitoring

```bash
# Start monitoring stack
cd monitoring
docker compose up -d

# Access Grafana at https://monitoring.founder-diary.com
# Default: admin / founder-diary-admin-2024
```

## 🔧 Configuration Details

### Environment Variables (.env)

```bash
# Database
POSTGRES_PASSWORD=your-super-secure-password
JWT_SECRET=your-jwt-secret-32-chars-minimum

# API Keys (generate new ones for production)
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key

# SMTP Configuration
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### DNS Configuration

Point these domains to your server IP:

```
A    app.founder-diary.com        → YOUR_SERVER_IP
A    supabase.founder-diary.com   → YOUR_SERVER_IP
A    studio.founder-diary.com     → YOUR_SERVER_IP
A    monitoring.founder-diary.com → YOUR_SERVER_IP
A    founder-diary.com            → YOUR_SERVER_IP
A    www.founder-diary.com        → YOUR_SERVER_IP
```

## 💾 Backup Configuration

### 1. Setup Hetzner Storage Box

```bash
# Create backup directories
mkdir -p /etc/restic

# Generate SSH key for Storage Box
ssh-keygen -t ed25519 -f /etc/restic/ssh_key -N ""

# Add public key to your Hetzner Storage Box
cat /etc/restic/ssh_key.pub
# Copy this to your Storage Box authorized_keys

# Create password file
echo "your-restic-password" > /etc/restic/password
chmod 600 /etc/restic/password

# Create postgres password file
echo "your-postgres-password" > /etc/restic/postgres_password
chmod 600 /etc/restic/postgres_password
```

### 2. Setup Automated Backups

```bash
# Make backup script executable
chmod +x backup-script.sh

# Test backup manually
./backup-script.sh

# Setup cron job for daily backups
crontab -e
# Add: 0 2 * * * /opt/founder-diary/backup-script.sh
```

## 📊 Monitoring & Alerting

### Grafana Dashboards

Access monitoring at `https://monitoring.founder-diary.com`:

- **System Overview**: CPU, Memory, Disk, Network
- **Docker Containers**: Container health and resource usage
- **Database Metrics**: PostgreSQL performance and queries
- **Application Metrics**: API response times, error rates
- **Backup Status**: Backup success/failure tracking

### Key Metrics to Monitor

- **System Resources**: CPU > 80%, Memory > 85%, Disk > 90%
- **Database**: Connection count, query performance, replication lag
- **Application**: Response time > 2s, Error rate > 5%
- **Backups**: Failed backups, backup age > 25 hours

## 🔒 Security Checklist

- [ ] SSH key-only authentication
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed and configured
- [ ] SSL certificates auto-renewing
- [ ] Database passwords rotated
- [ ] Backup encryption enabled
- [ ] Monitoring alerts configured
- [ ] Regular security updates enabled

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker compose logs -f service-name

# Check disk space
df -h

# Check memory usage
free -h
```

**SSL certificate issues:**
```bash
# Check Caddy logs
journalctl -u caddy -f

# Test certificate renewal
caddy reload --config /etc/caddy/Caddyfile
```

**Database connection issues:**
```bash
# Check PostgreSQL logs
docker compose logs supabase-db

# Test database connection
docker exec -it supabase-db psql -U postgres
```

### Performance Optimization

**For high traffic:**
- Enable PostgreSQL connection pooling
- Configure Redis for caching
- Add read replicas
- Implement CDN for static assets

## 📈 Scaling Path

### Phase 1: Single Server (Current)
- All services on one Hetzner dedicated server
- Suitable for up to 10k users

### Phase 2: Horizontal Scaling
- Add Hetzner Cloud instances via vSwitch
- Separate app servers from database
- Load balancer for high availability

### Phase 3: Kubernetes Migration
- Deploy on k3s or managed Kubernetes
- Auto-scaling based on metrics
- Multi-region deployment

## 📞 Support

For deployment issues:
1. Check logs: `docker compose logs -f`
2. Verify configuration: `caddy validate`
3. Test connectivity: `curl -I https://app.founder-diary.com`
4. Review monitoring: `https://monitoring.founder-diary.com`

## 📝 Maintenance Tasks

### Daily
- [ ] Check backup status
- [ ] Review monitoring alerts
- [ ] Check disk space

### Weekly
- [ ] Review security logs
- [ ] Update system packages
- [ ] Test backup restoration

### Monthly
- [ ] Rotate passwords
- [ ] Review performance metrics
- [ ] Update Docker images
- [ ] Security audit
