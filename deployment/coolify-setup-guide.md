# Guía Completa: Coolify Setup Sin GUI

## 🚀 Instalación (Solo CLI)

### Paso 1: Instalar Coolify
```bash
# EN TU SERVIDOR UBUNTU:
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# TIEMPO: 5-10 minutos
# OUTPUT: Verás logs de instalación
```

### Paso 2: Obtener IP del servidor
```bash
# COMANDO PARA VER TU IP:
curl ifconfig.me

# EJEMPLO OUTPUT:
# 78.46.123.456
```

### Paso 3: Verificar que Coolify esté corriendo
```bash
# VERIFICAR CONTAINERS:
docker ps

# DEBERÍAS VER:
# coolify-proxy
# coolify-db  
# coolify-redis
# coolify
```

## 🌐 Acceso Web (Desde tu Mac/PC)

### Abrir navegador:
```
URL: http://TU_IP_SERVIDOR:8000
Ejemplo: http://78.46.123.456:8000
```

### Primera configuración:
1. **Crear cuenta admin**
   - Email: tu-email@domain.com
   - Password: (seguro)
   
2. **Configurar servidor**
   - Server name: "Production Server"
   - Description: "Founder Diary Production"
   
3. **¡Listo para usar!**

## 📊 Configuración de tu aplicación

### 1. Conectar GitHub:
- Settings → Git Sources → GitHub
- Autorizar acceso a tu repositorio
- Seleccionar: founder-diary

### 2. Crear aplicación:
- Applications → New Application
- Source: GitHub
- Repository: founder-diary
- Branch: main
- Build Pack: Docker

### 3. Configurar build:
- Dockerfile path: `./deployment/Dockerfile`
- Build command: (dejar vacío)
- Start command: (dejar vacío)

### 4. Variables de entorno:
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/founder_diary
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
# ... resto de variables
```

### 5. Configurar dominio:
- Domains → Add Domain
- Domain: yourdomain.com
- SSL: Auto-generate (Let's Encrypt)

### 6. Deploy:
- Click "Deploy"
- Ver logs en tiempo real
- Aplicación lista en 5-10 minutos

## 🗄️ Base de datos PostgreSQL

### Crear servicio de DB:
- Services → New Service
- Type: PostgreSQL 15
- Name: founder-diary-db
- Database: founder_diary
- Username: founder_user
- Password: [generar seguro]

### Conectar a la aplicación:
- Usar internal URL: `postgresql://user:pass@postgres:5432/founder_diary`
- Coolify maneja la red interna automáticamente

## 🔍 Monitoreo y logs

### Ver estado:
- Dashboard → Overview
- Ver CPU, RAM, storage en tiempo real

### Ver logs:
- Applications → Tu App → Logs
- Logs en tiempo real, filtros disponibles

### Métricas:
- Monitoring → Metrics
- Gráficos de rendimiento

## 🛠️ Comandos CLI útiles (opcionales)

### Ver estado de Coolify:
```bash
docker ps
docker logs coolify
```

### Reiniciar Coolify:
```bash
docker restart coolify
```

### Ver logs de aplicación:
```bash
docker logs nombre-de-tu-app
```

## ✅ Checklist final

□ Coolify instalado y corriendo
□ Acceso web funcionando (puerto 8000)
□ Cuenta admin creada
□ GitHub conectado
□ Aplicación desplegada
□ Base de datos configurada
□ Dominio configurado con SSL
□ Monitoreo activo

## 🎯 Resultado final

Tendrás un servidor completamente funcional que administras desde navegador, sin necesidad de tocar CLI para el día a día. Solo usarás SSH para mantenimiento ocasional.
