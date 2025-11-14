#!/bin/bash
# scripts/termux-client.sh
# Cliente DNS Tunnel para Termux
# Autor: hallochrrr

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
WORKER_URL="https://dns-tunnel.hallochrrr.workers.dev"
CONFIG_DIR="$HOME/.dns-tunnel"
LOG_FILE="$CONFIG_DIR/tunnel.log"
CONFIG_FILE="$CONFIG_DIR/config.conf"

# Banner
print_banner() {
    clear
    echo -e "${CYAN}"
    echo "🌐 ██████  ███    ██ ███████ ███████ ██ ███    ██ ███████ ██     ██ "
    echo "   ██   ██ ████   ██ ██      ██      ██ ████   ██ ██      ██     ██ "
    echo "   ██   ██ ██ ██  ██ █████   █████   ██ ██ ██  ██ █████   ██  █  ██ "
    echo "   ██   ██ ██  ██ ██ ██      ██      ██ ██  ██ ██ ██      ██ ███ ██ "
    echo "   ██████  ██   ████ ██      ██      ██ ██   ████ ███████  ███ ███  "
    echo -e "${NC}"
    echo -e "${YELLOW}🚀 Cliente DNS Tunnel para Termux${NC}"
    echo -e "${BLUE}📧 Desarrollado por: hallochrrr${NC}"
    echo "=========================================="
}

# Inicializar configuración
init_config() {
    if [ ! -d "$CONFIG_DIR" ]; then
        echo -e "${YELLOW}📁 Creando directorio de configuración...${NC}"
        mkdir -p "$CONFIG_DIR"
    fi
    
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << EOF
# Configuración DNS Tunnel
worker_url=$WORKER_URL
timeout=30
retry_attempts=3
debug=false
auto_update=true
EOF
        echo -e "${GREEN}✅ Configuración inicial creada en: $CONFIG_FILE${NC}"
    fi
    
    # Cargar configuración
    source "$CONFIG_FILE"
}

# Verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    
    local missing=0
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl no encontrado${NC}"
        echo -e "${BLUE}💡 Instala con: pkg install curl${NC}"
        missing=1
    else
        echo -e "${GREEN}✅ curl encontrado${NC}"
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git no encontrado${NC}"
        echo -e "${BLUE}💡 Instala con: pkg install git${NC}"
        missing=1
    else
        echo -e "${GREEN}✅ git encontrado${NC}"
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️ jq no encontrado (recomendado para JSON)${NC}"
        echo -e "${BLUE}💡 Instala con: pkg install jq${NC}"
    else
        echo -e "${GREEN}✅ jq encontrado${NC}"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "${RED}🚫 Dependencias faltantes. Instala antes de continuar.${NC}"
        exit 1
    fi
}

# Logging
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Probar conexión al worker
test_connection() {
    echo -e "${YELLOW}🔍 Probando conexión con Worker...${NC}"
    
    local response
    response=$(curl -s --connect-timeout 10 "${worker_url}/status")
    
    if [ $? -eq 0 ] && [[ $response == *"Operativo"* ]]; then
        echo -e "${GREEN}✅ Conexión exitosa con Worker${NC}"
        log_message "CONEXION_EXITOSA - Worker activo"
        return 0
    else
        echo -e "${RED}❌ Error de conexión con Worker${NC}"
        echo -e "${YELLOW}Respuesta: $response${NC}"
        log_message "ERROR_CONEXION - No se pudo conectar al worker"
        return 1
    fi
}

# Consulta DNS
dns_query() {
    echo -e "${CYAN}📡 Consulta DNS Tunnel${NC}"
    read -p "🔍 Ingresa dominio o datos para consulta: " domain
    
    if [ -z "$domain" ]; then
        echo -e "${RED}❌ Dominio vacío${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Enviando consulta DNS...${NC}"
    local response
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"domain\":\"$domain\",\"type\":\"A\",\"client\":\"termux\"}" \
        "${worker_url}/dns-query")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Respuesta recibida:${NC}"
        if command -v jq &> /dev/null; then
            echo "$response" | jq .
        else
            echo "$response"
        fi
        log_message "DNS_QUERY - Dominio: $domain"
    else
        echo -e "${RED}❌ Error en consulta DNS${NC}"
    fi
}

# Proxy HTTP
http_proxy() {
    echo -e "${CYAN}🔗 Proxy HTTP Tunnel${NC}"
    read -p "🌐 Ingresa URL para acceder via proxy: " url
    
    if [ -z "$url" ]; then
        echo -e "${RED}❌ URL vacía${NC}"
        return 1
    fi
    
    # Validar URL básica
    if [[ ! $url =~ ^https?:// ]]; then
        url="http://$url"
    fi
    
    echo -e "${YELLOW}Accediendo via proxy...${NC}"
    local response
    response=$(curl -s --connect-timeout 20 "${worker_url}/proxy?url=${url}")
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Contenido recibido:${NC}"
        echo "$response" | head -20
        echo -e "\n${YELLOW}... (mostrando primeros 20 lines)${NC}"
        log_message "HTTP_PROXY - URL: $url"
    else
        echo -e "${RED}❌ Error en proxy HTTP${NC}"
    fi
}

# Test de velocidad
speed_test() {
    echo -e "${CYAN}🏁 Test de Velocidad Tunnel${NC}"
    echo -e "${YELLOW}Iniciando test de velocidad...${NC}"
    
    local start_time=$(date +%s)
    test_connection
    local end_time=$(date +%s)
    
    local duration=$((end_time - start_time))
    echo -e "${GREEN}✅ Test completado en ${duration} segundos${NC}"
    log_message "SPEED_TEST - Duracion: ${duration}s"
}

# Información del sistema
system_info() {
    echo -e "${CYAN}💻 Información del Sistema${NC}"
    echo -e "${BLUE}Termux:${NC} $(uname -a)"
    echo -e "${BLUE}CPU:${NC} $(grep -c ^processor /proc/cpuinfo) cores"
    echo -e "${BLUE}Memoria:${NC} $(free -m 2>/dev/null | grep Mem | awk '{print $2}') MB"
    echo -e "${BLUE}Almacenamiento:${NC} $(df -h . | awk 'NR==2 {print $4}') libre"
    echo -e "${BLUE}IP Pública:${NC} $(curl -s ifconfig.me)"
}

# Actualizar cliente
update_client() {
    echo -e "${CYAN}🔄 Actualizando Cliente...${NC}"
    
    local current_dir=$(pwd)
    local repo_dir="$HOME/github-tunnel"
    
    if [ -d "$repo_dir" ]; then
        cd "$repo_dir"
        git pull
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Cliente actualizado${NC}"
            cp scripts/termux-client.sh "$current_dir/" 2>/dev/null
        else
            echo -e "${RED}❌ Error al actualizar${NC}"
        fi
        cd "$current_dir"
    else
        echo -e "${YELLOW}📥 Clonando repositorio...${NC}"
        git clone https://github.com/hallochrrr/github-tunnel "$repo_dir"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Repositorio clonado${NC}"
        else
            echo -e "${RED}❌ Error al clonar${NC}"
        fi
    fi
}

# Menú principal
show_menu() {
    echo ""
    echo -e "${CYAN}=== 🎮 MENÚ DNS TUNNEL ===${NC}"
    echo -e "${GREEN}1) 🔍 Probar conexión"
    echo -e "2) 📡 Consulta DNS"
    echo -e "3) 🔗 Proxy HTTP"
    echo -e "4) 🏁 Test velocidad"
    echo -e "5) 💻 Info sistema"
    echo -e "6) ⚙️ Configuración"
    echo -e "7) 🔄 Actualizar cliente"
    echo -e "8) 📊 Ver logs"
    echo -e "9) 🚪 Salir${NC}"
    echo ""
    read -p "🎯 Selecciona opción [1-9]: " choice
    
    case $choice in
        1) test_connection ;;
        2) dns_query ;;
        3) http_proxy ;;
        4) speed_test ;;
        5) system_info ;;
        6) show_config ;;
        7) update_client ;;
        8) view_logs ;;
        9) echo -e "${GREEN}👋 ¡Hasta luego!${NC}"; exit 0 ;;
        *) echo -e "${RED}❌ Opción inválida${NC}" ;;
    esac
    
    # Volver al menú
    read -p "Presiona Enter para continuar..."
    show_menu
}

# Mostrar configuración
show_config() {
    echo -e "${CYAN}⚙️ Configuración Actual${NC}"
    echo "================================="
    cat "$CONFIG_FILE"
    echo "================================="
}

# Ver logs
view_logs() {
    echo -e "${CYAN}📊 Últimas entradas del log${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -20 "$LOG_FILE"
    else
        echo -e "${YELLOW}No hay logs disponibles${NC}"
    fi
}

# Función principal
main() {
    print_banner
    init_config
    check_dependencies
    
    echo -e "${GREEN}✅ Cliente DNS Tunnel inicializado${NC}"
    echo -e "${BLUE}📍 Worker URL: $worker_url${NC}"
    echo -e "${BLUE}📁 Config: $CONFIG_FILE${NC}"
    echo -e "${BLUE}📝 Logs: $LOG_FILE${NC}"
    
    log_message "CLIENTE_INICIADO - Termux DNS Tunnel"
    
    # Probar conexión automáticamente
    test_connection
    
    # Mostrar menú
    show_menu
}

# Manejar señal de interrupción
trap 'echo -e "\n${YELLOW}🛑 Cerrando cliente...${NC}"; log_message "CLIENTE_CERRADO"; exit 0' INT

# Ejecutar
main "$@"
