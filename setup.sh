#!/bin/bash

echo "=== 気分測定サイネージ セットアップ (Python版) ==="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3がインストールされていません。"
    echo "sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

echo "1. Python仮想環境を作成しています..."
python3 -m venv venv

echo "2. 仮想環境を有効化しています..."
source venv/bin/activate

echo "3. 依存関係をインストールしています..."
pip install Flask

echo
echo "=== セットアップ完了! ==="
echo
echo "アプリケーションを起動するには:"
echo "  ./start.sh"
echo
echo "または手動で:"
echo "  source venv/bin/activate"
echo "  python app.py"