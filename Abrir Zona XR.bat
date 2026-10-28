@echo off
rem Abre la Zona XR desde un servidor local.
rem Hace falta para que los videos de YouTube del fondo se reproduzcan:
rem YouTube no los reproduce en paginas abiertas con doble clic (file://).
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo No se encontro Python. Abre index.html con doble clic: todo funciona menos los videos.
  pause
  exit /b
)
start "Zona XR - servidor (cierra esta ventana para apagarlo)" /min python -m http.server 8765 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
