# Script para corrigir problemas de codificação de caracteres especiais
# Autor: AI Agent Banban
# Data: $(Get-Date -Format 'yyyy-MM-dd')

param(
    [string]$Path = ".",
    [string[]]$Extensions = @("*.tsx", "*.ts", "*.js", "*.jsx", "*.md"),
    [switch]$Preview,
    [switch]$Verbose
)

# Mapeamento de caracteres mal codificados para caracteres corretos
$encodingFixes = @{
    # Caracteres minúsculos com acentos
    'Ã£' = 'ã'  # a com til
    'Ã¡' = 'á'  # a com acento agudo
    'Ã ' = 'à'  # a com acento grave
    'Ã¢' = 'â'  # a com acento circunflexo
    'Ã§' = 'ç'  # c cedilha
    'Ã©' = 'é'  # e com acento agudo
    'Ã¨' = 'è'  # e com acento grave
    'Ãª' = 'ê'  # e com acento circunflexo
    'Ã­' = 'í'  # i com acento agudo
    'Ã¯' = 'ï'  # i com trema
    'Ã³' = 'ó'  # o com acento agudo
    'Ã´' = 'ô'  # o com acento circunflexo
    'Ãµ' = 'õ'  # o com til
    'Ãº' = 'ú'  # u com acento agudo
    'Ã¼' = 'ü'  # u com trema
    'Ã¿' = 'ÿ'  # y com trema
    
    # Caracteres maiúsculos com acentos
    'Ã' = 'Ã'   # A com til
    'Ã‡' = 'Ç'  # C cedilha maiúscula
    'Ã‰' = 'É'  # E com acento agudo maiúscula
    'Ãˆ' = 'È'  # E com acento grave maiúscula
    'ÃŠ' = 'Ê'  # E com acento circunflexo maiúscula
    'Ã•' = 'Õ'  # O com til maiúscula
    
    # Padrões adicionais comuns
    'nÃ£o' = 'não'         # palavra "não" mal codificada
    'aÃ§Ã£o' = 'ação'      # palavra "ação" mal codificada
    'configuraÃ§Ã£o' = 'configuração'  # palavra "configuração" mal codificada
    'notificaÃ§Ãµes' = 'notificações'  # palavra "notificações" mal codificada
    'operaÃ§Ã£o' = 'operação'          # palavra "operação" mal codificada
    'seguranÃ§a' = 'segurança'         # palavra "segurança" mal codificada
    'expiraÃ§Ã£o' = 'expiração'        # palavra "expiração" mal codificada
    'sessÃ£o' = 'sessão'               # palavra "sessão" mal codificada
    'usuÃ¡rio' = 'usuário'             # palavra "usuário" mal codificada
    'pÃ¡gina' = 'página'               # palavra "página" mal codificada
    'seÃ§Ã£o' = 'seção'                # palavra "seção" mal codificada
    'verificaÃ§Ã£o' = 'verificação'    # palavra "verificação" mal codificada
    'permissÃ£o' = 'permissão'         # palavra "permissão" mal codificada
    'informaÃ§Ã£o' = 'informação'      # palavra "informação" mal codificada
    'organizaÃ§Ã£o' = 'organização'    # palavra "organização" mal codificada
    'criaÃ§Ã£o' = 'criação'            # palavra "criação" mal codificada
    'exclusÃ£o' = 'exclusão'           # palavra "exclusão" mal codificada
    
    # Padrões específicos encontrados nos arquivos
    'DistribuiÃ§Ã£o' = 'Distribuição'
    'TransferÃªncia' = 'Transferência'
    'SaÃ­da' = 'Saída'
    'DevoluÃ§Ã£o' = 'Devolução'
    'ConferÃªncia' = 'Conferência'
    'DivergÃªncia' = 'Divergência'
    'SeparaÃ§Ã£o' = 'Separação'
    'PrÃ©-doca' = 'Pré-doca'
    'ConcluÃ­da' = 'Concluída'
    'VariaÃ§Ã£o' = 'Variação'
    'MovimentaÃ§Ã£o' = 'Movimentação'
    'SincronizaÃ§Ã£o' = 'Sincronização'
    'CatÃ¡logo' = 'Catálogo'
    'AtualizaÃ§Ã£o' = 'Atualização'
    'PreÃ§os' = 'Preços'
    'ConcluÃ­do' = 'Concluído'
    'ExcluÃ­do' = 'Excluído'
    'portuguÃªs' = 'português'
    'padronizaÃ§Ã£o' = 'padronização'
    'migraÃ§Ã£o' = 'migração'
    'apÃ³s' = 'após'
    'inglÃªs' = 'inglês'
}

function Write-ColorOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Get-FilesToProcess {
    param([string]$BasePath, [string[]]$FileExtensions)
    
    $files = @()
    foreach ($ext in $FileExtensions) {
        $files += Get-ChildItem -Path $BasePath -Filter $ext -Recurse -File
    }
    return $files
}

function Test-FileHasEncodingIssues {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        
        foreach ($badChar in $encodingFixes.Keys) {
            if ($content -like "*$badChar*") {
                return $true
            }
        }
        return $false
    }
    catch {
        Write-Warning "Erro ao ler arquivo: $FilePath - $($_.Exception.Message)"
        return $false
    }
}

function Fix-FileEncoding {
    param(
        [string]$FilePath,
        [switch]$PreviewOnly
    )
    
    try {
        # Ler o conteúdo do arquivo
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        $changesCount = 0
        $changes = @()
        
        # Aplicar correções
        foreach ($badChar in $encodingFixes.Keys) {
            $goodChar = $encodingFixes[$badChar]
            $matches = [regex]::Matches($content, [regex]::Escape($badChar))
            
            if ($matches.Count -gt 0) {
                $content = $content -replace [regex]::Escape($badChar), $goodChar
                $changesCount += $matches.Count
                $changes += "$($matches.Count)x '$badChar' → '$goodChar'"
                
                if ($Verbose) {
                    Write-ColorOutput "  Substituindo '$badChar' por '$goodChar' ($($matches.Count) ocorrências)" "Yellow"
                }
            }
        }
        
        if ($changesCount -gt 0) {
            if ($PreviewOnly) {
                Write-ColorOutput "PREVIEW: $FilePath" "Cyan"
                Write-ColorOutput "  Mudanças que seriam aplicadas:" "Yellow"
                foreach ($change in $changes) {
                    Write-ColorOutput "    $change" "White"
                }
                Write-ColorOutput "  Total: $changesCount substituições" "Green"
            }
            else {
                # Criar backup
                $backupPath = "$FilePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                Copy-Item -Path $FilePath -Destination $backupPath
                
                # Salvar arquivo corrigido
                $content | Out-File -FilePath $FilePath -Encoding UTF8 -NoNewline
                
                Write-ColorOutput "CORRIGIDO: $FilePath" "Green"
                Write-ColorOutput "  Backup criado: $backupPath" "Gray"
                foreach ($change in $changes) {
                    Write-ColorOutput "    $change" "White"
                }
                Write-ColorOutput "  Total: $changesCount substituições" "Green"
            }
            
            return @{
                Fixed = $true
                ChangesCount = $changesCount
                Changes = $changes
                BackupPath = if (!$PreviewOnly) { $backupPath } else { $null }
            }
        }
        else {
            if ($Verbose) {
                Write-ColorOutput "OK: $FilePath (sem problemas de codificação)" "Gray"
            }
            return @{
                Fixed = $false
                ChangesCount = 0
                Changes = @()
                BackupPath = $null
            }
        }
    }
    catch {
        Write-ColorOutput "ERRO: Falha ao processar $FilePath - $($_.Exception.Message)" "Red"
        return @{
            Fixed = $false
            ChangesCount = 0
            Changes = @()
            BackupPath = $null
            Error = $_.Exception.Message
        }
    }
}

function Main {
    Write-ColorOutput "=== Correção de Problemas de Codificação ===" "Magenta"
    Write-ColorOutput "Diretório: $Path" "Cyan"
    Write-ColorOutput "Extensões: $($Extensions -join ', ')" "Cyan"
    
    if ($Preview) {
        Write-ColorOutput "MODO PREVIEW - Nenhum arquivo será modificado" "Yellow"
    }
    
    Write-ColorOutput ""
    
    # Obter lista de arquivos
    Write-ColorOutput "Buscando arquivos..." "Gray"
    $files = Get-FilesToProcess -BasePath $Path -FileExtensions $Extensions
    Write-ColorOutput "Encontrados $($files.Count) arquivos para verificar" "Cyan"
    Write-ColorOutput ""
    
    # Processar arquivos
    $totalFiles = 0
    $filesWithIssues = 0
    $totalChanges = 0
    $results = @()
    
    foreach ($file in $files) {
        $totalFiles++
        
        if (Test-FileHasEncodingIssues -FilePath $file.FullName) {
            $filesWithIssues++
            $result = Fix-FileEncoding -FilePath $file.FullName -PreviewOnly:$Preview
            $results += $result
            $totalChanges += $result.ChangesCount
        }
        elseif ($Verbose) {
            Write-ColorOutput "OK: $($file.FullName) (sem problemas)" "Gray"
        }
    }
    
    # Resumo
    Write-ColorOutput ""
    Write-ColorOutput "=== RESUMO ===" "Magenta"
    Write-ColorOutput "Arquivos verificados: $totalFiles" "Cyan"
    Write-ColorOutput "Arquivos com problemas: $filesWithIssues" "Yellow"
    Write-ColorOutput "Total de substituições: $totalChanges" "Green"
    
    if ($Preview) {
        Write-ColorOutput ""
        Write-ColorOutput "Para aplicar as correções, execute novamente sem o parâmetro -Preview" "Yellow"
    }
    elseif ($filesWithIssues -gt 0) {
        Write-ColorOutput ""
        Write-ColorOutput "Backups foram criados para todos os arquivos modificados" "Gray"
        Write-ColorOutput "Para remover os backups após verificar as correções:" "Gray"
        Write-ColorOutput "  Get-ChildItem -Path '$Path' -Filter '*.backup-*' -Recurse | Remove-Item" "Gray"
    }
    
    if ($totalChanges -eq 0) {
        Write-ColorOutput ""
        Write-ColorOutput "✅ Nenhum problema de codificação encontrado!" "Green"
    }
}

# Executar script principal
try {
    Main
}
catch {
    Write-ColorOutput "Erro inesperado: $($_.Exception.Message)" "Red"
    exit 1
} 