#!/bin/bash
# Security Hardening Script for Hetzner + Coolify

set -e

echo "🔒 Starting security hardening..."

# STEP 1: UPDATE SYSTEM
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# STEP 2: CONFIGURE UFW FIREWALL
echo "🛡️ Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow essential services
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp comment 'Coolify Admin'

# Enable firewall
ufw --force enable

# STEP 3: CONFIGURE FAIL2BAN
echo "🚫 Setting up Fail2Ban..."
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[coolify]
enabled = true
port = 8000
logpath = /var/log/coolify/error.log
maxretry = 2
bantime = 7200
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# STEP 4: SECURE SSH
echo "🔑 Securing SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

cat > /etc/ssh/sshd_config << 'EOF'
# Secure SSH Configuration
Port 22
Protocol 2

# Authentication
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes

# Security settings
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server

# Rate limiting
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

systemctl restart sshd

# STEP 5: INSTALL SECURITY TOOLS
echo "🔧 Installing security monitoring tools..."
apt install -y \
    unattended-upgrades \
    logwatch \
    rkhunter \
    chkrootkit \
    aide

# Configure automatic updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# STEP 6: SETUP LOG MONITORING
echo "📊 Setting up log monitoring..."
cat > /etc/logwatch/conf/logwatch.conf << 'EOF'
LogDir = /var/log
TmpDir = /var/cache/logwatch
MailTo = your-email@domain.com
MailFrom = server@yourdomain.com
Print = No
Save = /var/cache/logwatch
Range = yesterday
Detail = Med
Service = All
mailer = "/usr/sbin/sendmail -t"
EOF

# STEP 7: SETUP AUTOMATED BACKUPS
echo "💾 Setting up automated backups..."
mkdir -p /opt/backups

cat > /opt/backups/backup-script.sh << 'EOF'
#!/bin/bash
# Automated Backup Script

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="founder_diary"
DB_USER="founder_user"

# Database backup
docker exec postgres pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application data backup
tar -czf $BACKUP_DIR/app_data_$DATE.tar.gz /var/lib/docker/volumes/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backups/backup-script.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backups/backup-script.sh") | crontab -

# STEP 8: SETUP MONITORING
echo "📈 Setting up system monitoring..."
apt install -y htop iotop nethogs

# Create monitoring script
cat > /opt/monitor.sh << 'EOF'
#!/bin/bash
# System Monitoring Script

echo "=== System Status $(date) ===" >> /var/log/system-monitor.log
echo "CPU Usage:" >> /var/log/system-monitor.log
top -bn1 | grep "Cpu(s)" >> /var/log/system-monitor.log
echo "Memory Usage:" >> /var/log/system-monitor.log
free -h >> /var/log/system-monitor.log
echo "Disk Usage:" >> /var/log/system-monitor.log
df -h >> /var/log/system-monitor.log
echo "Docker Status:" >> /var/log/system-monitor.log
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> /var/log/system-monitor.log
echo "================================" >> /var/log/system-monitor.log
EOF

chmod +x /opt/monitor.sh
(crontab -l 2>/dev/null; echo "*/15 * * * * /opt/monitor.sh") | crontab -

echo "✅ Security hardening completed!"
echo "🔍 Security checklist:"
echo "   ✅ Firewall configured (UFW)"
echo "   ✅ Fail2Ban installed and configured"
echo "   ✅ SSH hardened (key-only access)"
echo "   ✅ Automatic security updates enabled"
echo "   ✅ Log monitoring configured"
echo "   ✅ Automated backups scheduled"
echo "   ✅ System monitoring active"
echo ""
echo "🚨 IMPORTANT: Test SSH access before closing this session!"
echo "🔑 Make sure you can connect with your SSH key"
