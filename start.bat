@echo off
echo === 気分測定サイネージ 起動中 ===
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the application
echo アプリケーションを起動しています...
echo ブラウザで http://localhost:5001 にアクセスしてください
python app.py