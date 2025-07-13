@echo off
echo === 気分測定サイネージ セットアップ (Python版) ===
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Pythonがインストールされていません。
    echo https://python.org からダウンロードしてインストールしてください。
    pause
    exit /b 1
)

echo 1. Python仮想環境を作成しています...
python -m venv venv

echo 2. 仮想環境を有効化しています...
call venv\Scripts\activate.bat

echo 3. 依存関係をインストールしています...
pip install Flask

echo.
echo === セットアップ完了! ===
echo.
echo アプリケーションを起動するには:
echo   start.bat
echo.
echo または手動で:
echo   venv\Scripts\activate.bat
echo   python app.py
pause