#!/bin/bash
# Script de instalación completa para Ubuntu 24.04 LTS

set -e

echo "🚀 Instalando Coolify en Ubuntu 24.04 LTS..."

# STEP 1: Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# STEP 2: Instalar dependencias
echo "🔧 Instalando dependencias..."
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    nano \
    ufw \
    fail2ban \
    unzip

# STEP 3: Instalar Docker (si no está instalado)
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker ya está instalado"
fi

# STEP 4: Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose ya está instalado"
fi

# STEP 5: Configurar firewall básico
echo "🛡️ Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw --force enable

# STEP 6: Instalar Coolify
echo "🚀 Instalando Coolify..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# STEP 7: Verificar instalación
echo "✅ Verificando instalación..."
sleep 10
docker ps

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "📊 Accede a Coolify en:"
echo "   http://$(curl -s ifconfig.me):8000"
echo "   o"
echo "   http://localhost:8000"
echo ""
echo "🔑 Credenciales iniciales:"
echo "   - Crear cuenta admin en primer acceso"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Abrir navegador y acceder a Coolify"
echo "   2. Crear cuenta de administrador"
echo "   3. Conectar repositorio GitHub"
echo "   4. Desplegar aplicación"
echo ""
