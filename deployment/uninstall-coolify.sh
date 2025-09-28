#!/bin/bash
# Script para desinstalar Coolify completamente

set -e

echo "🗑️ Desinstalando Coolify completamente..."

# STEP 1: Parar todos los containers de Coolify
echo "⏹️ Parando containers de Coolify..."
docker stop $(docker ps -q --filter "label=coolify.managed=true") 2>/dev/null || true
docker stop coolify 2>/dev/null || true
docker stop coolify-proxy 2>/dev/null || true
docker stop coolify-db 2>/dev/null || true
docker stop coolify-redis 2>/dev/null || true

# STEP 2: Remover containers de Coolify
echo "🗑️ Removiendo containers de Coolify..."
docker rm $(docker ps -aq --filter "label=coolify.managed=true") 2>/dev/null || true
docker rm coolify 2>/dev/null || true
docker rm coolify-proxy 2>/dev/null || true
docker rm coolify-db 2>/dev/null || true
docker rm coolify-redis 2>/dev/null || true

# STEP 3: Remover imágenes de Coolify
echo "🖼️ Removiendo imágenes de Coolify..."
docker rmi $(docker images --filter "reference=*coolify*" -q) 2>/dev/null || true
docker rmi ghcr.io/coollabsio/coolify:latest 2>/dev/null || true

# STEP 4: Remover volúmenes de Coolify
echo "💾 Removiendo volúmenes de Coolify..."
docker volume rm $(docker volume ls --filter "name=coolify" -q) 2>/dev/null || true
docker volume rm coolify-db 2>/dev/null || true
docker volume rm coolify-redis 2>/dev/null || true

# STEP 5: Remover redes de Coolify
echo "🌐 Removiendo redes de Coolify..."
docker network rm coolify 2>/dev/null || true
docker network rm coolify-proxy 2>/dev/null || true

# STEP 6: Limpiar archivos de configuración
echo "📁 Removiendo archivos de configuración..."
sudo rm -rf /data/coolify 2>/dev/null || true
sudo rm -rf /var/lib/coolify 2>/dev/null || true
sudo rm -rf ~/.config/coolify 2>/dev/null || true

# STEP 7: Remover servicios systemd (si existen)
echo "🔧 Removiendo servicios systemd..."
sudo systemctl stop coolify 2>/dev/null || true
sudo systemctl disable coolify 2>/dev/null || true
sudo rm -f /etc/systemd/system/coolify.service 2>/dev/null || true
sudo systemctl daemon-reload

# STEP 8: Limpiar Docker completamente
echo "🧹 Limpiando Docker..."
docker system prune -af --volumes

# STEP 9: Verificar que no quede nada
echo "🔍 Verificando limpieza..."
echo "Containers restantes:"
docker ps -a
echo ""
echo "Volúmenes restantes:"
docker volume ls
echo ""
echo "Redes restantes:"
docker network ls

echo ""
echo "✅ Coolify desinstalado completamente!"
echo "🚀 Listo para instalar Dokploy"
