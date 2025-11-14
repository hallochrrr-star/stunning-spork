#!/bin/bash
# scripts/termux-client.sh
# Cliente mejorado para Termux

echo "🌐 Iniciando Cliente DNS Tunnel Avanzado..."

# Configuración
CONFIG_DIR="$HOME/github-tunnel"
SCRIPT_DIR="$CONFIG_DIR/scripts"
CONFIG_FILE="$CONFIG_DIR/config/dns-config.json"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para log con colores
log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar y clonar repositorio si es necesario
setup_environment() {
    if [ ! -d "$CONFIG_DIR" ]; then
        log_info "Clonando repositorio..."
        git clone https://github.com/hallochrrr/github-tunnel "$CONFIG_DIR"
        if [ $? -eq 0 ]; then
            log_success "Repositorio clonado"
        else
            log_error "Error al clonar repositorio"
            exit 1
        fi
    fi
    
    cd "$CONFIG_DIR" || {
        log_error "No se pudo acceder al directorio"
        exit 1
    }
    
    # Actualizar repositorio
    log_info "Actualizando repositorio..."
    git pull origin main
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."
    
    local missing_deps=()
    
    # Verificar comandos básicos
    for cmd in curl git python; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_warning "Dependencias faltantes: ${missing_deps[*]}"
        log_info "Instalando con: pkg install ${missing_deps[*]}"
        pkg install -y "${missing_deps[@]}"
    fi
    
    # Verificar Python requests
    if ! python -c "import requests" 2>/dev/null; then
        log_info "Instalando requests para Python..."
        pip install requests
    fi
    
    log_success "Dependencias verificadas"
}

# Probar conexión al worker
test_connection() {
    log_info "Probando conexión con Worker..."
    local worker_url="https://dns-tunnel.hallochrrr.workers.dev/status"
    
    response=$(curl -s -w "%{http_code}" "$worker_url")
    http_code="${response: -3}"
    content="${response%???}"
    
    if [ "$http_code" -eq 200 ]; then
        log_success "Conexión exitosa"
        echo "Respuesta: $content"
        return 0
    else
        log_error "Error de conexión - HTTP $http_code"
        return 1
    fi
}

# Ejecutar cliente Python
run_python_client() {
    log_info "Ejecutando cliente Python avanzado..."
    cd "$SCRIPT_DIR" || return 1
    
    if [ -f "advanced_client.py" ]; then
        python advanced_client.py
    else
        log_error "Cliente Python no encontrado"
        return 1
    fi
}

# Instalar servicio (futura implementación)
install_service() {
    log_info "Instalando servicio automático..."
    # Esto se implementará en fases futuras
    log_warning "Instalación de servicio pendiente para Fase 3"
}

# Menú principal mejorado
show_menu() {
    echo ""
    echo -e "${BLUE}=================================${NC}"
    echo -e "${GREEN}   🌐 DNS TUNNEL TERMUX${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo "1) Probar conexión básica"
    echo "2) Ejecutar cliente avanzado (Python)"
    echo "3) Verificar dependencias"
    echo "4) Actualizar repositorio"
    echo "5) Instalar servicio automático"
    echo "6) Estado del sistema"
    echo "7) Salir"
    echo -e "${BLUE}=================================${NC}"
    echo ""
    read -p "Selecciona opción: " choice
    
    case $choice in
        1) test_connection ;;
        2) run_python_client ;;
        3) check_dependencies ;;
        4) setup_environment ;;
        5) install_service ;;
        6) system_status ;;
        7) log_success "👋 ¡Hasta luego!"; exit 0 ;;
        *) log_error "Opción inválida" ;;
    esac
}

# Mostrar estado del sistema
system_status() {
    log_info "Estado del sistema:"
    echo "• Directorio: $CONFIG_DIR"
    echo "• Python: $(python --version 2>/dev/null || echo 'No encontrado')"
    echo "• curl: $(curl --version 2>/dev/null | head -n1 || echo 'No encontrado')"
    echo "• git: $(git --version 2>/dev/null || echo 'No encontrado')"
    echo "• Worker: https://dns-tunnel.hallochrrr.workers.dev"
}

# Inicialización principal
main() {
    log_success "DNS Tunnel Client v2.0"
    
    # Configurar entorno
    setup_environment
    check_dependencies
    
    # Probar conexión inicial
    if test_connection; then
        log_success "Sistema listo para usar"
    else
        log_warning "Problemas de conexión detectados"
    fi
    
    # Menú principal
    while true; do
        show_menu
        echo ""
        read -p "Presiona Enter para continuar..." dummy
    done
}

# Ejecutar
main "$@"
