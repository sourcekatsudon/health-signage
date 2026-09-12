# Development

1. `./setup.sh` で依存関係とフロントを準備。
2. `npm run dev`、Chromeで`http://192.168.0.64:5000`。
3. フロント変更後は`npm run build`、常駐サーバーの変更後は`npm run service:restart`。
4. `npm test`。テストDBは一時ディレクトリで、本番のhealth.dbやNotionは変更しない。

機能変更時はUI (`src/app.ts`)、モデル (`src/model.ts`)、サーバー検証 (`app.py`) を対応させる。判定閾値は`src/config.ts`、候補は`src/suggestions.ts`、Notion列名は`notion_config.py`だけで変更する。

実画面のチェック：1920×720のChrome viewportでスクロールなし、全ボタン48px以上、7入力、14日グラフ、過去日と今日への切替、前日コピー。低エネルギー・低気分・低現実対処力で通常サジェスト、死にたい気持ち2で危険候補除外、3で通常候補停止。Notionの実DB設定後は未記録日のCREATEと同日UPDATE（行数・page IDが同一）、ネットワーク停止中の保存と復旧後の同期を確認する。

2026-09-06：型検査と17自動テスト成功。実NotionのCREATE・同日UPDATE・更新値読み戻しを確認済み。一時テストレコードはゴミ箱へ移動。本番ローカルDBは未変更。Chrome実画面は操作接続待ち。詳細はREADME。

常駐環境は `~/Applications/health-signage`。元のDesktopパスはシンボリックリンク。登録・停止・解除はREADMEの常駐手順を参照。ログイン時の起動と異常終了後の復旧はLaunchAgentが管理します。

2026-09-13：型検査と18自動テスト成功。1920×720・1366×768で表示と操作を確認。LaunchAgentの起動、プロセス終了後の自動復旧、LAN API、Notion設定の読み込みを確認。
