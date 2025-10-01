# 🌐 CONFIGURACIÓN DE DOMINIOS - FOUNDER DIARY

## 📋 **DNS RECORDS NECESARIOS**

Configura estos registros en tu proveedor DNS (Cloudflare recomendado):

```
Tipo    Nombre    Contenido           Proxy   TTL
────────────────────────────────────────────────────
A       @         85.10.194.199       ✅      Auto
A       www       85.10.194.199       ✅      Auto
CNAME   panel     founder-diary.com   ✅      Auto
CNAME   pg        founder-diary.com   ✅      Auto
```

## 🔧 **CONFIGURACIÓN ACTUAL**

### **Dominios Configurados:**
- ✅ `founder-diary.com` → App principal
- ✅ `www.founder-diary.com` → Redirect a founder-diary.com
- ✅ `panel.founder-diary.com` → Dokploy (ya configurado)
- ✅ `pg.founder-diary.com` → pgAdmin

### **Puertos Internos:**
- App: `3000` (solo interno, acceso vía Nginx)
- pgAdmin: `80` (solo interno, acceso vía Nginx)
- PostgreSQL: `5432` (solo interno)
- Redis: `6379` (solo interno)

## 🔒 **CERTIFICADOS SSL**

Necesitarás certificados SSL para:
1. `founder-diary.com` (incluye www)
2. `pg.founder-diary.com`

### **Opción A: Let's Encrypt (Recomendado)**
```bash
# Instalar certbot
apt update && apt install certbot python3-certbot-nginx

# Generar certificados
certbot --nginx -d founder-diary.com -d www.founder-diary.com
certbot --nginx -d pg.founder-diary.com
```

### **Opción B: Cloudflare SSL**
Si usas Cloudflare, activa SSL/TLS → Full (strict)

## 🚀 **PASOS DE DEPLOY**

1. **Configurar DNS** (arriba)
2. **Generar certificados SSL**
3. **Actualizar código en servidor:**
   ```bash
   cd ~/founder-diary
   git pull origin main
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d
   ```

## 🔍 **VERIFICACIÓN**

Después del deploy, verifica:
- ✅ `https://founder-diary.com` → App funciona
- ✅ `https://pg.founder-diary.com` → pgAdmin accesible
- ✅ `https://panel.founder-diary.com` → Dokploy funciona

## 🎯 **PREPARADO PARA EL FUTURO**

La configuración está lista para:
- **API separada**: `api.founder-diary.com`
- **Redis Admin**: `redis.founder-diary.com`
- **MinIO Console**: `minio.founder-diary.com`
- **Grafana**: `grafana.founder-diary.com`
- **Load balancing** múltiples instancias
- **Rate limiting** por endpoint
- **Cache estático** optimizado

## ⚠️ **NOTAS IMPORTANTES**

1. **Backup antes de cambiar DNS**
2. **Propagar DNS puede tomar 24-48h**
3. **Certificados SSL se renuevan automáticamente**
4. **Nginx logs en `/var/log/nginx/`**
5. **Monitorear con `docker logs founder-diary-nginx`**
