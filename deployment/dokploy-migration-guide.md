# Guía Completa: Migración a Dokploy

## 🗑️ Paso 1: Desinstalar Coolify

### Ejecutar script de desinstalación:
```bash
# En tu servidor Ubuntu:
chmod +x uninstall-coolify.sh
./uninstall-coolify.sh

# Verificar que todo esté limpio:
docker ps -a
docker volume ls
docker network ls
```

## 🚀 Paso 2: Instalar Dokploy

### Ejecutar script de instalación:
```bash
# En tu servidor Ubuntu:
chmod +x install-dokploy.sh
./install-dokploy.sh

# Verificar instalación:
docker ps --filter "name=dokploy"
```

### Obtener IP para acceso:
```bash
# Ver tu IP pública:
curl ifconfig.me

# Ejemplo output: 78.46.123.456
```

## 🌐 Paso 3: Configuración inicial web

### Acceder a Dokploy:
```
URL: http://TU_IP_SERVIDOR:3000
Ejemplo: http://78.46.123.456:3000
```

### Primera configuración:
1. **Crear cuenta admin**
   - Email: tu-email@domain.com
   - Password: (seguro, guárdalo)
   - Confirmar configuración

2. **Configurar servidor**
   - Server name: "Production Server"
   - Domain: tu-dominio.com (opcional)

## 📊 Paso 4: Configurar tu aplicación

### 1. Crear nuevo proyecto:
- Projects → New Project
- Name: "Founder Diary"
- Description: "Personal Life OS Platform"

### 2. Conectar GitHub:
- Settings → Git Providers
- Add GitHub provider
- Autorizar acceso
- Seleccionar repositorio: founder-diary

### 3. Configurar aplicación:
- Applications → New Application
- Name: "founder-diary-app"
- Source: GitHub
- Repository: tu-usuario/founder-diary
- Branch: main
- Build type: Docker

### 4. Configurar build:
- Dockerfile path: `./deployment/Dockerfile`
- Build context: `.`
- Port: 3000

### 5. Variables de entorno:
```env
NODE_ENV=production
DATABASE_URL=postgresql://founder_user:SECURE_PASSWORD@postgres:5432/founder_diary
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=tu-secret-super-seguro
REDIS_URL=redis://redis:6379

# OAuth providers
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret

# Monitoring
SENTRY_DSN=tu-sentry-dsn
POSTHOG_KEY=tu-posthog-key
```

## 🗄️ Paso 5: Configurar base de datos

### Crear servicio PostgreSQL:
- Services → New Service
- Type: PostgreSQL
- Name: "founder-diary-db"
- Version: 15
- Database name: founder_diary
- Username: founder_user
- Password: [generar seguro]

### Configurar Redis:
- Services → New Service
- Type: Redis
- Name: "founder-diary-redis"
- Version: 7
- Memory limit: 512MB

## 🌐 Paso 6: Configurar dominio

### Agregar dominio:
- Domains → Add Domain
- Domain: tu-dominio.com
- Application: founder-diary-app
- SSL: Enable (Let's Encrypt)

### Configurar DNS:
En tu proveedor de dominio:
```
Type: A Record
Name: @ (o www)
Value: TU_IP_SERVIDOR
TTL: 300
```

## 🚀 Paso 7: Deploy

### Hacer primer deploy:
- Applications → founder-diary-app
- Deploy → Deploy Now
- Ver logs en tiempo real
- Esperar 5-10 minutos

### Verificar deployment:
- Check application status: Running
- Test URL: https://tu-dominio.com
- Check logs for errors

## 📊 Paso 8: Migrar datos desde Supabase

### Exportar datos de Supabase:
```bash
# Desde tu Mac, conectar a Supabase:
pg_dump "postgresql://postgres:[password]@[host]:5432/postgres" \
  --schema=public \
  --data-only \
  --no-owner \
  --no-privileges > supabase_data.sql
```

### Importar a Dokploy PostgreSQL:
```bash
# Conectar al container PostgreSQL en Dokploy:
docker exec -i dokploy-postgres psql -U founder_user -d founder_diary < supabase_data.sql
```

## 🔍 Paso 9: Monitoreo y verificación

### Verificar servicios:
- Applications → founder-diary-app → Metrics
- Services → PostgreSQL → Status
- Services → Redis → Status

### Ver logs:
- Applications → founder-diary-app → Logs
- Filtrar por errores o warnings

### Test funcionalidad:
- [ ] Login/registro funciona
- [ ] Base de datos conectada
- [ ] Redis funcionando
- [ ] SSL activo
- [ ] Dominio resuelve correctamente

## ✅ Checklist final

□ Coolify completamente desinstalado
□ Dokploy instalado y corriendo
□ Aplicación desplegada exitosamente
□ Base de datos PostgreSQL funcionando
□ Redis configurado
□ Dominio con SSL activo
□ Datos migrados desde Supabase
□ Monitoreo activo
□ Logs sin errores críticos

## 🎯 Comandos útiles Dokploy

### Ver estado:
```bash
docker ps --filter "name=dokploy"
docker logs dokploy
```

### Reiniciar servicios:
```bash
docker restart dokploy
docker restart dokploy-postgres
docker restart dokploy-redis
```

### Backup base de datos:
```bash
docker exec dokploy-postgres pg_dump -U founder_user founder_diary > backup.sql
```

## 🚨 Troubleshooting

### Si la aplicación no inicia:
1. Check logs en Dokploy dashboard
2. Verificar variables de entorno
3. Confirmar que PostgreSQL esté corriendo
4. Verificar Dockerfile build

### Si hay problemas de SSL:
1. Verificar que DNS apunte correctamente
2. Esperar propagación DNS (hasta 24h)
3. Regenerar certificado en Dokploy

### Si PostgreSQL no conecta:
1. Verificar credenciales en variables de entorno
2. Check que el servicio esté corriendo
3. Verificar network connectivity entre containers
