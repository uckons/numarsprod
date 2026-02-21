@echo off
setlocal

REM Windows helper for local print agent
cd /d %~dp0\..

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js belum terinstall. Install Node.js LTS (v18/v20) dulu.
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm tidak ditemukan di instalasi Node.js ini.
  echo [HINT] Biasanya terjadi jika Node di-copy manual ^(contoh C:\node\nodejs^) sehingga folder npm tidak ikut.
  echo [HINT] Reinstall Node.js LTS pakai installer resmi .msi dari https://nodejs.org/
  echo [HINT] Setelah install ulang, buka CMD baru lalu cek: node -v dan npm -v
  exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node -p "process.versions.node"') do set NODE_MAJOR=%%a
if %NODE_MAJOR% GEQ 23 (
  echo [WARN] Terdeteksi Node.js v%NODE_MAJOR%.x. Rekomendasi: Node.js LTS v18/v20 untuk stabilitas driver thermal.
)

if not exist node_modules (
  echo [INFO] node_modules belum ada. Menjalankan npm install...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install gagal.
    exit /b 1
  )
)

if "%PRINT_AGENT_PORT%"=="" set PRINT_AGENT_PORT=19000
if "%PRINT_AGENT_TOKEN%"=="" set PRINT_AGENT_TOKEN=change-me

echo [INFO] Starting local print agent at port %PRINT_AGENT_PORT%
node scripts\local-print-agent.js

endlocal
