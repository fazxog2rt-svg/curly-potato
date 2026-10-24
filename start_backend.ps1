# AI Study Companion - Backend Startup Script (Windows PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Memulai Backend AI Study Companion (FastAPI)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Set working directory to backend
Set-Location -Path "$PSScriptRoot\backend"

# Ensure .env exists in backend
if (-not (Test-Path ".env")) {
    if (Test-Path "..\.env") {
        Copy-Item "..\.env" ".env"
    } elseif (Test-Path "..\.env.example") {
        Copy-Item "..\.env.example" ".env"
        Write-Host "[INFO] Membuat file backend\.env dari template .env.example." -ForegroundColor Yellow
    }
}

# Run Uvicorn server on port 8000
& "venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
