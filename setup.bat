@echo off
cd /d "%~dp0"
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
call npm install
call npm run build
if not exist .env.local copy .env.example .env.local
