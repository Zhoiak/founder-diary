#!/bin/bash
# Performance Monitoring Dashboard Setup

echo "📊 Setting up performance monitoring..."

# STEP 1: INSTALL MONITORING TOOLS
apt install -y prometheus grafana-server node-exporter

# STEP 2: CONFIGURE PROMETHEUS
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
  
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
EOF

# STEP 3: SETUP GRAFANA DASHBOARDS
systemctl enable grafana-server
systemctl start grafana-server

echo "✅ Monitoring setup complete!"
echo "🔗 Access Grafana at: http://YOUR_SERVER_IP:3000"
echo "📊 Default login: admin/admin"
