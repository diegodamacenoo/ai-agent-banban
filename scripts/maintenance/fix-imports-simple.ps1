Write-Host "Corrigindo caminhos de importacao..." -ForegroundColor Green

# Encontrar arquivos TypeScript
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Corrigir imports de hooks
    $content = $content -replace '@/hooks/use-toast', '@/shared/hooks/use-toast'
    $content = $content -replace '@/hooks/use-user', '@/shared/hooks/use-user'
    $content = $content -replace '@/hooks/useClientType', '@/shared/hooks/useClientType'
    
    # Corrigir imports de componentes UI
    $content = $content -replace '@/components/ui/', '@/shared/ui/'
    
    # Corrigir Supabase client
    $content = $content -replace 'createSupabaseClient\(', 'createSupabaseBrowserClient('
    
    # Corrigir lib paths
    $content = $content -replace '@/lib/supabase/server', '@/core/supabase/server'
    $content = $content -replace '@/lib/supabase/client', '@/core/supabase/client'
    $content = $content -replace '@/lib/utils', '@/shared/utils'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Corrigido: $($file.Name)" -ForegroundColor Yellow
        $count++
    }
}

Write-Host "Total de arquivos corrigidos: $count" -ForegroundColor Green

if ($count -gt 0) {
    Write-Host "Executando build..." -ForegroundColor Blue
    npm run build
} 