$files = Get-ChildItem -Path "src/shared/ui" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    # Update imports
    $content = $content -replace 'from "@/lib/utils"', 'from "@/shared/utils/utils"'
    $content = $content -replace 'from "@/hooks/use-mobile"', 'from "@/shared/hooks/use-mobile"'
    $content = $content -replace 'from "@/components/ui/', 'from "@/shared/ui/'

    # Save the file
    $content | Set-Content $file.FullName -NoNewline
}

Write-Host "Import paths updated in all files under src/shared/ui" 