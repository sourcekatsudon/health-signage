#!/bin/bash

echo "=== 気分測定サイネージ 起動中 ==="
echo

# Activate virtual environment
source venv/bin/activate

# Start the application
echo "アプリケーションを起動しています..."
echo "ブラウザで http://localhost:5001 にアクセスしてください"
python app.py