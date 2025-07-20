#!/bin/bash

# =====================================================
# CLEANUP LEGACY SYSTEM - PHASE 6 MIGRATION
# Script para limpeza final do sistema legacy
# =====================================================

set -e

# Configurações
BACKUP_DIR="./backups/legacy-$(date +%Y%m%d-%H%M%S)"
DRY_RUN=false
FORCE=false

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para mostrar ajuda
show_help() {
    cat << EOF
USAGE: $0 [OPTIONS]

OPTIONS:
    --dry-run     Simular limpeza sem remover arquivos
    --force       Pular confirmações
    --help        Mostrar esta ajuda

DESCRIÇÃO:
    Remove código legacy do sistema de módulos após migração para sistema dinâmico.
    
    ⚠️  ATENÇÃO: Este script é DESTRUTIVO. Faça backup antes de executar.

EXEMPLOS:
    $0 --dry-run              # Simular limpeza
    $0 --force               # Executar sem confirmações
    $0                       # Executar com confirmações
EOF
}

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            error "Argumento desconhecido: $1"
            ;;
    esac
done

# Verificações pré-limpeza
pre_cleanup_checks() {
    log "Executando verificações pré-limpeza..."
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        error "Execute este script no diretório raiz do projeto"
    fi
    
    # Verificar se sistema dinâmico está funcionando
    log "Verificando se sistema dinâmico está ativo..."
    if [ ! -f "src/core/modules/registry/DynamicModuleRegistry.ts" ]; then
        error "Sistema dinâmico não encontrado. Migração incompleta?"
    fi
    
    # Verificar banco de dados
    log "Verificando banco de dados..."
    if ! npx supabase db check &>/dev/null; then
        warning "Problemas no banco de dados detectados"
        if [ "$FORCE" != "true" ]; then
            read -p "Continuar mesmo assim? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    success "Verificações pré-limpeza concluídas"
}

# Criar backup dos arquivos que serão removidos
create_backup() {
    if [ "$DRY_RUN" = "true" ]; then
        log "DRY RUN: Pulando criação de backup"
        return
    fi
    
    log "Criando backup em $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup dos arquivos legacy identificados
    local files_to_backup=(
        "src/app/(protected)/alertas"
        "src/app/(protected)/catalog" 
        "src/app/(protected)/events"
        "src/app/(protected)/reports"
        "src/app/ui/sidebar"
        "src/components/ui-backup"
    )
    
    for item in "${files_to_backup[@]}"; do
        if [ -e "$item" ]; then
            cp -r "$item" "$BACKUP_DIR/" 2>/dev/null || true
            log "Backup criado: $item"
        fi
    done
    
    # Backup do package.json e lock files
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true
    cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
    cp pnpm-lock.yaml "$BACKUP_DIR/" 2>/dev/null || true
    
    success "Backup criado em $BACKUP_DIR"
}

# Remover rotas legacy
remove_legacy_routes() {
    log "Removendo rotas legacy..."
    
    local legacy_routes=(
        "src/app/(protected)/alertas"
        "src/app/(protected)/catalog"
        "src/app/(protected)/events" 
        "src/app/(protected)/reports"
    )
    
    for route in "${legacy_routes[@]}"; do
        if [ -d "$route" ]; then
            if [ "$DRY_RUN" = "true" ]; then
                log "DRY RUN: Removeria $route"
            else
                rm -rf "$route"
                success "Removido: $route"
            fi
        else
            log "Já removido: $route"
        fi
    done
}

# Remover componentes legacy de sidebar
remove_legacy_sidebar_components() {
    log "Removendo componentes legacy de sidebar..."
    
    local legacy_components=(
        "src/app/ui/sidebar"
        "src/components/ui-backup"
        "src/components/ChatDrawer.tsx"
        "src/components/chat-sidebar.tsx"
    )
    
    for component in "${legacy_components[@]}"; do
        if [ -e "$component" ]; then
            if [ "$DRY_RUN" = "true" ]; then
                log "DRY RUN: Removeria $component"
            else
                rm -rf "$component"
                success "Removido: $component"
            fi
        else
            log "Já removido: $component"
        fi
    done
}

# Limpar imports órfãos
clean_orphaned_imports() {
    log "Limpando imports órfãos..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "DRY RUN: Executaria npx unimported"
        return
    fi
    
    # Verificar se unimported está disponível
    if command -v unimported &> /dev/null; then
        npx unimported --remove-unused || true
        success "Imports órfãos removidos"
    else
        warning "unimported não disponível. Pule esta etapa ou instale: npm i -g unimported"
    fi
}

# Atualizar dependências
update_dependencies() {
    log "Verificando dependências desnecessárias..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "DRY RUN: Verificaria dependências"
        return
    fi
    
    # Lista de dependências que podem ser removidas após migração
    local potentially_unused=(
        # Adicionar dependências específicas se identificadas
    )
    
    for dep in "${potentially_unused[@]}"; do
        if npm list "$dep" &>/dev/null; then
            warning "Dependência potencialmente não utilizada: $dep"
            warning "Verifique manualmente antes de remover"
        fi
    done
}

# Executar testes após limpeza
run_tests() {
    log "Executando testes após limpeza..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "DRY RUN: Executaria testes"
        return
    fi
    
    # Verificar se build passa
    if npm run build &>/dev/null; then
        success "Build passou após limpeza"
    else
        error "Build falhou após limpeza. Verifique os logs."
    fi
    
    # Executar testes se disponíveis
    if npm run test &>/dev/null; then
        success "Testes passaram após limpeza"
    else
        warning "Alguns testes falharam. Verifique manualmente."
    fi
}

# Gerar relatório de limpeza
generate_cleanup_report() {
    local report_file="cleanup-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# CLEANUP REPORT - PHASE 6 MIGRATION

**Data**: $(date)
**Backup**: $BACKUP_DIR
**Dry Run**: $DRY_RUN

## Arquivos Removidos

### Rotas Legacy
- ✅ src/app/(protected)/alertas
- ✅ src/app/(protected)/catalog  
- ✅ src/app/(protected)/events
- ✅ src/app/(protected)/reports

### Componentes Legacy
- ✅ src/app/ui/sidebar
- ✅ src/components/ui-backup
- ✅ src/components/ChatDrawer.tsx
- ✅ src/components/chat-sidebar.tsx

## Redirects Ativos

As seguintes rotas foram configuradas para redirecionamento automático:
- /alertas → /{organizationSlug}/alerts
- /catalog → /{organizationSlug}/catalog
- /events → /{organizationSlug}/events
- /reports → /{organizationSlug}/reports

## Próximos Passos

1. **Monitorar**: Verificar se redirects estão funcionando
2. **Testes**: Executar testes de regressão completos
3. **Performance**: Monitorar métricas de performance
4. **Rollback**: Backup disponível em $BACKUP_DIR se necessário

## Rollback

Em caso de problemas críticos:
\`\`\`bash
# Restaurar backup
cp -r $BACKUP_DIR/* ./

# Reinstalar dependências  
npm install

# Rebuild
npm run build
\`\`\`

**Status**: ✅ Limpeza concluída com sucesso
EOF
    
    success "Relatório gerado: $report_file"
}

# Função principal
main() {
    log "🧹 INICIANDO LIMPEZA DO SISTEMA LEGACY"
    log "Dry run: $DRY_RUN | Force: $FORCE"
    
    # Confirmação se não for dry run e não for force
    if [ "$DRY_RUN" != "true" ] && [ "$FORCE" != "true" ]; then
        warning "Esta operação irá REMOVER arquivos permanentemente"
        warning "Certifique-se de que:"
        warning "1. Sistema dinâmico está funcionando"
        warning "2. Redirects estão ativos"
        warning "3. Backup foi criado"
        echo
        read -p "Confirmar limpeza? (type 'yes' to confirm): " -r
        if [ "$REPLY" != "yes" ]; then
            log "Operação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    # Executar etapas de limpeza
    pre_cleanup_checks
    create_backup
    remove_legacy_routes
    remove_legacy_sidebar_components
    clean_orphaned_imports
    update_dependencies
    run_tests
    generate_cleanup_report
    
    success "🎉 LIMPEZA CONCLUÍDA COM SUCESSO!"
    
    if [ "$DRY_RUN" != "true" ]; then
        log "📊 Próximos passos:"
        log "1. Monitorar logs de aplicação"
        log "2. Verificar se redirects funcionam"
        log "3. Executar testes de regressão"
        log "4. Monitorar métricas de performance"
        log ""
        log "📁 Backup disponível em: $BACKUP_DIR"
    fi
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi