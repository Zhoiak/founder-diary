# 🏗️ PLAN DE INFRAESTRUCTURA - FOUNDER DIARY

## 🎯 **FILOSOFÍA DEL PROYECTO**

- **Sin vendor lock-in**: Componentes estándar y reemplazables
- **Escalabilidad independiente**: Cada servicio puede escalar por separado
- **Validación primero**: Enfoque en producto antes que infraestructura compleja
- **Componentes probados**: Tecnologías maduras y confiables

---

## 📋 **FASE 1 - MÍNIMO VIABLE (ACTUAL - Próximos 3 meses)**

### **✅ IMPLEMENTADO:**
```yaml
Stack Actual:
├── PostgreSQL (base de datos principal)
├── Redis (cache/sessions)
├── Next.js App (aplicación principal)
├── Nginx (reverse proxy + SSL)
└── pgAdmin (gestión visual de BD)
```

### **🔄 EN IMPLEMENTACIÓN:**
- **Better Auth**: Autenticación sin vendor lock-in
- **Migración completa**: De Supabase a stack propio

### **⏳ PENDIENTE FASE 1:**
- **MinIO**: Archivos S3-compatible (cuando sea necesario)
- **Axiom.co**: Logging externo
- **Backups automáticos**: PostgreSQL

---

## 🚀 **FASE 2 - KIT COMPLETO (FUTURO - Cuando haya tracción)**

### **BASE DE DATOS AVANZADA:**
```yaml
PostgreSQL Stack:
├── PostgreSQL + pgvector (IA ready)
├── PgBouncer (connection pooling)
├── pgBackRest (backups automáticos)
└── Hasura/PostgREST (GraphQL/REST automático)
```

### **GESTIÓN DE CONTENIDO:**
```yaml
Content Management:
├── MinIO (archivos, backups)
├── Directus (panel admin para negocio/ops)
└── Redis/Valkey + BullMQ (tareas async)
```

### **MONITOREO Y MÉTRICAS:**
```yaml
Observability:
├── Prometheus (métricas)
├── Grafana (dashboards)
├── postgres_exporter (métricas de BD)
└── Axiom.co (logs centralizados)
```

---

## 🔧 **HERRAMIENTAS DE DESARROLLO**

### **PANEL DEV ADMIN (FUTURO):**
```yaml
Dev Tools Panel:
├── pgAdmin: http://85.10.194.199:5050
├── Dokploy: http://85.10.194.199:3000
├── Redis Commander: Puerto 6380
├── Grafana: Métricas y monitoring
├── MinIO Console: Gestión de archivos
└── Directus: Panel admin de negocio
```

### **CARACTERÍSTICAS:**
- Acceso directo con un click
- Estado de cada servicio (online/offline)
- Información de puertos y credenciales
- Links directos a IPs y puertos específicos
- Protegido con autenticación admin
- Responsive para móvil

---

## 📊 **COMPARACIÓN DE FASES**

| Componente | Fase 1 (Actual) | Fase 2 (Futuro) |
|------------|------------------|------------------|
| **Base de Datos** | PostgreSQL básico | PostgreSQL + pgvector + PgBouncer |
| **Autenticación** | Better Auth | Better Auth + SSO |
| **Archivos** | Local/Temporal | MinIO S3-compatible |
| **Cache** | Redis básico | Redis/Valkey + BullMQ |
| **Admin** | pgAdmin | pgAdmin + Directus |
| **Monitoreo** | Básico | Prometheus + Grafana |
| **Logs** | Locales | Axiom.co centralizados |
| **Backups** | Manuales | pgBackRest automáticos |

---

## 🎯 **CRITERIOS DE MIGRACIÓN A FASE 2**

### **MÉTRICAS DE ACTIVACIÓN:**
- **Usuarios activos**: > 1,000 usuarios/mes
- **Datos**: > 10GB en base de datos
- **Tráfico**: > 100,000 requests/mes
- **Equipo**: > 2 desarrolladores activos

### **SEÑALES DE NECESIDAD:**
- Performance issues en BD
- Necesidad de backups automáticos
- Requerimientos de compliance
- Necesidad de métricas avanzadas
- Gestión de archivos multimedia

---

## 💰 **ESTIMACIÓN DE COSTOS**

### **FASE 1 (Actual):**
```
Servidor VPS: €20-50/mes
Dominio: €10/año
SSL: Gratis (Let's Encrypt)
Total: ~€25-55/mes
```

### **FASE 2 (Futuro):**
```
Servidor más potente: €100-200/mes
Axiom.co: €20-50/mes (según logs)
Backups externos: €10-20/mes
Monitoreo: €20-40/mes
Total: ~€150-310/mes
```

---

## 🔄 **PLAN DE MIGRACIÓN**

### **PASO 1**: Completar Fase 1
- [x] Stack básico funcionando
- [ ] Migración de Supabase completa
- [ ] Better Auth implementado

### **PASO 2**: Optimizar Fase 1
- [ ] Logging externo (Axiom.co)
- [ ] Backups básicos
- [ ] Monitoreo básico

### **PASO 3**: Evaluar necesidad de Fase 2
- [ ] Analizar métricas de uso
- [ ] Evaluar pain points
- [ ] Decidir componentes prioritarios

---

*Última actualización: 2025-09-30*
