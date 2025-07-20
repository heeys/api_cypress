#!/bin/bash

# Script para execução rápida de testes
# Uso: ./run-tests.sh [tipo] [browser]
# Exemplos:
#   ./run-tests.sh                    # Executa todos os testes
#   ./run-tests.sh users              # Executa apenas testes de usuários
#   ./run-tests.sh tickets chrome     # Executa testes de tickets no Chrome

set -e

# Configurações
API_URL="http://localhost:3000"
WAIT_TIME=30

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica se a API está rodando
check_api() {
    log_info "Verificando se a API está rodando em $API_URL..."
    
    for i in $(seq 1 $WAIT_TIME); do
        if curl -s -f "$API_URL/users" >/dev/null 2>&1; then
            log_success "API está rodando!"
            return 0
        fi
        
        if [ $i -eq 1 ]; then
            log_warning "API não está rodando. Tentando novamente..."
        fi
        
        echo -n "."
        sleep 1
    done
    
    echo ""
    log_error "API não está respondendo após ${WAIT_TIME}s"
    log_error "Por favor, certifique-se de que a Helpdesk API está rodando em $API_URL"
    echo ""
    echo "Para iniciar a API:"
    echo "1. git clone https://github.com/automacaohml/helpdesk-api.git"
    echo "2. cd helpdesk-api && npm install && npm start"
    exit 1
}

# Executa testes baseado no tipo
run_tests() {
    local test_type=$1
    local browser=$2
    
    case $test_type in
        "config")
            log_info "Executando testes de configuração (sem API)..."
            npx cypress run --spec 'cypress/e2e/api/test-config.cy.js' ${browser:+--browser $browser}
            ;;
        "users")
            log_info "Executando testes de usuários..."
            npm run test:users -- ${browser:+--browser $browser}
            ;;
        "tickets")
            log_info "Executando testes de tickets..."
            npm run test:tickets -- ${browser:+--browser $browser}
            ;;
        "schemas")
            log_info "Executando testes de schemas..."
            npm run test:schemas -- ${browser:+--browser $browser}
            ;;
        "negative")
            log_info "Executando testes negativos..."
            npm run test:negative -- ${browser:+--browser $browser}
            ;;
        "integration")
            log_info "Executando testes de integração..."
            npx cypress run --spec 'cypress/e2e/api/integration/**/*' ${browser:+--browser $browser}
            ;;
        "all"|"")
            log_info "Executando todos os testes..."
            npm test -- ${browser:+--browser $browser}
            ;;
        *)
            log_error "Tipo de teste inválido: $test_type"
            echo ""
            echo "Tipos disponíveis:"
            echo "  config      - Testes de configuração (sem API)"
            echo "  users       - Testes de usuários"
            echo "  tickets     - Testes de tickets"
            echo "  schemas     - Testes de schemas"
            echo "  negative    - Testes negativos"
            echo "  integration - Testes de integração"
            echo "  all         - Todos os testes (padrão)"
            exit 1
            ;;
    esac
}

# Gera relatórios
generate_reports() {
    if [ -d "cypress/reports" ] && [ "$(ls -A cypress/reports/*.json 2>/dev/null)" ]; then
        log_info "Gerando relatórios..."
        npm run report:merge 2>/dev/null || true
        npm run report:generate 2>/dev/null || true
        
        if [ -f "cypress/reports/html/index.html" ]; then
            log_success "Relatório HTML gerado: cypress/reports/html/index.html"
        fi
    fi
}

# Função principal
main() {
    local test_type=$1
    local browser=$2
    
    echo "🧪 Executando testes da Helpdesk API"
    echo "=================================="
    
    # Mostra ajuda para tipos inválidos ou help
    if [ "$test_type" = "help" ] || [ "$test_type" = "--help" ] || [ "$test_type" = "-h" ]; then
        echo ""
        echo "Uso: ./run-tests.sh [tipo] [browser]"
        echo ""
        echo "Tipos disponíveis:"
        echo "  config      - Testes de configuração (sem API) ✅"
        echo "  users       - Testes de usuários (requer API)"
        echo "  tickets     - Testes de tickets (requer API)"
        echo "  schemas     - Testes de schemas (requer API)"
        echo "  negative    - Testes negativos (requer API)"
        echo "  integration - Testes de integração (requer API)"
        echo "  all         - Todos os testes (requer API)"
        echo ""
        echo "Browsers disponíveis:"
        echo "  chrome, firefox, edge, electron (padrão)"
        echo ""
        echo "Exemplos:"
        echo "  ./run-tests.sh config           # Testes sem API"
        echo "  ./run-tests.sh users chrome     # Testes de usuários no Chrome"
        echo "  ./run-tests.sh all              # Todos os testes"
        echo ""
        echo "Para usar com API:"
        echo "  1. git clone https://github.com/automacaohml/helpdesk-api.git"
        echo "  2. cd helpdesk-api && npm install && npm start"
        echo "  3. ./run-tests.sh [tipo]"
        exit 0
    fi
    
    # Pula verificação da API para testes de configuração
    if [ "$test_type" != "config" ]; then
        # Verifica API
        check_api
    else
        log_info "Executando testes de configuração (não requer API)"
    fi
    
    # Executa testes
    run_tests "$test_type" "$browser"
    
    # Gera relatórios
    generate_reports
    
    log_success "Testes completados! 🎉"
    
    # Mostra resumo
    echo ""
    echo "📊 Resumo:"
    if [ -d "cypress/screenshots" ] && [ "$(ls -A cypress/screenshots 2>/dev/null)" ]; then
        echo "   Screenshots: cypress/screenshots/"
    fi
    if [ -d "cypress/videos" ] && [ "$(ls -A cypress/videos 2>/dev/null)" ]; then
        echo "   Vídeos: cypress/videos/"
    fi
    if [ -f "cypress/reports/html/index.html" ]; then
        echo "   Relatório: cypress/reports/html/index.html"
    fi
    if [ -f "cypress/reports/html/merged-report.html" ]; then
        echo "   Relatório Consolidado: cypress/reports/html/merged-report.html"
    fi
}

# Executa script
main "$@"
