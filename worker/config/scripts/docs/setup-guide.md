# 📚 Guía de Instalación - DNS Tunnel

## 🚀 Configuración Rápida

### 1. Requisitos Previos
- **Termux** instalado desde F-Droid
- Conexión a internet
- Cuenta GitHub y Cloudflare

### 2. Instalación en Termux

```bash
# Actualizar paquetes
pkg update && pkg upgrade

# Instalar dependencias
pkg install curl git jq

# Clonar repositorio
cd ~
git clone https://github.com/hallochrrr/github-tunnel
cd github-tunnel/scripts

# Dar permisos de ejecución
chmod +x termux-client.sh

# Ejecutar cliente
./termux-client.sh
