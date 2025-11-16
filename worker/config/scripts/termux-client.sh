#!/bin/bash
echo "🌐 DNS Tunnel Client - etecsa.tk"

# Configuración
CONFIG_DIR="$HOME/github-tunnel"
SCRIPT_DIR="$CONFIG_DIR/scripts"

cd "$SCRIPT_DIR" || exit 1

# Instalar dependencias
pip install requests > /dev/null 2>&1

# Ejecutar cliente DNS real
python dns_real_tunnel.py
