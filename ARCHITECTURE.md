# 🏗️ システム設計書 - Health Signage

## 概要

Health Signage は1920x540pxサイネージディスプレイ向けの健康管理Webアプリケーションです。シンプルな3層アーキテクチャで構成され、リアルタイムでの健康データ記録・可視化を実現しています。

## システム全体像

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Health Signage System                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Presentation  │    │    Business     │    │      Data       │         │
│  │     Layer       │    │     Layer       │    │     Layer       │         │
│  │                 │    │                 │    │                 │         │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │         │
│  │ │ HTML/CSS/JS │ │◄──►│ │ Flask App   │ │◄──►│ │ SQLite DB   │ │         │
│  │ │             │ │    │ │             │ │    │ │             │ │         │
│  │ │ Chart.js    │ │    │ │ REST API    │ │    │ │ mood_entries│ │         │
│  │ │ Font Awesome│ │    │ │ Data Logic  │ │    │ │ settings    │ │         │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 詳細アーキテクチャ

### 1. プレゼンテーション層（Frontend）

#### 構成要素
```
static/
├── css/
│   └── style.css          # スタイルシート
├── js/
│   └── app.js             # フロントエンド制御
└── (外部CDN)
    ├── Chart.js 4.4       # グラフ描画ライブラリ
    └── Font Awesome 6.4   # アイコンライブラリ

templates/
└── index.html             # メインUIテンプレート
```

#### 責務
- **ユーザーインターフェース**: タッチパネル最適化UI
- **データ可視化**: Chart.jsによるリアルタイムグラフ描画
- **ユーザー操作**: 入力フォーム、スライダー、ボタン制御
- **API通信**: Fetch APIによるバックエンド通信

#### 技術スタック
- **HTML5**: セマンティックマークアップ
- **CSS3**: フレックスボックス、グラデーション、アニメーション
- **Vanilla JavaScript**: フレームワーク不使用
- **Chart.js**: キャンバスベースグラフ描画
- **Font Awesome**: SVGアイコン

### 2. ビジネス層（Backend）

#### 構成要素
```python
app.py
├── Flask Application     # Webアプリケーション本体
├── Route Handlers        # HTTP リクエスト処理
├── Database Operations   # DB CRUD操作
├── Data Validation      # 入力値検証
└── Business Logic       # ビジネスルール
```

#### 主要コンポーネント

##### Flask Application
```python
app = Flask(__name__)
# デバッグモード、ホスト、ポート設定
app.run(debug=True, host='0.0.0.0', port=5001)
```

##### Route Handlers
| エンドポイント | メソッド | 責務 |
|----------------|----------|------|
| `/` | GET | メインページ表示 |
| `/api/entries` | GET | データ取得 |
| `/api/entries` | POST | データ保存 |
| `/api/generate-dummy` | POST | ダミーデータ生成 |

##### Data Processing Flow
```
HTTP Request → Route Handler → Data Validation → Database Operation → HTTP Response
```

#### 技術スタック
- **Flask 3.0**: 軽量Webフレームワーク
- **SQLite3**: 組み込みデータベース
- **Python 3.8+**: プログラミング言語
- **Jinja2**: テンプレートエンジン

### 3. データ層（Database）

#### スキーマ設計
```sql
-- メインデータテーブル
CREATE TABLE mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,      -- サロゲートキー
    date DATE NOT NULL UNIQUE,                 -- ナチュラルキー（記録日）
    mood INTEGER DEFAULT 3,                    -- 気分スコア
    sleep_hours INTEGER DEFAULT 7,             -- 睡眠時間
    creative_hours INTEGER DEFAULT 0,          -- クリエイティブ時間
    meal_count INTEGER DEFAULT 0,              -- 食事回数
    exercise_minutes INTEGER DEFAULT 0,        -- 運動時間
    took_medicine INTEGER DEFAULT 0,           -- 薬服用フラグ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 作成日時
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新日時
);

-- 設定テーブル（将来拡張用）
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
);
```

#### インデックス戦略
```sql
-- 日付での高速検索用
CREATE UNIQUE INDEX idx_mood_entries_date ON mood_entries(date);

-- 日付範囲検索用（将来の最適化）
CREATE INDEX idx_mood_entries_date_range ON mood_entries(date DESC);
```

#### データ制約
- **UNIQUE制約**: 1日1レコードの制約
- **NOT NULL制約**: 必須フィールドの保証
- **DEFAULT値**: 実用的なデフォルト値
- **型制約**: INTEGER型による値範囲制限

## データフロー

### 1. データ入力フロー
```
User Input → JavaScript Event → Data Validation → Fetch API → Flask Route → SQLite → Response → Chart Update
```

#### 詳細シーケンス
1. **ユーザー操作**: ボタンクリック、スライダー操作
2. **イベント処理**: JavaScriptイベントリスナー実行
3. **データ更新**: `currentData`オブジェクト更新
4. **API呼び出し**: `saveData()`関数実行
5. **HTTP通信**: `POST /api/entries`
6. **バリデーション**: Flask側での入力値検証
7. **DB操作**: `INSERT OR REPLACE`文実行
8. **レスポンス**: JSON形式で結果返却
9. **UI更新**: `loadCharts()`関数でグラフ再描画

### 2. データ取得・表示フロー
```
Page Load → API Call → Database Query → JSON Response → Chart.js Rendering
```

#### 詳細シーケンス
1. **ページ読み込み**: `DOMContentLoaded`イベント
2. **初期化**: `loadCharts()`関数実行
3. **API呼び出し**: `GET /api/entries?days=14`
4. **DB検索**: 指定期間のデータ取得
5. **データ処理**: 日付補完、デフォルト値設定
6. **グラフ描画**: Chart.jsによる複数グラフ描画
7. **UI更新**: グラフとレジェンドの表示

## セキュリティ設計

### 現在の実装レベル
- **ローカル専用**: 外部ネットワークアクセス想定外
- **基本検証**: 型チェック、範囲チェック
- **SQLインジェクション対策**: パラメータ化クエリ使用

### 将来の強化項目
1. **認証・認可**: ユーザー認証システム
2. **入力検証**: より厳密なバリデーション
3. **HTTPS**: SSL/TLS暗号化
4. **CORS**: クロスオリジン制御
5. **レート制限**: API アクセス制御

## パフォーマンス設計

### 現在の最適化
- **軽量フレームワーク**: Flask の採用
- **効率的DB**: SQLite のシンプル性
- **CDN利用**: Chart.js、Font Awesome
- **最小限DOM操作**: 必要時のみChart再描画

### スケーラビリティ考慮事項

#### データ量の増加対応
```python
# 現在: ~1000レコード対応
# 将来: 10,000+ レコード対応策

# 1. ページネーション
@app.route('/api/entries')
def get_entries():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    offset = (page - 1) * per_page
    # LIMIT/OFFSET クエリ

# 2. インデックス最適化
CREATE INDEX idx_mood_entries_date_desc ON mood_entries(date DESC);

# 3. データ集約
CREATE VIEW daily_stats AS 
SELECT date, AVG(mood) as avg_mood, AVG(sleep_hours) as avg_sleep
FROM mood_entries GROUP BY date;
```

#### 同時アクセス対応
```python
# 1. 接続プーリング
from sqlalchemy import create_engine
engine = create_engine('sqlite:///mood.db', pool_size=20)

# 2. 非同期処理
from flask import Flask
from flask_caching import Cache
app = Flask(__name__)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.memoize(timeout=300)
def get_cached_entries(days):
    # キャッシュ機能付きデータ取得
```

## エラーハンドリング設計

### 階層的エラー処理
```
Frontend Error → User Feedback
     ↓
Backend Error → Log + HTTP Status
     ↓
Database Error → Rollback + Recovery
```

#### JavaScript エラーハンドリング
```javascript
async function saveData() {
    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(currentData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        if (result.success) {
            loadCharts();
        } else {
            showUserError('データの保存に失敗しました');
        }
    } catch (error) {
        console.error('保存エラー:', error);
        showUserError('ネットワークエラーが発生しました');
    }
}
```

#### Flask エラーハンドリング
```python
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal Server Error'}), 500

def save_entry_with_error_handling(data):
    try:
        # データベース操作
        conn = sqlite3.connect('mood.db')
        cursor = conn.cursor()
        # INSERT OR REPLACE 実行
        conn.commit()
        return {'success': True}
    except sqlite3.Error as e:
        conn.rollback()
        app.logger.error(f'Database error: {e}')
        return {'error': 'Database operation failed'}, 500
    finally:
        conn.close()
```

## テスト設計

### テスト戦略
```
Unit Tests (単体テスト)
├── Backend API Tests
├── Database Tests  
└── Frontend Function Tests

Integration Tests (結合テスト)
├── API ↔ Database
└── Frontend ↔ Backend

E2E Tests (エンドツーエンドテスト)
└── Browser Automation Tests
```

### テスト実装例
```python
# backend_test.py
import unittest
from app import app, init_db

class HealthSignageTest(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        init_db()
    
    def test_get_entries(self):
        response = self.app.get('/api/entries?days=7')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
    
    def test_post_entry(self):
        test_data = {
            'mood': 4,
            'sleep_hours': 8,
            'creative_hours': 3,
            'meal_count': 3,
            'exercise_minutes': 30,
            'took_medicine': 1
        }
        response = self.app.post('/api/entries', json=test_data)
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertTrue(result['success'])
```

## デプロイメント設計

### 開発環境
```
Developer Machine
├── Python 3.8+ + venv
├── SQLite (ファイルベース)
├── Flask Development Server
└── ローカルブラウザ
```

### 本番環境（推奨）
```
Production Server
├── Python 3.8+ + venv
├── Gunicorn (WSGI Server)
├── Nginx (Reverse Proxy)
├── SQLite or PostgreSQL
├── SSL/TLS Certificate
└── ファイアウォール設定
```

#### Docker化設計
```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  health-signage:
    build: .
    ports:
      - "5001:5001"
    volumes:
      - ./data:/app/data
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=sqlite:///data/mood.db
```

## 監視・運用設計

### ログ設計
```python
import logging
from logging.handlers import RotatingFileHandler

# ログ設定
logging.basicConfig(
    handlers=[RotatingFileHandler('app.log', maxBytes=100000, backupCount=10)],
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

# 使用例
app.logger.info(f'New entry saved: {date}')
app.logger.error(f'Database error: {error}')
```

### バックアップ戦略
```bash
#!/bin/bash
# backup.sh - 日次バックアップスクリプト
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 mood.db ".backup backup/mood_${DATE}.db"
gzip backup/mood_${DATE}.db

# 30日以上古いバックアップを削除
find backup/ -name "mood_*.db.gz" -mtime +30 -delete
```

## 拡張設計

### 将来機能の設計方針

#### 1. マルチユーザー対応
```sql
-- ユーザーテーブル追加
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- mood_entriesにuser_id追加
ALTER TABLE mood_entries ADD COLUMN user_id INTEGER REFERENCES users(id);
```

#### 2. 通知機能
```python
# notification.py
class NotificationService:
    def check_mood_trend(self, user_id):
        # 気分の低下傾向を検知
        recent_moods = get_recent_moods(user_id, days=7)
        if avg(recent_moods) < 2.5:
            send_alert(user_id, "気分の低下が続いています")
```

#### 3. データエクスポート
```python
@app.route('/api/export/<format>')
def export_data(format):
    if format == 'csv':
        return generate_csv_export()
    elif format == 'json':
        return generate_json_export()
    elif format == 'pdf':
        return generate_pdf_report()
```

---

**文書バージョン**: 1.0.0  
**最終更新**: 2025-01-13  
**作成者**: sourcekatsudon + Claude Code