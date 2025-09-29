# Founder Diary - Production Deployment

## 🚀 Quick Start

```bash
# Deploy to production
./deployment/deploy.sh
```

## 📋 Stack

- **App**: Next.js 15 (Node.js 20)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Proxy**: Nginx with SSL
- **Orchestration**: Docker Compose

## 🔧 Manual Commands

```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# Stop services
docker-compose -f docker-compose.production.yml down

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Rebuild app only
docker-compose -f docker-compose.production.yml up -d --build app

# Database shell
docker exec -it founder-diary-postgres psql -U founder_user -d founder_diary

# Redis shell
docker exec -it founder-diary-redis redis-cli
```

## 🌐 URLs

- **HTTP**: http://85.10.194.199
- **HTTPS**: https://luftmist.shop (once DNS configured)
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🔐 Environment Variables

Key variables in `docker-compose.production.yml`:

```env
DATABASE_URL=postgresql://founder_user:FounderDiary2024!@postgres:5432/founder_diary
NEXTAUTH_URL=http://85.10.194.199:3000
NEXTAUTH_SECRET=P5801sh83lelWNnvDnJeaTs1bHX2Rd3WEXNBvqxEjRY=
REDIS_URL=redis://redis:6379
```

## 📊 Monitoring

```bash
# Service status
docker-compose -f docker-compose.production.yml ps

# Resource usage
docker stats

# Disk usage
docker system df
```

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Redeploy
./deployment/deploy.sh
```

## 🆘 Troubleshooting

### App won't start
```bash
docker-compose -f docker-compose.production.yml logs app
```

### Database connection issues
```bash
docker-compose -f docker-compose.production.yml logs postgres
```

### SSL certificate issues
```bash
# Regenerate self-signed certificates
rm deployment/ssl/*
./deployment/deploy.sh
```
