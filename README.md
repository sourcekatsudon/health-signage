# 🩺 Health Signage - 気分測定サイネージ

1920x540pxサイネージディスプレイに最適化された、日常の気分と体調を記録・可視化するWebアプリケーションです。

![健康管理サイネージ](https://img.shields.io/badge/Platform-Web-blue) ![Python](https://img.shields.io/badge/Python-3.8+-green) ![Flask](https://img.shields.io/badge/Framework-Flask-red) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 特徴

- 🎯 **タッチパネル対応**: サイネージディスプレイでの操作に最適化
- 📊 **リアルタイム可視化**: Chart.jsによる美しいグラフ表示
- 💾 **データ永続化**: SQLiteで安全にデータを保存
- ⚡ **軽量設計**: Python Flask + 純粋なHTML/CSS/JS
- 🔧 **簡単セットアップ**: ワンクリックでセットアップ・起動

## 📱 測定項目

### 主要指標
| 項目 | 入力方法 | 範囲 | デフォルト |
|------|----------|------|------------|
| 🎭 **気分** | 5段階ボタン | 死にたい〜良い | 普通 |
| 😴 **睡眠時間** | スライダー | 2〜16時間 | 7時間 |
| 🎨 **クリエイティブ時間** | スライダー | 0〜10時間 | 0時間 |
| 🍽️ **食事回数** | ボタン | 0〜5回 | 0回 |
| 🏃 **運動時間** | ボタン | 0/15/30/45/60分 | 0分 |
| 💊 **薬の服用** | YES/NO | - | NO |

### データ可視化
- **上部メイングラフ**: 気分 + 睡眠時間の複合表示
- **下部サブグラフ**: クリエイティブ時間、食事回数、運動時間を個別表示
- **表示期間**: 1週間〜12週間（1週間単位で調整可能）

## 🚀 クイックスタート

### 必要な環境
- Python 3.8以上
- Webブラウザ（Chrome, Firefox, Safari, Edge）

### インストール & 起動

#### Windows
```batch
# リポジトリをクローン
git clone https://github.com/sourcekatsudon/health-signage.git
cd health-signage

# セットアップ（Python仮想環境作成 + Flask インストール）
setup.bat

# アプリケーション起動
start.bat
```

#### macOS / Linux
```bash
# リポジトリをクローン
git clone https://github.com/sourcekatsudon/health-signage.git
cd health-signage

# セットアップ（Python仮想環境作成 + Flask インストール）
chmod +x setup.sh start.sh
./setup.sh

# アプリケーション起動
./start.sh
```

### アクセス
ブラウザで http://localhost:5000 にアクセス

## 🎛️ 使用方法

### 基本操作
1. **データ入力**: 右側パネルの各項目をタッチ/クリックで入力
2. **リアルタイム更新**: 入力と同時にグラフが自動更新
3. **期間調整**: 上部のスライダーで表示期間を変更（1〜12週間）
4. **データ蓄積**: 毎日の入力データが自動保存・蓄積

### データの特徴
- **上書き保存**: 1日に複数回入力した場合、最新データで上書き
- **欠損日対応**: 入力がない日は最後の入力値で補完（グラフ上は点線表示）
- **長期トレンド**: 週・月単位での変化を追跡可能

## 🏗️ 技術仕様

### アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ HTML/CSS/JS     │◄──►│ Python Flask    │◄──►│ SQLite          │
│ Chart.js        │    │ REST API        │    │ mood_entries    │
│ Font Awesome    │    │                 │    │ settings        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック
- **Backend**: Python 3.8+ / Flask 3.0
- **Frontend**: HTML5 / CSS3 / Vanilla JavaScript
- **Database**: SQLite 3
- **Charts**: Chart.js 4.4
- **Icons**: Font Awesome 6.4
- **Styling**: Pure CSS (フレームワーク不使用)

### API エンドポイント
| Method | Endpoint | 説明 |
|--------|----------|------|
| `GET` | `/` | メインページ表示 |
| `GET` | `/api/entries?days={n}` | 指定期間のデータ取得 |
| `POST` | `/api/entries` | 今日のデータ保存 |
| `POST` | `/api/generate-dummy` | ダミーデータ生成（開発用） |

## 📁 プロジェクト構成

```
health-signage/
├── 📄 README.md                 # このファイル
├── 🐍 app.py                    # Flask アプリケーション本体
├── 📋 requirements.txt          # Python依存関係
├── 🗃️ mood.db                   # SQLiteデータベース（自動生成）
│
├── 📁 templates/
│   └── 🌐 index.html           # メインHTMLテンプレート
│
├── 📁 static/
│   ├── 📁 css/
│   │   └── 🎨 style.css        # スタイルシート
│   └── 📁 js/
│       └── ⚡ app.js           # JavaScript（Chart.js制御）
│
├── 🔧 setup.bat                 # Windows セットアップスクリプト
├── 🔧 setup.sh                  # Linux/macOS セットアップスクリプト
├── ▶️ start.bat                 # Windows 起動スクリプト
└── ▶️ start.sh                  # Linux/macOS 起動スクリプト
```

## 🎨 UI/UX デザイン

### レスポンシブデザイン
- **対象解像度**: 1920x540px（横長サイネージ）
- **レイアウト**: 左側グラフエリア + 右側入力エリア
- **カラーテーマ**: グラデーション背景 + ホワイトカード

### アクセシビリティ
- **大きなボタン**: タッチ操作に最適化
- **色分けアイコン**: 視覚的にわかりやすい操作
- **即座のフィードバック**: 入力と同時にグラフ更新

## 🔧 カスタマイズ

### 測定項目の追加
`app.py`のデータベーススキーマとAPI、`templates/index.html`のUI、`static/js/app.js`のJavaScriptを同期して修正

### デザインのカスタマイズ
`static/css/style.css`でカラーテーマ、レイアウト、アニメーションを調整

### 表示期間の変更
`templates/index.html`の`daysSlider`の`min`, `max`, `step`属性を調整

## 🐛 トラブルシューティング

### よくある問題

**Q: アプリケーションが起動しない**
```bash
# Python がインストールされているか確認
python --version  # または python3 --version

# Flask が正しくインストールされているか確認
pip list | grep Flask

# 仮想環境が有効化されているか確認（コマンドプロンプトに (venv) が表示される）
```

**Q: グラフが表示されない**
- ブラウザのJavaScriptが有効か確認
- ブラウザの開発者ツールでエラーをチェック
- Chart.js CDNの読み込みを確認

**Q: データが保存されない**
- `mood.db` ファイルの書き込み権限を確認
- ブラウザのコンソールでAPI エラーをチェック

### ログ確認
```bash
# Flask開発サーバーのログを確認
python app.py
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 👥 作者

- **sourcekatsudon** - *Initial work* - [GitHub](https://github.com/sourcekatsudon)

## 🙏 謝辞

- [Chart.js](https://www.chartjs.org/) - 美しいグラフライブラリ
- [Font Awesome](https://fontawesome.com/) - アイコンライブラリ
- [Flask](https://flask.palletsprojects.com/) - 軽量Webフレームワーク

---

💡 **ヒント**: サイネージディスプレイでの継続的な健康管理にお役立てください！