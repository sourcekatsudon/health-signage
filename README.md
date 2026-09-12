# 自宅健康管理サイネージ

本人固有の悪化の兆候を継続して観測する、ローカルMac用の計器盤。1920×720、Chrome、タッチ操作、Asia/Tokyo基準。左70%が14日グラフ、右30%が7項目の入力です。

## 起動

必要環境：Node.js 22以上、Python 3.10以上、Google Chrome。

```bash
npm install
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env.local  # 初回のみ。設定済みのファイルを上書きしない
chmod 600 .env.local
npm run dev
```

開発起動は `npm run dev`。TypeScriptを編集したら `npm run build` 後にブラウザを再読み込みします。Python編集後は再起動してください。

本番相当のローカル常時起動：

```bash
npm start
```

`npm start` はビルド後にWaitressを起動します。待ち受けは `.env.local` の `HEALTH_HOST` / `HEALTH_PORT`（既定値：127.0.0.1 / 5000）で指定します。Chromeで設定したアドレスを開き、表示領域1920×720・ズーム100%・全画面表示を使用してください。画面外寸にはChromeのタブやツールバーを含めないでください。`localhost` と `127.0.0.1` はlocalStorageが別なので、普段使うURLを固定します。

代わりに `./setup.sh`、`./start.sh` でも起動できます。常時起動時はMacの自動スリープを無効化してください。単一ローカルサーバープロセスで運用します（NotionのCREATE競合を防ぐため、複数ワーカー／複数Macからの同時書き込みは非対応）。

## LAN内の別PCから利用する

このMacでは `.env.local` に `HEALTH_HOST=192.168.0.64`、`HEALTH_PORT=5000` を設定しています。同じLANのPCから **http://192.168.0.64:5000** を開いてください。`localhost` は閲覧しているPC自身を指すため、別PCでは使いません。

`HEALTH_HOST` に指定したアドレスはHost検証でも許可されます。追加のホスト名は `HEALTH_ALLOWED_HOSTS` にカンマ区切りで指定できます。異なるOriginからの書き込みは拒否します。AirPlayの5000番と共存するため、LANのIPアドレスに限定して待ち受けます。

MacのLANアドレスが変わった場合は `HEALTH_HOST` を更新してサーバーを再起動してください。手動起動は `npm start`、終了はControl+Cです。常駐運用中の再起動は `npm run service:restart` です。入力済みのSQLiteデータとNotion設定は引き継ぎます。複数PC・複数タブでの同時編集は避けてください。

## macOSで常駐させる

本体は `~/Applications/health-signage` に置きます。Desktop配下はmacOSのバックグラウンドアクセス制限を受けるため、LaunchAgentから直接実行しません。このMacでは元の `~/Desktop/work/health-signage` から本体へのシンボリックリンクを作成しています。

手動起動中のサーバーを終了してから、次を実行します。

```bash
npm run service:install
```

ログイン時に自動起動し、プロセス終了時はlaunchdが再起動します。管理者権限は不要です。ログアウト中・Macのスリープ中は利用できません。常駐中は、同じポートで `npm start` や `npm run dev` を重ねて実行しないでください。

```bash
npm run service:status     # 稼働状況
npm run service:restart    # Notion設定やPythonの変更を反映
npm run service:stop       # 一時停止（次回ログイン時は自動起動）
npm run service:start      # 一時停止から再開
npm run service:uninstall  # 自動起動を解除（記録・設定は保持）
```

フロント変更は `npm run build` 後にブラウザを再読み込みします。配置先を変更した場合は `npm run service:install` を再実行してください。設定ファイルは `~/Library/LaunchAgents/local.health-signage.plist`、ログは `~/Library/Logs/health-signage/server.log` にあります。Notion Secretや健康記録はGitへ追加しません。

## Notionの手動設定

API Secretを会話へ貼る必要はありません。以下は自分のMac上で行います。

1. [NotionのIntegration管理](https://www.notion.so/my-integrations)を開きます。Developer portalの **Build → Internal connections → Create a new connection** から対象ワークスペース用の接続を作成します。Configurationで **Read content / Update content / Insert content** を有効にし、Installation access token（旧表示名：Internal Integration Secret）を取得します。
2. 対象のNotionデータベース本体を開き、右上 **… → Connections（コネクト）→ Add connection** から作成した接続を追加します。またはDeveloper portalの **Content access → Edit access** で対象DBを選択します。リンクドビューの場合は元DBへ接続してください。
3. DBをフルページで開いてリンクをコピーします。`https://www.notion.so/.../xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...` の **末尾の32桁（?より前）** がDatabase IDです。`v=`以降のView IDではありません。ハイフン付きUUIDも利用できます。
4. このリポジトリ直下の `.env.local` をエディタで開き、**1行目の `NOTION_TOKEN=` の右側**にSecret、**2行目の `NOTION_DATABASE_ID=` の右側**にDatabase IDを自分で貼ります。
5. DBに下記プロパティを用意します。タイトル列は任意の名前で1つ残してください（自動検出）。設定後はサーバーを再起動します。

| Notion列名 | 種類 |
| --- | --- |
| Date | 日付 |
| Energy | 数値 |
| Mood | 数値 |
| SuicidalThought | 数値 |
| Moyamoya | 数値 |
| RealityHandling | 数値 |
| WorkHours | 数値 |
| HobbyHours | 数値 |
| SleepHours | 数値 |
| Steps | 数値 |
| UpdatedAt | 日付 |

列名は `notion_config.py` に集約。Notion API `2026-03-11` を使用し、DatabaseからData sourceを解決して日付でupsertします。Data sourceが複数あるDBでは `.env.local` の `NOTION_DATA_SOURCE_ID=` も設定してください（NotionのManage data sourcesメニューでIDをコピー）。

この環境では指定ページ内の「健康手動入力」DBへ必要な11列を追加し、DB ID・Data source IDを設定済みです。

`.env.local` は作成済み・Git除外済みです。未設定のままでも入力可能で、「ローカル保存済 / Notion未同期」と表示します。TokenはPythonサーバーだけが読み込みます。フロントやビルドに環境変数を埋め込みません。

設定手順の公式資料：[Internal connections](https://developers.notion.com/guides/get-started/internal-connections)、[Working with databases](https://developers.notion.com/guides/data-apis/working-with-databases)。

### 実接続の確認

設定後に `npm start` を再起動し、未記録日の入力を変更します。NotionのDate列を確認してCREATEされたこと、同日の別項目を変更しても行数が増えずUPDATEされることを確認してください。テストによる仮の健康値を実際の観測記録に混ぜないでください。

`npm test` のNotionテストは通信を模擬するものです。**実際のDBへのCREATE/UPDATE成功を意味しません。** 実接続テストも実施済みです。ローカルAPI → SQLite → 実NotionのCREATE・同日UPDATE、同一page ID・行数1件・更新値の読み戻し・未同期キュー消去を確認しました。テスト日2000-01-01の一時レコードは確認後にゴミ箱へ移動し、本番ローカルDBには保存していません。

## 入力・表示

手入力はエネルギー／回復感、気分／興味、死にたい気持ち、モヤモヤ度、現実対処力、仕事時間、趣味・副業・創作時間の7項目のみ。評価はタップ、時間は0〜16時間・0.5時間刻みのスライダーと±ボタンです。0時間は「−」ボタンでも確定できます。選択値の説明は各行右端へ表示します。

保存ボタン不要。未選択を正常値で補完せず、グラフも欠測のまま表示します。日付の左右ボタン・日付選択で過去日を編集可能。「前日コピー」は7項目をコピーし、睡眠と歩数はコピーしません。今日の危険状態のカードは、過去日編集中も今日の状態を表示します。

睡眠と歩数は `HealthMetricsProvider` の `getSleepDuration(date)` / `getSteps(date)` に分離。現在はlocal dataを読み、測定がなければ未接続表示。Watch連携やApple Health権限取得は未実装です。履歴を含む実測値はv2 JSONの `sleepHours` / `steps` として読み込み可能です。

## 保存・復旧

- 入力を即時反映し、localStorageの `healthSignage.v2` にデータと未同期キューを一緒に保存。
- 750ms debounce後に `POST /api/health-log`。サーバーは先に `health.db` の日付主キーへ保存し、その後NotionへCREATE/UPDATE。
- Notion失敗時もローカル記録は残り、ブラウザおよびサーバーが30秒ごとに再送。ブラウザを閉じてもSQLiteまで届いた記録はサーバーが再送します。
- サーバー自体が停止している間も、読み込み済み画面はlocalStorageへ保存可能。サーバー停止中のページ再読み込みはできません。SQLiteへの転送はサーバー復旧後です。
- 初期表示はlocalStorageを使い、その後SQLiteと更新日時で統合。古いリクエストは409で拒否します。複数タブを同時編集する用途は想定していません。409が続く場合はページを再読み込みすると新しい記録を取得できます。
- localStorageの読み込み／書き込みエラーは保存成功と表示せず、上書きを停止。画面を閉じず書き出しで保全してください。
- 「書き出し」「読み込み」はv2 JSONのバックアップ・復元。読み込みは新しい更新日時を優先します。健康データを含むため保管場所を選んでください。

### 旧版からの移行

調査時、旧フロントは実際にはlocalStorageへ保存し、FlaskのSQLite APIを呼んでいませんでした。HTMLはルートに存在し、Flaskが存在しないtemplates/index.htmlを参照していた点も修正しました。

同一ブラウザ・同一originの `moodSignageEntries` があれば睡眠時間／創作時間を移行します。旧「気分」は自殺念慮を含んだ尺度なので、新しい気分・死にたい気持ちへ自動変換しません。旧データ全体は元キーに保持し、書き出しJSONの `legacy` にも含めます。

元の `mood.db` は変更・削除せず保持しています。リポジトリ同梱のDBを本人の実測と見なして取り込むことはしません。新しいローカルDBはGit除外の `health.db` です。以前別originで使っていたlocalStorageは自動アクセスできません。

## 判定・カスタマイズ

- `src/config.ts`：閾値と同期間隔。
- `src/state.ts`：複数信号の加点判定。3点以上で「調子が崩れてきている」。欠測は加点しません。
- `src/suggestions.ts`：候補文言・タグ・日付と状態からの安定した選択。通常は0件、不調時1〜2件。
- 死にたい気持ち1以上は独立した警戒表示、2以上は危険候補を除外、3以上は通常候補を停止して人につながるカードのみ表示。
- 判定はユーザー指定ルールによる観測補助です。診断や将来予測モデルではありません。

## 検証

```bash
npm run build
npm test
```

TypeScript型検査、フロント10テスト、Python8テストが成功。判定の境界、全3,125通りの評価組合せに対する候補の決定性と安全性、14日の日付境界、旧データ保持、通信中の追加入力、同日upsert、オフライン再送、入力検証、Secretファイル非公開を確認しています。

1920×720と1366×768のChrome実画面で、表示のはみ出し、選択状態、過去日切替、キーボード操作、注意表示を確認済みです。動きを減らす設定とボタンの文字コントラストも確認しています。実機のタッチパネル操作は未検証です。Notionの接続とスキーマは確認済みです。

## 変更ファイル

- UI：`index.html`、`static/css/style.css`、`static/js/app.js`（生成物）
- フロント：`src/app.ts`、`src/model.ts`、`src/charts.ts`、`src/config.ts`、`src/state.ts`、`src/suggestions.ts`、`src/provider.ts`、`src/storage.ts`、`src/sync.ts`
- サーバー：`app.py`、`notion_config.py`、`notion_sync.py`
- 環境：`package.json`、`package-lock.json`、`tsconfig.json`、`requirements.txt`、`.gitignore`、`.env.example`、`.env.local`（Git除外）
- 起動：`setup.sh`、`start.sh`、`setup.bat`、`start.bat`
- テスト：`tests/state.test.ts`、`tests/sync.test.ts`、`tests/test_api.py`
- 文書：`README.md`、`ARCHITECTURE.md`、`API.md`、`DEVELOPMENT.md`
