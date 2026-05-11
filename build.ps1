# Nobiji Pro — Manuscript Review Website
# Build script: copies the latest manuscript drafts into web_manuscript/content/
#
# Run from repository root:
#   powershell -File web_manuscript/build.ps1
#
# This script does NOT modify drafts/. It only copies files into
# web_manuscript/content/ for the static website to load.

$ErrorActionPreference = "Stop"

# Resolve project paths relative to this script's location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$EnglishSrc = Join-Path $ProjectRoot "drafts/english"
$BanglaSrc = Join-Path $ProjectRoot "drafts/bangla"
$EnglishDst = Join-Path $ScriptDir "content/en"
$BanglaDst = Join-Path $ScriptDir "content/bn"

# Ensure destination folders exist
New-Item -ItemType Directory -Path $EnglishDst -Force | Out-Null
New-Item -ItemType Directory -Path $BanglaDst -Force | Out-Null

# Copy all .md chapter files (numeric-prefix only — skip topic-named drafts)
Write-Host "Copying English chapter drafts..."
Get-ChildItem -Path $EnglishSrc -Filter "*.md" | Where-Object { $_.Name -match '^\d{2}_' } | ForEach-Object {
    Copy-Item $_.FullName -Destination $EnglishDst -Force
    Write-Host "  $($_.Name)"
}

Write-Host "Copying Bangla chapter drafts..."
Get-ChildItem -Path $BanglaSrc -Filter "*.md" | Where-Object { $_.Name -match '^\d{2}_' } | ForEach-Object {
    Copy-Item $_.FullName -Destination $BanglaDst -Force
    Write-Host "  $($_.Name)"
}

# Generate manifest summary
$EnFiles = (Get-ChildItem $EnglishDst -Filter "*.md").Count
$BnFiles = (Get-ChildItem $BanglaDst -Filter "*.md").Count

Write-Host ""
Write-Host "Build complete:"
Write-Host "  English chapters: $EnFiles"
Write-Host "  Bangla chapters:  $BnFiles"
Write-Host ""
Write-Host "Original drafts/ folder is unchanged."
Write-Host "To preview locally: open web_manuscript/index.html in a browser, or run:"
Write-Host "  python -m http.server 8080 --directory web_manuscript"
Write-Host "  Then visit http://localhost:8080"
