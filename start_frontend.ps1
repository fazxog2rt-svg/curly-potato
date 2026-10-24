# AI Study Companion - Frontend Startup Script (Windows PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Memulai Frontend AI Study Companion (Next.js)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\frontend"

npm run dev
