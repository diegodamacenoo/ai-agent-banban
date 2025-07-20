#!/usr/bin/env pwsh

Write-Host "🔧 Iniciando correção de caminhos de importação..." -ForegroundColor Green

# Definir mapeamentos de correção
$importMappings = @{
    # Hooks incorretos
    '@/hooks/use-toast' = '@/shared/hooks/use-toast'
    '@/hooks/use-user' = '@/shared/hooks/use-user'
    '@/hooks/useClientType' = '@/shared/hooks/useClientType'
    
    # Componentes UI incorretos
    '@/components/ui/' = '@/shared/ui/'
    
    # Supabase client incorretos
    'createSupabaseClient' = 'createSupabaseBrowserClient'
    
    # Lib paths incorretos
    '@/lib/supabase/server' = '@/core/supabase/server'
    '@/lib/supabase/client' = '@/core/supabase/client'
    
    # Utils incorretos
    '@/utils/' = '@/shared/utils/'
    '@/lib/utils' = '@/shared/utils'
}

# Função para processar arquivo
function Fix-ImportPaths {
    param(
        [string]$FilePath,
        [hashtable]$Mappings
    )
    
    if (!(Test-Path $FilePath)) {
        return $false
    }
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $changed = $false
    
    foreach ($old in $Mappings.Keys) {
        $new = $Mappings[$old]
        if ($content -match [regex]::Escape($old)) {
            $content = $content -replace [regex]::Escape($old), $new
            $changed = $true
            Write-Host "  ✓ Corrigido: $old → $new" -ForegroundColor Yellow
        }
    }
    
    if ($changed) {
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        return $true
    }
    
    return $false
}

# Encontrar todos os arquivos TypeScript e TSX
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx" | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.next" -and
    $_.FullName -notmatch "dist"
}

Write-Host "📁 Encontrados $($files.Count) arquivos para verificar..." -ForegroundColor Blue

$totalFixed = 0

foreach ($file in $files) {
    Write-Host "🔍 Verificando: $($file.Name)" -ForegroundColor Cyan
    
    if (Fix-ImportPaths -FilePath $file.FullName -Mappings $importMappings) {
        $totalFixed++
        Write-Host "  ✅ Arquivo corrigido!" -ForegroundColor Green
    }
}

Write-Host "`n📊 Resumo:" -ForegroundColor Magenta
Write-Host "  • Arquivos verificados: $($files.Count)" -ForegroundColor White
Write-Host "  • Arquivos corrigidos: $totalFixed" -ForegroundColor Green

if ($totalFixed -gt 0) {
    Write-Host "`n🚀 Executando build para verificar..." -ForegroundColor Green
    npm run build
} else {
    Write-Host "`n✨ Nenhuma correção necessária!" -ForegroundColor Green
}

Write-Host "`n✅ Script concluído!" -ForegroundColor Green 