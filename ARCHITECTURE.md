# Architecture

FlaskとChart.jsを継続使用。フロントはフレームワークを追加せずTypeScriptへ分割し、esbuildでローカル配信する。CDN依存なし。

```text
1920×720 Chrome
  ├─ src/app.ts → charts.ts / state.ts / suggestions.ts
  ├─ provider.ts (sleep/steps)
  └─ storage.ts → localStorage + persistent pending revisions
                       ↓ sync.ts (750ms debounce / retry)
               Flask /api/health-log
                       ↓
             SQLite health.db (date PRIMARY KEY, pending outbox)
                       ↓ serialized query + CREATE/UPDATE
                  Notion data source
```

`health.db`に新テーブルを作り、旧`mood.db`を保持。新しい未観測値はnull/undefined。旧気分尺度は移行しない。表示期間は選択日を末日とする14日で欠測を接続しない。安全カードは常に今日の状態を参照。

NotionプロパティとAPIバージョンは`notion_config.py`に集約。Secretは`.env.local`からPythonのみがロード。Notionエラーレスポンス／Tokenをブラウザへ返さない。同日の並列同期はロックで直列化。再送前に日付で検索し、CREATEの応答消失後も再検索。複数行が既存なら勝手に選ばず同期を停止。

SQLiteはネットワークアクセス前にcommit。Notionへの書き込み中に新しい入力が来ても、送信したpayloadと一致する場合だけ同期済みに変更。ブラウザも送信時revisionが一致する場合のみ未同期キューから除去。30秒間隔で永続outboxを再送する。

単一プロセス・単一利用者の常時表示用途。NotionにはDateの一意制約がないため外部の別ライターは非対応。Notion上での編集の取り込みは実装せず、ローカルを正としたバックアップとして扱う。

起動・設定・制約・検証状況は[README](README.md)を参照。
