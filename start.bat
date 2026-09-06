@echo off
cd /d "%~dp0"
call npm run build
.venv\Scripts\waitress-serve --host=127.0.0.1 --port=5001 app:app
