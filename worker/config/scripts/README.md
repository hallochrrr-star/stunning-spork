# 🌐 GitHub Tunnel - DNS Tunneling con Cloudflare Workers

Sistema de tunneling DNS completo usando GitHub para gestión y Cloudflare Workers para ejecución.

## 🚀 Características

- ✅ **DNS Tunneling** sobre HTTPS
- ✅ **Proxy HTTP** integrado
- ✅ **Cliente Termux** automático
- ✅ **100% Gratuito** (GitHub + Cloudflare)
- ✅ **Fácil configuración**
- ✅ **Logs y monitoreo**

## 📁 Estructura

```

github-tunnel/
├──worker/
│└── tunnel-worker.js     # Cloudflare Worker
├──config/
│└── dns-config.json      # Configuración
├──scripts/
│└── termux-client.sh     # Cliente Termux
├──docs/
│└── setup-guide.md       # Guía instalación
└──README.md

```

## ⚡ Inicio Rápido

### 1. Clonar y Ejecutar
```bash
git clone https://github.com/hallochrrr/github-tunnel
cd github-tunnel/scripts
chmod +x termux-client.sh
./termux-client.sh
```
