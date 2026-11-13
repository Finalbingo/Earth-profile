@echo off
setlocal EnableExtensions
rem Double-click to open the ORBIT TERMINAL personal homepage.
rem Uses only PowerShell, which ships with Windows. No Python / Node needed.

set "PORT=8732"
set "URL=http://127.0.0.1:%PORT%/orbit-home/index.html"
set "PS1=%~dp0serve.ps1"
set "ROOT=%~dp0.."

set "PSEXE=powershell"
where powershell >nul 2>&1 || set "PSEXE=pwsh"
where %PSEXE% >nul 2>&1 || goto :nops

call :probe
if not errorlevel 1 goto :open

echo Starting local server on port %PORT% ...
start "orbit-home-server" /min "%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -Port %PORT% -Root "%ROOT%"

set /a N=0
:wait
call :probe
if not errorlevel 1 goto :open
set /a N+=1
if %N% GEQ 20 goto :fail
timeout /t 1 /nobreak >nul 2>&1
goto :wait

:open
start "" "%URL%"
echo Opened %URL%
echo.
echo Drag = look around, wheel = zoom, bottom console adjusts orbit / sun / clouds live.
echo The minimized "orbit-home-server" window keeps the page working; close it to stop.
timeout /t 4 /nobreak >nul 2>&1
exit /b 0

:probe
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command "try{Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%URL%' | Out-Null; exit 0}catch{exit 1}" >nul 2>&1
exit /b %errorlevel%

:nops
echo PowerShell was not found on this machine.
echo Install Python 3, then run this in the project folder:  python -m http.server %PORT%
pause
exit /b 1

:fail
echo The server did not start on port %PORT%.
echo Another app may be using that port - change PORT in this file and in serve.ps1 usage.
pause
exit /b 1