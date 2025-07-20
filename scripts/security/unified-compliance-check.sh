#!/bin/bash

# Script de Verificacao de Conformidade e Seguranca Unificado - Bash
# Execucao: ./scripts/unified-compliance-check.sh [--json] [--verbose] [--security-only] [--compliance-only]
# Versao: 3.0 - Script consolidado com verificacoes completas

set -e

# Configuracao
MIN_CONFORMANCE_SCORE=70
MAX_WARNINGS=5
REQUIRED_SECURITY_HEADERS=("Content-Security-Policy" "X-Frame-Options" "X-Content-Type-Options" "Strict-Transport-Security")
SENSITIVE_KEYWORDS=("password" "secret" "api_key" "token" "credential" "private_key")
REQUIRED_FILES=("src/app/layout.tsx" "src/middleware.ts" "src/lib/supabase.ts" "components.json" "package.json")

# Contadores
warnings=0
errors=0
successes=0
critical_issues=0
high_issues=0
medium_issues=0
low_issues=0
total_checks=0
passed_checks=0

# Parse argumentos
JSON_OUTPUT=false
VERBOSE=false
SECURITY_ONLY=false
COMPLIANCE_ONLY=false

for arg in "$@"; do
    case $arg in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --security-only)
            SECURITY_ONLY=true
            shift
            ;;
        --compliance-only)
            COMPLIANCE_ONLY=true
            shift
            ;;
    esac
done

start_time=$(date +%s)

# Funcao de log
write_status() {
    local message="$1"
    local type="$2"
    local category="${3:-Geral}"
    
    ((total_checks++))
    
    case "$type" in
        "SUCCESS")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[32m[OK] $message\033[0m"
            fi
            ((successes++))
            ((passed_checks++))
            ;;
        "WARNING")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[33m[WARN] $message\033[0m"
            fi
            ((warnings++))
            ;;
        "ERROR")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[31m[ERRO] $message\033[0m"
            fi
            ((errors++))
            ;;
        "CRITICAL")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[31m[CRITICO] $message\033[0m"
            fi
            ((critical_issues++))
            ;;
        "HIGH")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[91m[ALTO] $message\033[0m"
            fi
            ((high_issues++))
            ;;
        "MEDIUM")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[33m[MEDIO] $message\033[0m"
            fi
            ((medium_issues++))
            ;;
        "LOW")
            if [[ "$JSON_OUTPUT" != "true" ]]; then
                echo -e "\033[32m[BAIXO] $message\033[0m"
            fi
            ((low_issues++))
            ;;
        "INFO")
            if [[ "$JSON_OUTPUT" != "true" && "$VERBOSE" == "true" ]]; then
                echo -e "\033[36m[INFO] $message\033[0m"
            fi
            ;;
    esac
}

# Verificar se um arquivo existe nas exceções
test_exception() {
    local file_path="$1"
    local rule_type="$2"
    
    if [[ -f "scripts/compliance-exceptions.json" ]]; then
        # Simplificado - em produção usaria jq para JSON parsing
        return 1
    fi
    return 1
}

# Verificar conteudo sensivel
test_sensitive_content() {
    local file_path="$1"
    
    if [[ ! -f "$file_path" ]]; then
        return 1
    fi
    
    local content=$(cat "$file_path" 2>/dev/null || echo "")
    if [[ -z "$content" ]]; then
        return 1
    fi
    
    for keyword in "${SENSITIVE_KEYWORDS[@]}"; do
        if echo "$content" | grep -q "$keyword"; then
            return 0
        fi
    done
    return 1
}

if [[ "$JSON_OUTPUT" != "true" ]]; then
    script_name="Conformidade e Segurança Unificado"
    if [[ "$SECURITY_ONLY" == "true" ]]; then
        script_name="Segurança"
    elif [[ "$COMPLIANCE_ONLY" == "true" ]]; then
        script_name="Conformidade"
    fi
    echo -e "\033[36mIniciando Verificacao de $script_name v3.0...\033[0m"
    echo "================================================================"
fi

# =====================================================
# VERIFICAÇÕES DE ESTRUTURA DE ARQUIVOS
# =====================================================

if [[ "$SECURITY_ONLY" != "true" ]]; then
    write_status "Iniciando verificações de estrutura de arquivos..." "INFO" "Estrutura"
    
    # Verificar arquivos obrigatórios
    for file in "${REQUIRED_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            write_status "Arquivo obrigatório encontrado: $file" "SUCCESS" "Estrutura"
        else
            write_status "Arquivo obrigatório não encontrado: $file" "ERROR" "Estrutura"
        fi
    done
    
    # Verificar estrutura de pastas
    required_dirs=("src" "components" "lib" "supabase" "docs" "scripts")
    for dir in "${required_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            write_status "Diretório obrigatório encontrado: $dir" "SUCCESS" "Estrutura"
        else
            write_status "Diretório obrigatório não encontrado: $dir" "WARNING" "Estrutura"
        fi
    done
    
    # Verificar package.json
    if [[ -f "package.json" ]]; then
        if command -v jq >/dev/null 2>&1; then
            deps_count=$(jq '.dependencies | length' package.json 2>/dev/null || echo "0")
            scripts_count=$(jq '.scripts | length' package.json 2>/dev/null || echo "0")
            write_status "Dependências encontradas no package.json ($deps_count deps)" "SUCCESS" "Estrutura"
            write_status "Scripts encontrados no package.json ($scripts_count scripts)" "SUCCESS" "Estrutura"
        else
            write_status "package.json encontrado (jq não disponível para análise detalhada)" "SUCCESS" "Estrutura"
        fi
    fi
fi

# =====================================================
# VERIFICAÇÕES DE SEGURANÇA
# =====================================================

if [[ "$COMPLIANCE_ONLY" != "true" ]]; then
    write_status "Iniciando verificações de segurança..." "INFO" "Segurança"
    
    # Verificar arquivos com conteúdo sensível
    sensitive_files=0
    while IFS= read -r -d '' file; do
        if test_sensitive_content "$file"; then
            write_status "Conteúdo potencialmente sensível encontrado em: $file" "HIGH" "Segurança"
            ((sensitive_files++))
        fi
    done < <(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.json" -o -name "*.env" -o -name "*.sql" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/.next/*" -print0)
    
    if [[ $sensitive_files -eq 0 ]]; then
        write_status "Nenhum conteúdo sensível encontrado nos arquivos verificados" "SUCCESS" "Segurança"
    fi
    
    # Verificar arquivos .env
    env_files=$(find . -name "*.env*" -type f ! -path "*/node_modules/*" ! -path "*/.git/*")
    if [[ -n "$env_files" ]]; then
        while IFS= read -r env_file; do
            if [[ "$(basename "$env_file")" == ".env" ]]; then
                write_status "Arquivo .env encontrado (deve estar no .gitignore): $env_file" "WARNING" "Segurança"
            else
                write_status "Arquivo de ambiente encontrado: $env_file" "INFO" "Segurança"
            fi
        done <<< "$env_files"
    fi
    
    # Verificar middleware de segurança
    if [[ -f "src/middleware.ts" ]]; then
        if grep -q -E "auth|security|protect" "src/middleware.ts"; then
            write_status "Middleware de segurança implementado" "SUCCESS" "Segurança"
        else
            write_status "Middleware pode não ter verificações de segurança" "WARNING" "Segurança"
        fi
    else
        write_status "Middleware não encontrado" "WARNING" "Segurança"
    fi
    
    # Verificar implementação de autenticação
    auth_files=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "auth\|login\|session" {} \; 2>/dev/null | head -10)
    
    if [[ -n "$auth_files" ]]; then
        auth_count=$(echo "$auth_files" | wc -l)
        write_status "Arquivos de autenticação encontrados ($auth_count arquivos)" "SUCCESS" "Segurança"
        
        # Verificar uso de getUser vs getSession
        while IFS= read -r auth_file; do
            if [[ -f "$auth_file" ]]; then
                content=$(cat "$auth_file" 2>/dev/null || echo "")
                if [[ -n "$content" ]]; then
                    if echo "$content" | grep -q "getUser()" && echo "$content" | grep -q "getSession()"; then
                        write_status "Arquivo usa tanto getUser() quanto getSession(): $(basename "$auth_file")" "INFO" "Segurança"
                    elif echo "$content" | grep -q "getUser()"; then
                        write_status "Arquivo usa getUser() (método seguro): $(basename "$auth_file")" "SUCCESS" "Segurança"
                    elif echo "$content" | grep -q "getSession()"; then
                        write_status "Arquivo usa apenas getSession() (verificar se é apropriado): $(basename "$auth_file")" "WARNING" "Segurança"
                    fi
                fi
            fi
        done <<< "$auth_files"
    else
        write_status "Nenhum arquivo de autenticação encontrado" "WARNING" "Segurança"
    fi
fi

# =====================================================
# VERIFICAÇÕES DE CONFORMIDADE
# =====================================================

if [[ "$SECURITY_ONLY" != "true" ]]; then
    write_status "Iniciando verificações de conformidade..." "INFO" "Conformidade"
    
    # Verificar estrutura de componentes
    component_files=$(find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -path "*/components/*" -o -path "*/ui/*" 2>/dev/null | head -20)
    
    if [[ -n "$component_files" ]]; then
        component_count=$(echo "$component_files" | wc -l)
        write_status "Componentes encontrados ($component_count arquivos)" "SUCCESS" "Conformidade"
        
        components_with_types=0
        components_with_props=0
        
        while IFS= read -r component; do
            if [[ -f "$component" ]]; then
                content=$(cat "$component" 2>/dev/null || echo "")
                if [[ -n "$content" ]]; then
                    if echo "$content" | grep -q -E "interface.*Props|type.*Props"; then
                        ((components_with_types++))
                    fi
                    if echo "$content" | grep -q -E "props\.|{.*}.*=.*props"; then
                        ((components_with_props++))
                    fi
                fi
            fi
        done <<< "$component_files"
        
        write_status "Componentes com tipagem de props: $components_with_types/$component_count" "INFO" "Conformidade"
        write_status "Componentes usando props: $components_with_props/$component_count" "INFO" "Conformidade"
    fi
    
    # Verificar estrutura de API
    api_files=$(find . -type f \( -name "*.ts" -o -name "*.js" \) -path "*/api/*" -o -path "*/route*" 2>/dev/null | head -20)
    
    if [[ -n "$api_files" ]]; then
        api_count=$(echo "$api_files" | wc -l)
        write_status "Arquivos de API encontrados ($api_count arquivos)" "SUCCESS" "Conformidade"
        
        apis_with_error_handling=0
        apis_with_validation=0
        
        while IFS= read -r api_file; do
            if [[ -f "$api_file" ]]; then
                content=$(cat "$api_file" 2>/dev/null || echo "")
                if [[ -n "$content" ]]; then
                    if echo "$content" | grep -q -E "try.*catch|\.catch\("; then
                        ((apis_with_error_handling++))
                    fi
                    if echo "$content" | grep -q -E "validate|schema|zod"; then
                        ((apis_with_validation++))
                    fi
                fi
            fi
        done <<< "$api_files"
        
        write_status "APIs com tratamento de erro: $apis_with_error_handling/$api_count" "INFO" "Conformidade"
        write_status "APIs com validação: $apis_with_validation/$api_count" "INFO" "Conformidade"
    fi
    
    # Verificar migrações do Supabase
    if [[ -d "supabase/migrations" ]]; then
        migration_count=$(find supabase/migrations -type f -name "*.sql" | wc -l)
        if [[ $migration_count -gt 0 ]]; then
            write_status "Migrações do Supabase encontradas ($migration_count arquivos)" "SUCCESS" "Conformidade"
        else
            write_status "Nenhuma migração encontrada em supabase/migrations" "WARNING" "Conformidade"
        fi
    fi
    
    # Verificar Edge Functions
    if [[ -d "supabase/functions" ]]; then
        function_count=$(find supabase/functions -maxdepth 1 -type d | wc -l)
        if [[ $function_count -gt 1 ]]; then # -gt 1 porque find inclui o diretório pai
            write_status "Edge Functions encontradas ($((function_count-1)) funções)" "SUCCESS" "Conformidade"
            
            for func_dir in supabase/functions/*/; do
                if [[ -d "$func_dir" ]]; then
                    func_name=$(basename "$func_dir")
                    if [[ -f "$func_dir/index.ts" ]]; then
                        write_status "Edge Function com index.ts: $func_name" "SUCCESS" "Conformidade"
                    else
                        write_status "Edge Function sem index.ts: $func_name" "WARNING" "Conformidade"
                    fi
                fi
            done
        else
            write_status "Nenhuma Edge Function encontrada" "INFO" "Conformidade"
        fi
    fi
fi

# =====================================================
# VERIFICAÇÕES DE DOCUMENTAÇÃO
# =====================================================

if [[ "$SECURITY_ONLY" != "true" ]]; then
    write_status "Verificando documentação..." "INFO" "Documentação"
    
    # Verificar estrutura de documentação
    for doc_dir in "docs" "project_guide"; do
        if [[ -d "$doc_dir" ]]; then
            doc_count=$(find "$doc_dir" -type f -name "*.md" | wc -l)
            if [[ $doc_count -gt 0 ]]; then
                write_status "Documentação encontrada em $doc_dir ($doc_count arquivos)" "SUCCESS" "Documentação"
            else
                write_status "Diretório de documentação vazio: $doc_dir" "WARNING" "Documentação"
            fi
        fi
    done
    
    # Verificar README
    if [[ -f "README.md" ]]; then
        write_status "README.md encontrado" "SUCCESS" "Documentação"
    else
        write_status "README.md não encontrado" "WARNING" "Documentação"
    fi
    
    # Verificar CONTRIBUTING.md
    if [[ -f "CONTRIBUTING.md" ]]; then
        write_status "CONTRIBUTING.md encontrado" "SUCCESS" "Documentação"
    else
        write_status "CONTRIBUTING.md não encontrado" "INFO" "Documentação"
    fi
fi

# =====================================================
# VERIFICAÇÕES DE BANCO DE DADOS
# =====================================================

if [[ "$SECURITY_ONLY" != "true" ]]; then
    write_status "Verificando estrutura de banco de dados..." "INFO" "Banco de Dados"
    
    # Verificar políticas RLS nas migrações
    if [[ -d "supabase/migrations" ]]; then
        rls_policies=0
        
        while IFS= read -r -d '' migration; do
            if [[ -f "$migration" ]]; then
                content=$(cat "$migration" 2>/dev/null || echo "")
                if echo "$content" | grep -q -E "CREATE POLICY|ALTER TABLE.*ENABLE ROW LEVEL SECURITY"; then
                    ((rls_policies++))
                fi
            fi
        done < <(find supabase/migrations -type f -name "*.sql" -print0)
        
        if [[ $rls_policies -gt 0 ]]; then
            write_status "Políticas RLS encontradas ($rls_policies migrações com RLS)" "SUCCESS" "Banco de Dados"
        else
            write_status "Nenhuma política RLS encontrada nas migrações" "WARNING" "Banco de Dados"
        fi
    fi
    
    # Verificar scripts de banco
    sql_count=$(find . -type f -name "*.sql" ! -path "*/node_modules/*" | wc -l)
    if [[ $sql_count -gt 0 ]]; then
        write_status "Arquivos SQL encontrados ($sql_count arquivos)" "SUCCESS" "Banco de Dados"
    fi
fi

# =====================================================
# VERIFICAÇÕES DE TESTES
# =====================================================

if [[ "$SECURITY_ONLY" != "true" ]]; then
    write_status "Verificando estrutura de testes..." "INFO" "Testes"
    
    # Verificar arquivos de teste
    test_files=$(find . -type f \( -name "*test*" -o -name "*spec*" \) \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.sh" \) ! -path "*/node_modules/*" 2>/dev/null)
    
    if [[ -n "$test_files" ]]; then
        test_count=$(echo "$test_files" | wc -l)
        write_status "Arquivos de teste encontrados ($test_count arquivos)" "SUCCESS" "Testes"
        
        unit_tests=$(echo "$test_files" | grep -c -E "unit|__tests__" || echo "0")
        integration_tests=$(echo "$test_files" | grep -c -E "integration|e2e" || echo "0")
        webhook_tests=$(echo "$test_files" | grep -c "webhook" || echo "0")
        
        write_status "Testes unitários: $unit_tests" "INFO" "Testes"
        write_status "Testes de integração: $integration_tests" "INFO" "Testes"
        write_status "Testes de webhook: $webhook_tests" "INFO" "Testes"
    else
        write_status "Nenhum arquivo de teste encontrado" "WARNING" "Testes"
    fi
fi

# =====================================================
# VERIFICAÇÕES AVANÇADAS DE SEGURANÇA
# =====================================================

if [[ "$COMPLIANCE_ONLY" != "true" ]]; then
    write_status "Iniciando verificações avançadas de segurança..." "INFO" "Segurança Avançada"
    
    # Verificar proteção contra SQL Injection
    write_status "Verificando proteção contra SQL Injection..." "INFO" "Input/Output"
    sql_injection_vulns=0
    
    while IFS= read -r -d '' file; do
        if [[ -f "$file" ]]; then
            content=$(cat "$file" 2>/dev/null || echo "")
            if [[ -n "$content" ]]; then
                if echo "$content" | grep -q -E "SELECT.*FROM.*WHERE.*=.*\$|INSERT.*INTO.*VALUES.*\$|UPDATE.*SET.*WHERE.*=.*\$|DELETE.*FROM.*WHERE.*=.*\$"; then
                    write_status "Possível vulnerabilidade SQL Injection em: $(basename "$file")" "HIGH" "Input/Output"
                    ((sql_injection_vulns++))
                fi
                
                if echo "$content" | grep -q "\.query(" && ! echo "$content" | grep -q -E "prepared|parameterized|\$[0-9]+"; then
                    write_status "Query não parametrizada detectada em: $(basename "$file")" "MEDIUM" "Input/Output"
                fi
            fi
        fi
    done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -name "*.d.ts" -print0 2>/dev/null)
    
    if [[ $sql_injection_vulns -eq 0 ]]; then
        write_status "Nenhuma vulnerabilidade SQL Injection óbvia detectada" "SUCCESS" "Input/Output"
    fi
    
    # Verificar proteção XSS
    write_status "Verificando proteção contra XSS..." "INFO" "Input/Output"
    while IFS= read -r -d '' file; do
        if [[ -f "$file" ]]; then
            content=$(cat "$file" 2>/dev/null || echo "")
            if [[ -n "$content" ]]; then
                sanitized=false
                if echo "$content" | grep -q -E "DOMPurify\.sanitize|sanitizeText"; then
                    sanitized=true
                fi
                
                if echo "$content" | grep -q -E "innerHTML\s*=|outerHTML\s*=|document\.write\s*\(|eval\s*\(|Function\s*\("; then
                    if [[ "$sanitized" == "true" ]]; then
                        write_status "Possível vulnerabilidade XSS em: $(basename "$file") (Mitigada com sanitização)" "INFO" "Input/Output"
                    else
                        write_status "Possível vulnerabilidade XSS em: $(basename "$file")" "HIGH" "Input/Output"
                    fi
                fi
            fi
        fi
    done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 2>/dev/null)
    
    # Verificar Rate Limiting
    write_status "Verificando implementação de Rate Limiting..." "INFO" "Input/Output"
    if [[ -f "src/middleware.ts" ]]; then
        if grep -q -E "rateLimit|throttle|rate.*limit" "src/middleware.ts"; then
            write_status "Rate limiting implementado no middleware" "SUCCESS" "Input/Output"
        else
            write_status "Rate limiting não detectado no middleware" "HIGH" "Input/Output"
        fi
    else
        write_status "Arquivo middleware.ts não encontrado" "ERROR" "Input/Output"
    fi
    
    # Verificar configuração CORS
    write_status "Verificando configuração CORS..." "INFO" "Input/Output"
    cors_configured=false
    cors_secure=true
    
    while IFS= read -r -d '' file; do
        if [[ -f "$file" ]]; then
            content=$(cat "$file" 2>/dev/null || echo "")
            if [[ -n "$content" ]]; then
                if echo "$content" | grep -q -i "cors"; then
                    cors_configured=true
                    if echo "$content" | grep -q -E "Access-Control-Allow-Origin:\s*\*|cors\s*:\s*true|allowedOrigins:\s*\[\s*\*\s*\]"; then
                        write_status "Configuração CORS insegura detectada em: $(basename "$file")" "HIGH" "Input/Output"
                        cors_secure=false
                    fi
                fi
            fi
        fi
    done < <(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) ! -name "*.d.ts" -print0 2>/dev/null)
    
    if [[ "$cors_configured" == "true" && "$cors_secure" == "true" ]]; then
        write_status "Configuração CORS implementada de forma segura" "SUCCESS" "Input/Output"
    elif [[ "$cors_configured" == "false" ]]; then
        write_status "Configuração CORS não detectada" "MEDIUM" "Input/Output"
    fi
fi

# =====================================================
# CÁLCULO DE PONTUAÇÃO
# =====================================================

end_time=$(date +%s)
duration=$((end_time - start_time))

# Calcular pontuação de conformidade
total_issues=$((errors + critical_issues + high_issues))
conformance_score=0
if [[ $total_checks -gt 0 ]]; then
    conformance_score=$(echo "scale=2; ($passed_checks / $total_checks) * 100" | bc -l 2>/dev/null || echo "0")
fi

# Calcular pontuação de segurança
security_issues=$((critical_issues + high_issues))
security_score=0
if [[ $total_checks -gt 0 ]]; then
    security_score=$(echo "scale=2; (($total_checks - $security_issues) / $total_checks) * 100" | bc -l 2>/dev/null || echo "0")
fi

# =====================================================
# RELATÓRIO FINAL
# =====================================================

if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat <<EOF
{
    "conformanceScore": $conformance_score,
    "securityScore": $security_score,
    "totalChecks": $total_checks,
    "passedChecks": $passed_checks,
    "warnings": $warnings,
    "errors": $errors,
    "criticalIssues": $critical_issues,
    "highIssues": $high_issues,
    "mediumIssues": $medium_issues,
    "lowIssues": $low_issues,
    "successes": $successes,
    "duration": $duration
}
EOF
else
    echo ""
    echo "================================================================"
    echo -e "\033[36mRELATÓRIO DE VERIFICAÇÃO CONCLUÍDO\033[0m"
    echo "================================================================"
    
    echo ""
    echo -e "\033[37mRESUMO EXECUTIVO:\033[0m"
    echo -e "• Duração: $duration segundos"
    echo -e "• Total de verificações: $total_checks"
    echo -e "\033[32m• Verificações aprovadas: $passed_checks\033[0m"
    
    if (( $(echo "$conformance_score >= $MIN_CONFORMANCE_SCORE" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "\033[32m• Pontuação de Conformidade: $conformance_score%\033[0m"
    else
        echo -e "\033[31m• Pontuação de Conformidade: $conformance_score%\033[0m"
    fi
    
    if (( $(echo "$security_score >= 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "\033[32m• Pontuação de Segurança: $security_score%\033[0m"
    else
        echo -e "\033[31m• Pontuação de Segurança: $security_score%\033[0m"
    fi
    
    echo ""
    echo -e "\033[37mCONTADORES:\033[0m"
    echo -e "\033[32m• Sucessos: $successes\033[0m"
    echo -e "\033[33m• Avisos: $warnings\033[0m"
    echo -e "\033[31m• Erros: $errors\033[0m"
    echo -e "\033[31m• Críticos: $critical_issues\033[0m"
    echo -e "\033[91m• Altos: $high_issues\033[0m"
    echo -e "\033[33m• Médios: $medium_issues\033[0m"
    echo -e "\033[32m• Baixos: $low_issues\033[0m"
    
    # Status final
    echo ""
    echo -e "\033[37mSTATUS FINAL:\033[0m"
    if [[ $critical_issues -gt 0 ]]; then
        echo -e "\033[31m❌ CRÍTICO - Problemas críticos encontrados que devem ser corrigidos imediatamente\033[0m"
    elif [[ $errors -gt 0 || $high_issues -gt 0 ]]; then
        echo -e "\033[33m⚠️  ATENÇÃO - Problemas importantes encontrados que devem ser corrigidos\033[0m"
    elif (( $(echo "$conformance_score < $MIN_CONFORMANCE_SCORE" | bc -l 2>/dev/null || echo "1") )); then
        echo -e "\033[33m📊 CONFORMIDADE BAIXA - Pontuação de conformidade abaixo do mínimo ($MIN_CONFORMANCE_SCORE%)\033[0m"
    else
        echo -e "\033[32m✅ APROVADO - Sistema em conformidade com os padrões estabelecidos\033[0m"
    fi
    
    echo ""
    echo "================================================================"
fi

# Retornar código de saída apropriado
if [[ $critical_issues -gt 0 ]]; then
    exit 2
elif [[ $errors -gt 0 || $high_issues -gt 0 ]]; then
    exit 1
else
    exit 0
fi