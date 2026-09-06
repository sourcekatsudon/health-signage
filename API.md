# Local API

Base: `http://localhost:5001`。JSONのみ。localhostにバインドし、Host/Originを検証。CORSを公開しない。

## GET /api/health-log

全ローカル履歴（`entries`）、Notion未同期の日付（`pending`）、設定有無のみの`notionConfigured`を返す。SecretやNotionレスポンス本文は返さない。

## POST /api/health-log

日付別スナップショット。必須は`date`（YYYY-MM-DD、未来日不可）とタイムゾーン付き`updatedAt`。任意の数値：`energy`/`mood`/`realityHandling`=1〜5、`suicidalThought`/`moyamoya`=0〜4、`workHours`/`hobbyHours`=0〜16（0.5刻み）、`sleepHours`=0〜24、`steps`=0〜200000（整数）。nullは欠測。省略項目はNotionではnull。

先にSQLiteへ保存、次にNotionへ日付upsert。成功時200で`localSaved:true,synced:true`。Notion障害／未設定時も200で`localSaved:true,synced:false`（SQLiteとoutbox保存済み）。400は入力不正、409はより新しいローカル記録との競合、403はHost/Origin不正、415はJSON以外、413は64KB超過。

旧`/api/entries`とダミーデータ生成APIは廃止。本人の実測にダミー値を混ぜない。
