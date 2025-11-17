# PowerShell script to push to GitHub
# This script handles path encoding issues with special characters

$ErrorActionPreference = 'Continue'

# Get the script's directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "Error: Not a git repository!" -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Yellow
git status --short

# Ask for commit message or use default
$commitMessage = Read-Host "`nEnter commit message (or press Enter for default)"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update project files"
}

# Stage all changes
Write-Host "`nStaging all changes..." -ForegroundColor Yellow
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "`nError pushing to GitHub. Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

