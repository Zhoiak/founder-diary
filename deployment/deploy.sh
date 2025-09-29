#!/bin/bash

# Founder Diary Production Deployment Script
set -e

echo "🚀 Starting Founder Diary deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed.${NC}"
    exit 1
fi

# Create SSL directory (we'll add certificates later)
mkdir -p deployment/ssl

# Create self-signed certificates for now (replace with Let's Encrypt later)
if [ ! -f deployment/ssl/cert.pem ]; then
    echo -e "${YELLOW}📜 Creating self-signed SSL certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout deployment/ssl/key.pem \
        -out deployment/ssl/cert.pem \
        -subj "/C=ES/ST=Madrid/L=Madrid/O=FounderDiary/CN=luftmist.shop"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest images...${NC}"
docker-compose -f docker-compose.production.yml pull postgres redis nginx || true

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service status
echo -e "${GREEN}📊 Service Status:${NC}"
docker-compose -f docker-compose.production.yml ps

# Show logs
echo -e "${GREEN}📋 Recent logs:${NC}"
docker-compose -f docker-compose.production.yml logs --tail=20

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}🌐 Your app should be available at:${NC}"
echo -e "${GREEN}   - HTTP:  http://85.10.194.199${NC}"
echo -e "${GREEN}   - HTTPS: https://luftmist.shop (once DNS is configured)${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}   1. Configure DNS for luftmist.shop${NC}"
echo -e "${YELLOW}   2. Setup Let's Encrypt SSL certificates${NC}"
echo -e "${YELLOW}   3. Migrate data from Supabase${NC}"
