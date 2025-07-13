# 🔌 API 仕様書 - Health Signage

## 概要

Health Signage のバックエンドAPI仕様書です。RESTful APIとして設計され、JSON形式でデータのやり取りを行います。

## ベースURL

```
http://localhost:5001
```

## 認証

現在のバージョンでは認証機能は実装されていません（ローカル専用）。

## エンドポイント一覧

### 1. メインページ表示

```
GET /
```

**説明**: メインのWebページを表示します。

**レスポンス**: HTML（テンプレート）

---

### 2. データ取得

```
GET /api/entries
```

**説明**: 指定期間の健康データを取得します。

#### パラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|------------|----|----|-----------|------|
| days | integer | No | 14 | 取得する日数（1-365） |

#### リクエスト例

```http
GET /api/entries?days=7
```

#### レスポンス例

```json
[
  {
    "id": 1,
    "date": "2025-01-13",
    "mood": 4,
    "sleep_hours": 8,
    "creative_hours": 3,
    "meal_count": 3,
    "exercise_minutes": 30,
    "took_medicine": 1
  },
  {
    "id": 2,
    "date": "2025-01-12",
    "mood": 3,
    "sleep_hours": 7,
    "creative_hours": 2,
    "meal_count": 2,
    "exercise_minutes": 0,
    "took_medicine": 0
  }
]
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|------------|----|----|
| id | integer | レコード一意ID |
| date | string | 記録日（YYYY-MM-DD形式） |
| mood | integer | 気分（1=死にたい, 2=悪い, 3=普通, 4=まぁよい, 5=良い） |
| sleep_hours | integer | 睡眠時間（2-16時間） |
| creative_hours | integer | クリエイティブ時間（0-10時間） |
| meal_count | integer | 食事回数（0-5回） |
| exercise_minutes | integer | 運動時間（0,15,30,45,60分） |
| took_medicine | integer | 薬服用（0=No, 1=Yes） |

---

### 3. データ保存

```
POST /api/entries
```

**説明**: 今日の健康データを保存します。同日のデータが存在する場合は上書きされます。

#### リクエストボディ

```json
{
  "mood": 4,
  "sleep_hours": 8,
  "creative_hours": 3,
  "meal_count": 3,
  "exercise_minutes": 30,
  "took_medicine": 1
}
```

#### リクエストフィールド

| フィールド | 型 | 必須 | デフォルト | 制約 | 説明 |
|------------|----|----|-----------|------|------|
| mood | integer | No | 3 | 1-5 | 気分 |
| sleep_hours | integer | No | 7 | 2-16 | 睡眠時間 |
| creative_hours | integer | No | 0 | 0-10 | クリエイティブ時間 |
| meal_count | integer | No | 0 | 0-5 | 食事回数 |
| exercise_minutes | integer | No | 0 | 0,15,30,45,60 | 運動時間 |
| took_medicine | integer | No | 0 | 0,1 | 薬服用 |

#### リクエスト例

```http
POST /api/entries
Content-Type: application/json

{
  "mood": 4,
  "sleep_hours": 8,
  "creative_hours": 3,
  "meal_count": 3,
  "exercise_minutes": 30,
  "took_medicine": 1
}
```

#### レスポンス例

```json
{
  "success": true,
  "date": "2025-01-13"
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|------------|----|----|
| success | boolean | 処理成功フラグ |
| date | string | 保存された日付 |

---

### 4. ダミーデータ生成（開発用）

```
POST /api/generate-dummy
```

**説明**: 開発・テスト用のダミーデータを生成します。過去90日分のランダムなデータが作成されます。

#### リクエスト例

```http
POST /api/generate-dummy
```

#### レスポンス例

```json
{
  "success": true,
  "message": "ダミーデータを生成しました"
}
```

## エラーレスポンス

APIでエラーが発生した場合、以下の形式でエラー情報が返されます。

```json
{
  "error": "エラーメッセージの詳細"
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 400 | リクエストエラー（不正なパラメータなど） |
| 500 | サーバーエラー（データベースエラーなど） |

## データベーススキーマ

### mood_entries テーブル

```sql
CREATE TABLE mood_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    mood INTEGER DEFAULT 3,
    sleep_hours INTEGER DEFAULT 7,
    creative_hours INTEGER DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    exercise_minutes INTEGER DEFAULT 0,
    took_medicine INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 使用例

### JavaScript での使用例

```javascript
// データ取得
async function fetchHealthData(days = 14) {
  try {
    const response = await fetch(`/api/entries?days=${days}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('データ取得エラー:', error);
  }
}

// データ保存
async function saveHealthData(healthData) {
  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(healthData)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('データ保存エラー:', error);
  }
}

// 使用例
const healthData = {
  mood: 4,
  sleep_hours: 8,
  creative_hours: 3,
  meal_count: 3,
  exercise_minutes: 30,
  took_medicine: 1
};

saveHealthData(healthData).then(result => {
  console.log('保存完了:', result);
});
```

### Python での使用例

```python
import requests
import json

# ベースURL
BASE_URL = 'http://localhost:5001'

# データ取得
def get_health_data(days=14):
    response = requests.get(f'{BASE_URL}/api/entries?days={days}')
    return response.json()

# データ保存
def save_health_data(data):
    response = requests.post(
        f'{BASE_URL}/api/entries',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(data)
    )
    return response.json()

# 使用例
health_data = {
    'mood': 4,
    'sleep_hours': 8,
    'creative_hours': 3,
    'meal_count': 3,
    'exercise_minutes': 30,
    'took_medicine': 1
}

result = save_health_data(health_data)
print('保存結果:', result)
```

## バージョン情報

- **バージョン**: 1.0.0
- **最終更新**: 2025-01-13
- **作成者**: sourcekatsudon + Claude Code

## 将来の拡張予定

### v1.1.0 予定機能
- データエクスポート API (`GET /api/export`)
- 統計情報取得 API (`GET /api/stats`)
- データ削除 API (`DELETE /api/entries/{date}`)

### v1.2.0 予定機能
- ユーザー認証 API
- 複数ユーザー対応
- データバックアップ API

---

**注意**: この API は開発・個人使用を想定しており、本番環境で使用する場合は適切なセキュリティ対策を実装してください。