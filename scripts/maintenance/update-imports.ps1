$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Atualizar imports de utils
    $content = $content -replace 'from "@/lib/utils"', 'from "@/shared/utils/utils"'
    
    # Atualizar imports de componentes UI
    $content = $content -replace 'from "@/components/ui/', 'from "@/shared/ui/'
    
    # Atualizar imports de hooks
    $content = $content -replace 'from "@/hooks/', 'from "@/shared/hooks/'
    
    # Atualizar imports de contexts
    $content = $content -replace 'from "@/contexts/', 'from "@/core/contexts/'
    
    # Atualizar imports de auth
    $content = $content -replace 'from "@/lib/auth/', 'from "@/core/auth/'
    
    # Atualizar imports de supabase
    $content = $content -replace 'from "@/lib/supabase/', 'from "@/core/supabase/'
    
    # Atualizar imports de api
    $content = $content -replace 'from "@/lib/api/', 'from "@/core/api/'
    
    # Atualizar imports de types
    $content = $content -replace 'from "@/types/', 'from "@/shared/types/'
    
    Set-Content $file.FullName $content
} 