# Script para corrigir chamadas de createAuditLog
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Where-Object { $_.FullName -notlike "*node_modules*" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Padrão para encontrar chamadas antigas de createAuditLog
    $pattern = 'await createAuditLog\(\s*([A-Z_\.]+),\s*([A-Z_\.]+),\s*\{\s*actorId:\s*([^,]+),\s*entityId:\s*([^,]+),\s*details:\s*([^}]+)\s*\}\s*\);?'
    
    if ($content -match $pattern) {
        Write-Host "Corrigindo arquivo: $($file.FullName)"
        
        # Substituir padrão antigo pelo novo
        $newContent = $content -replace $pattern, 'await createAuditLog({
        actor_user_id: $3,
        action_type: $1,
        resource_type: $2,
        resource_id: $4,
        details: $5
      });'
        
        Set-Content -Path $file.FullName -Value $newContent
    }
}

Write-Host "Correção concluída!" 