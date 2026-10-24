# ====================================================================
# AI Study Companion - All-in-One Startup Script (Windows PowerShell)
# ====================================================================

$Host.UI.RawUI.WindowTitle = "AI Study Companion (Backend + Frontend)"
Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       🌟 MEMULAI AI STUDY COMPANION 🌟" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"

# 1. Pastikan file .env tersedia
if (-not (Test-Path "$rootDir\.env")) {
    if (Test-Path "$rootDir\.env.example") {
        Copy-Item "$rootDir\.env.example" "$rootDir\.env"
        Write-Host "[INFO] Membuat .env dari template .env.example." -ForegroundColor Yellow
    }
}
if (-not (Test-Path "$backendDir\.env")) {
    if (Test-Path "$rootDir\.env") {
        Copy-Item "$rootDir\.env" "$backendDir\.env"
    }
}

# Bersihkan port 3000 dan 8000 jika ada proses lama/zombie yang masih mengunci port
@(3000, 8000) | ForEach-Object {
    $p = $_
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -and $c.OwningProcess -ne $PID) {
            Write-Host "[INFO] Membersihkan proses lama (PID $($c.OwningProcess)) di port $p..." -ForegroundColor DarkYellow
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

# 2. Menjalankan Backend FastAPI sebagai proses independen
Write-Host "[1/3] Menjalankan Backend FastAPI di http://127.0.0.1:8000..." -ForegroundColor Green

$backendArgs = @(
    "-m", "uvicorn", "app.main:app",
    "--app-dir", ".",
    "--host", "0.0.0.0",
    "--port", "8000",
    "--reload"
)

# Gunakan Start-Process dengan argument list array dan working directory eksplisit
$backendProcess = Start-Process -FilePath $pythonExe -ArgumentList $backendArgs -WorkingDirectory $backendDir -PassThru

# 3. Tunggu hingga backend siap melayani request
Write-Host "[2/3] Menunggu kesiapan server backend..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 800
    if ($backendProcess.HasExited) {
        Write-Host "  -> [ERROR] Proses backend berhenti secara tak terduga (ExitCode: $($backendProcess.ExitCode))." -ForegroundColor Red
        Write-Host "  -> Coba jalankan 'npm run backend' di jendela baru untuk melihat detail error." -ForegroundColor Yellow
        break
    }
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $ready = $true
            break
        }
    } catch {
        # Menunggu uvicorn selesai inisialisasi
    }
}

if ($ready) {
    Write-Host "  -> Backend FastAPI siap melayani (HTTP 200 OK)." -ForegroundColor Green
} else {
    Write-Host "  -> Peringatan: Backend belum merespons. Melanjutkan..." -ForegroundColor DarkYellow
}

# 4. Buka browser secara otomatis ke http://localhost:3000
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

# 5. Menjalankan Frontend Next.js di terminal saat ini
Write-Host "[3/3] Menjalankan Frontend Next.js di http://localhost:3000..." -ForegroundColor Green
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Tekan Ctrl+C untuk menghentikan frontend & backend." -ForegroundColor DarkYellow
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

try {
    Set-Location -Path $frontendDir
    npm run dev
}
finally {
    Write-Host "`n[INFO] Menghentikan proses backend..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Pastikan jika ada child process uvicorn/python yang masih tertinggal
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*App Edu*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[INFO] Semua layanan berhasil dihentikan." -ForegroundColor Green
}
