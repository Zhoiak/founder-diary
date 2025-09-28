#!/bin/bash
# Script de instalación completa de Dokploy en Ubuntu 24.04

set -e

echo "🚀 Instalando Dokploy en Ubuntu 24.04..."

# STEP 1: Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker instalado"
else
    echo "✅ Docker ya está instalado"
fi

# STEP 2: Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose instalado"
else
    echo "✅ Docker Compose ya está instalado"
fi

# STEP 3: Crear directorio para Dokploy
echo "📁 Creando directorios para Dokploy..."
sudo mkdir -p /etc/dokploy
sudo mkdir -p /var/lib/dokploy
sudo chown -R $USER:$USER /var/lib/dokploy

# STEP 4: Configurar firewall para Dokploy
echo "🛡️ Configurando firewall..."
sudo ufw allow 3000/tcp comment 'Dokploy Web Interface'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw reload

# STEP 5: Instalar Dokploy usando el script oficial
echo "🚀 Descargando e instalando Dokploy..."
curl -sSL https://dokploy.com/install.sh | sh

# STEP 6: Esperar a que Dokploy esté listo
echo "⏳ Esperando a que Dokploy esté listo..."
sleep 30

# STEP 7: Verificar instalación
echo "🔍 Verificando instalación..."
docker ps --filter "name=dokploy"

# STEP 8: Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "🎉 ¡Dokploy instalado exitosamente!"
echo ""
echo "📊 Accede a Dokploy en:"
echo "   http://$SERVER_IP:3000"
echo "   o"
echo "   http://localhost:3000"
echo ""
echo "🔑 Configuración inicial:"
echo "   1. Abrir navegador y acceder a la URL"
echo "   2. Crear cuenta de administrador"
echo "   3. Configurar tu primer proyecto"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Acceder a la interfaz web"
echo "   2. Conectar repositorio GitHub"
echo "   3. Configurar base de datos PostgreSQL"
echo "   4. Desplegar aplicación Founder Diary"
echo ""
echo "🔧 Comandos útiles:"
echo "   docker ps                    # Ver containers"
echo "   docker logs dokploy          # Ver logs"
echo "   docker restart dokploy       # Reiniciar"
echo ""
