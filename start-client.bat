@echo off
chcp 65001 > nul
title Galaxy Client

netstat -an -p tcp | findstr /R /C:":5173 .*LISTENING" > nul
if %errorlevel% == 0 (
    echo [ИНФО] Клиент Galaxy УЖЕ запущен и прослушивает порт 5173.
    echo Повторный запуск не требуется.
    if not "%~1"=="--no-pause" pause
    exit /b 0
)

echo Запуск клиента Galaxy на порту 5173...
echo ========================================
cd /d "%~dp0client"
npm run dev

if not "%~1"=="--no-pause" pause
