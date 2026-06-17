#!/bin/bash

# Script de Deploy Automatizado para Railway
# Uso: ./deploy.sh [mensagem-do-commit]

set -e

PROJECT_NAME="barbearia-agendamento-mvp"
PROJECT_PATH="/home/ubuntu/$PROJECT_NAME"
GITHUB_REMOTE="github"
MAIN_BRANCH="main"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Validar se estamos no diretório correto
if [ ! -d "$PROJECT_PATH" ]; then
    print_error "Diretório do projeto não encontrado: $PROJECT_PATH"
    exit 1
fi

cd "$PROJECT_PATH"

# Mensagem de commit (padrão ou fornecida)
COMMIT_MSG="${1:-Deploy automático via script - $(date '+%Y-%m-%d %H:%M:%S')}"

print_status "Iniciando deploy para Railway..."
print_status "Projeto: $PROJECT_NAME"
print_status "Branch: $MAIN_BRANCH"

# 1. Verificar status do git
print_status "Verificando status do git..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Existem mudanças não commitadas"
    git status --short
    print_status "Commitando mudanças..."
    git add -A
    git commit -m "$COMMIT_MSG" || print_warning "Nenhuma mudança para commitar"
else
    print_success "Sem mudanças não commitadas"
fi

# 2. Fazer push para o repositório Manus (S3)
print_status "Fazendo push para repositório Manus..."
if git push origin $MAIN_BRANCH 2>/dev/null || true; then
    print_success "Push para origin concluído"
else
    print_warning "Não foi possível fazer push para origin (esperado - credenciais S3)"
fi

# 3. Fazer push para GitHub (para backup e deploy)
print_status "Fazendo push para GitHub..."
if git remote | grep -q "$GITHUB_REMOTE"; then
    if git push $GITHUB_REMOTE $MAIN_BRANCH; then
        print_success "Push para GitHub concluído"
    else
        print_error "Falha ao fazer push para GitHub"
        exit 1
    fi
else
    print_warning "Remote GitHub não configurado. Pulando push para GitHub."
fi

# 4. Verificar se Railway CLI está instalado
print_status "Verificando Railway CLI..."
if command -v railway &> /dev/null; then
    print_success "Railway CLI encontrado"
    
    # 5. Fazer deploy no Railway
    print_status "Iniciando deploy no Railway..."
    if railway up; then
        print_success "Deploy no Railway concluído com sucesso!"
    else
        print_error "Falha ao fazer deploy no Railway"
        exit 1
    fi
else
    print_warning "Railway CLI não encontrado"
    print_status "Instalando Railway CLI..."
    
    # Tentar instalar via npm
    if command -v npm &> /dev/null; then
        npm install -g @railway/cli
        print_success "Railway CLI instalado"
        
        print_status "Iniciando deploy no Railway..."
        if railway up; then
            print_success "Deploy no Railway concluído com sucesso!"
        else
            print_error "Falha ao fazer deploy no Railway"
            exit 1
        fi
    else
        print_error "npm não encontrado. Não é possível instalar Railway CLI"
        print_status "Faça o deploy manualmente via Management UI do Manus"
        exit 1
    fi
fi

# 6. Criar job de scheduled para lembretes de WhatsApp (opcional)
print_status "Configurando lembretes automáticos de WhatsApp..."
if command -v manus-heartbeat &> /dev/null; then
    # Verificar se o job já existe
    if manus-heartbeat list | grep -q "whatsapp-reminder"; then
        print_success "Job de WhatsApp já configurado"
    else
        print_status "Criando job de WhatsApp..."
        if manus-heartbeat create --name whatsapp-reminder --cron "0 */1 * * * *" --path /api/scheduled/whatsapp-reminder; then
            print_success "Job de WhatsApp criado com sucesso!"
        else
            print_warning "Não foi possível criar job de WhatsApp automaticamente"
            print_status "Execute manualmente: manus-heartbeat create --name whatsapp-reminder --cron \"0 */1 * * * *\" --path /api/scheduled/whatsapp-reminder"
        fi
    fi
else
    print_warning "manus-heartbeat não encontrado"
    print_status "Execute manualmente: manus-heartbeat create --name whatsapp-reminder --cron \"0 */1 * * * *\" --path /api/scheduled/whatsapp-reminder"
fi

print_success "Deploy concluído com sucesso!"
print_status "Resumo:"
print_status "  - Commit: $COMMIT_MSG"
print_status "  - Branch: $MAIN_BRANCH"
print_status "  - Projeto: $PROJECT_NAME"
print_status "  - Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"

exit 0
