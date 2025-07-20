# Get all TypeScript and TypeScript React files
$files = Get-ChildItem -Path "src" -Include @("*.ts", "*.tsx") -Recurse -ErrorAction SilentlyContinue

foreach ($file in $files) {
    try {
        # Read file content
        $content = [System.IO.File]::ReadAllText($file.FullName)

        # Update UI component imports
        $content = $content -replace 'from "@/components/ui/', 'from "@/shared/ui/'

        # Update utility imports
        $content = $content -replace 'from "@/lib/utils"', 'from "@/shared/utils/utils"'
        $content = $content -replace 'from "@/lib/utils/', 'from "@/shared/utils/'

        # Update hook imports
        $content = $content -replace 'from "@/hooks/', 'from "@/shared/hooks/'

        # Update core functionality imports
        $content = $content -replace 'from "@/lib/auth/', 'from "@/core/auth/'
        $content = $content -replace 'from "@/lib/supabase/', 'from "@/core/supabase/'
        $content = $content -replace 'from "@/lib/api/', 'from "@/core/api/'

        # Save the file
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated: $($file.FullName)"
    }
    catch {
        Write-Host "Error processing file: $($file.FullName)"
        Write-Host $_.Exception.Message
    }
}

Write-Host "Import paths updated in all TypeScript files" 