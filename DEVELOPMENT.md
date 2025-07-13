# 📋 開発引き継ぎ資料 - Health Signage

この資料は、今後の機能追加や保守を行う開発者（人間・AI）向けの技術ドキュメントです。

## 🏗️ システム構成概要

### アーキテクチャ
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Frontend        │    │      Backend        │    │     Database        │
│                     │    │                     │    │                     │
│ templates/index.html│◄──►│ app.py (Flask)      │◄──►│ mood.db (SQLite)    │
│ static/css/style.css│    │ ├─ API Routes       │    │ ├─ mood_entries     │
│ static/js/app.js    │    │ ├─ Database Init    │    │ └─ settings         │
│                     │    │ └─ Data Processing  │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### データフロー
1. **ユーザー入力** → JavaScript → Fetch API → Flask Route
2. **データ保存** → SQLite Database → Response → Chart Update
3. **グラフ描画** → Chart.js → Canvas Rendering

## 📁 ファイル構成と役割

### メインファイル
| ファイル | 役割 | 重要度 | 修正頻度 |
|----------|------|---------|----------|
| `app.py` | Flask アプリケーション本体 | 🔴 High | Medium |
| `templates/index.html` | メインUI構造 | 🔴 High | Low |
| `static/js/app.js` | フロントエンド制御 | 🔴 High | High |
| `static/css/style.css` | スタイル・レイアウト | 🟡 Medium | Medium |

### 設定ファイル
| ファイル | 役割 | 修正タイミング |
|----------|------|----------------|
| `requirements.txt` | Python依存関係 | 新しいライブラリ追加時 |
| `setup.bat/sh` | セットアップ自動化 | 環境構築変更時 |
| `start.bat/sh` | 起動自動化 | 起動手順変更時 |

## 🗃️ データベース設計

### mood_entries テーブル
```sql
CREATE TABLE mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自動増分ID
    date DATE NOT NULL UNIQUE,               -- 記録日（YYYY-MM-DD）
    mood INTEGER DEFAULT 3,                  -- 気分（1-5）
    sleep_hours INTEGER DEFAULT 7,           -- 睡眠時間（2-16）
    creative_hours INTEGER DEFAULT 0,        -- クリエイティブ時間（0-10）
    meal_count INTEGER DEFAULT 0,            -- 食事回数（0-5）
    exercise_minutes INTEGER DEFAULT 0,      -- 運動時間分（0,15,30,45,60）
    took_medicine INTEGER DEFAULT 0,         -- 薬服用（0,1）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 作成日時
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新日時
);
```

### データ制約・仕様
- **UNIQUE制約**: `date`フィールドで1日1レコードを保証
- **上書き保存**: 同日の入力は`INSERT OR REPLACE`で最新データに更新
- **デフォルト値**: 各項目に実用的なデフォルト値を設定

## 🔌 API エンドポイント仕様

### GET /api/entries
**機能**: 指定期間のデータ取得
```javascript
// リクエスト例
fetch('/api/entries?days=14')

// レスポンス例
[
  {
    "id": 1,
    "date": "2025-01-13",
    "mood": 4,
    "sleep_hours": 7,
    "creative_hours": 3,
    "meal_count": 3,
    "exercise_minutes": 30,
    "took_medicine": 1
  }
]
```

### POST /api/entries
**機能**: 今日のデータ保存
```javascript
// リクエスト例
fetch('/api/entries', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    mood: 4,
    sleep_hours: 8,
    creative_hours: 2,
    meal_count: 3,
    exercise_minutes: 45,
    took_medicine: 1
  })
})

// レスポンス例
{"success": true, "date": "2025-01-13"}
```

### POST /api/generate-dummy
**機能**: 開発用ダミーデータ生成（3ヶ月分）

## 🎨 フロントエンド構造

### JavaScript 構成
```javascript
// グローバル変数
let currentData = {...};     // 現在の入力値
let charts = {...};          // Chart.jsインスタンス
let displayDays = 14;        // 表示期間

// 主要関数
initializeInputs()           // 入力要素初期化
loadCharts()                 // グラフデータ読み込み
saveData()                   // データ保存
drawMoodChart()              // 気分+睡眠チャート描画
drawCreativeChart()          // クリエイティブチャート描画
drawMealChart()              // 食事チャート描画
drawExerciseChart()          // 運動チャート描画
```

### CSS 設計思想
- **1920x540px固定**: サイネージディスプレイ専用
- **2カラムレイアウト**: 左側グラフ、右側入力
- **カードベース**: 白いカードでコンテンツをグループ化
- **タッチ最適化**: 大きなボタン、適切な間隔

## 🛠️ 開発時の注意事項

### よくある開発ケース

#### 1. 新しい測定項目の追加
**手順**:
1. `app.py`: データベーススキーマにカラム追加
2. `app.py`: API エンドポイントに項目追加
3. `templates/index.html`: 入力UIを追加
4. `static/js/app.js`: JavaScript処理を追加
5. `static/css/style.css`: スタイルを追加

**例**: "水分摂取量"を追加する場合
```sql
-- 1. DBスキーマ
ALTER TABLE mood_entries ADD COLUMN water_intake INTEGER DEFAULT 0;

-- 2. HTML
<div class="input-group">
  <div class="input-header">
    <i class="fas fa-tint header-icon"></i>
    <h3>水分摂取: <span id="waterValue">0</span>L</h3>
  </div>
  <input type="range" id="waterSlider" min="0" max="5" value="0" class="slider">
</div>

// 3. JavaScript
const waterSlider = document.getElementById('waterSlider');
waterSlider.addEventListener('input', function() {
  currentData.water_intake = parseInt(this.value);
  saveData();
});
```

#### 2. グラフの種類変更
Chart.jsの`type`プロパティを変更:
- `'line'`: 線グラフ
- `'bar'`: 棒グラフ
- `'pie'`: 円グラフ
- `'doughnut'`: ドーナツグラフ

#### 3. 表示期間の調整
`templates/index.html`の`daysSlider`属性を変更:
```html
<input type="range" id="daysSlider" 
       min="7" max="84" step="7" value="14">
```

#### 4. デザインテーマの変更
`static/css/style.css`の主要カラー変数:
```css
/* メインカラー */
--primary-color: #667eea;
--secondary-color: #764ba2;

/* グラデーション背景 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### デバッグ手法

#### 1. バックエンドエラー
```bash
# Flask開発サーバーのログ確認
python app.py

# SQLiteデータベース直接確認
sqlite3 mood.db
.tables
SELECT * FROM mood_entries ORDER BY date DESC LIMIT 10;
```

#### 2. フロントエンドエラー
```javascript
// ブラウザ開発者ツールでデバッグ
console.log('Current data:', currentData);
console.log('Charts:', charts);

// APIレスポンス確認
fetch('/api/entries?days=7')
  .then(response => response.json())
  .then(data => console.log('API Response:', data));
```

#### 3. よくあるエラーと対処法

**エラー**: グラフが表示されない
```javascript
// 対処: Chart.jsが正しく読み込まれているか確認
if (typeof Chart === 'undefined') {
  console.error('Chart.js not loaded');
}
```

**エラー**: データが保存されない
```python
# 対処: SQLiteファイルの書き込み権限確認
import os
print(os.access('mood.db', os.W_OK))
```

## 🚀 デプロイメント

### 本番環境での設定変更
```python
# app.py - 本番環境用設定
if __name__ == '__main__':
    init_db()
    # DEBUG=False, HOST設定
    app.run(debug=False, host='0.0.0.0', port=5001)
```

### 推奨する本番環境
- **Webサーバー**: Gunicorn + Nginx
- **データベース**: SQLite（小規模）または PostgreSQL（大規模）
- **インフラ**: Docker コンテナ化

## 📊 パフォーマンス考慮事項

### 大量データ対応
現在の設計は数年分のデータ（〜1000レコード）を想定。より大規模な場合:
1. **ページネーション**: API にoffset/limit追加
2. **インデックス**: 日付フィールドにインデックス追加
3. **キャッシュ**: Redisなどでグラフデータをキャッシュ

### レスポンス最適化
```python
# 大量データの場合、日付範囲を制限
@app.route('/api/entries')
def get_entries():
    days = min(int(request.args.get('days', 14)), 365)  # 最大1年
```

## 🧪 テスト戦略

### 単体テスト例
```python
import unittest
from app import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
    
    def test_get_entries(self):
        response = self.app.get('/api/entries?days=7')
        self.assertEqual(response.status_code, 200)
    
    def test_post_entry(self):
        data = {'mood': 4, 'sleep_hours': 8}
        response = self.app.post('/api/entries', json=data)
        self.assertEqual(response.status_code, 200)
```

### E2Eテスト
Seleniumを使用してブラウザテストを実装可能。

## 🔒 セキュリティ考慮事項

### 現在の実装
- **ローカル専用**: 外部アクセス制限なし
- **データ検証**: 基本的な型チェックのみ

### 本番環境での追加対策
1. **入力検証**: 範囲チェック、SQLインジェクション対策
2. **認証**: ユーザー認証システム追加
3. **HTTPS**: SSL/TLS証明書設定
4. **CORS**: 適切なCORS設定

## 📝 今後の改善提案

### 優先度: High
1. **データエクスポート機能**: CSV/JSON出力
2. **データバックアップ**: 自動バックアップ機能
3. **ユーザー設定**: 測定項目のカスタマイズ
4. **モバイル対応**: レスポンシブデザイン

### 優先度: Medium
1. **統計分析**: 平均値、傾向分析
2. **アラート機能**: 異常値の通知
3. **ダークモード**: UI テーマ切り替え
4. **多言語対応**: 国際化対応

### 優先度: Low
1. **AI分析**: 機械学習による傾向予測
2. **SNS連携**: データシェア機能
3. **ウェアラブル連携**: デバイス連携
4. **PWA対応**: プログレッシブWebアプリ化

## 🤝 コントリビューション ガイドライン

### コード規約
- **Python**: PEP 8準拠
- **JavaScript**: ESLint推奨設定
- **HTML/CSS**: BEM命名規則推奨

### コミットメッセージ
```
タイプ: 簡潔な説明

🔧 詳細な変更内容:
- 具体的な変更点1
- 具体的な変更点2

✅ テスト結果:
- 動作確認項目

🤖 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### ブランチ戦略
- `main`: 本番リリース用
- `develop`: 開発統合用
- `feature/機能名`: 機能開発用
- `fix/修正内容`: バグ修正用

---

**最終更新**: 2025-01-13  
**作成者**: sourcekatsudon + Claude Code  
**バージョン**: 1.0.0