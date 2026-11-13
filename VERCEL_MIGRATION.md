# Vercel private migration

## Security
- Enable **Vercel Authentication** for **all deployments** before publishing.
- Only the owner's Vercel team account should have access. Audit team membership.
- This repository is currently public: change it to private, and inspect historical tracked `mood.db` for personal data. Making the repository private does **not** erase already-cloned copies or history.
- No Notion secrets in GitHub, client-side code, browser localStorage or screenshots.
- Store `NOTION_TOKEN`, `NOTION_DATABASE_ID` and optional `NOTION_DATA_SOURCE_ID` as Vercel **server-side** environment variables for Production and Preview.
- Configure the Notion integration with access **only** to the health-log database.
- Do not deploy publicly while credentials are missing; authentication must be verified on both `/` and `/api/health-log`.

## Architecture
- Static TypeScript/esbuild UI and serverless `api/health-log.js`.
- Notion is the authoritative durable data store. No SQLite, local filesystem writes, or background worker in production.
- LocalStorage remains a device-specific offline queue and JSON export/import remains available.
- Notion outage: writes fail without falsely reporting success; pending browser entries retry after reconnect.
- Simultaneous creation of the same date from two devices is not transaction-safe because Notion has no unique constraints. Avoid concurrent edits on separate devices.
- API reads all existing Notion records (paginated), rejects duplicates during upsert, and compares `UpdatedAt` to avoid overwriting newer revisions.
- Original local `health.db` and browser localStorage records **do not migrate automatically**. Export a v2 JSON backup from the old UI, then import on the authenticated Vercel UI. Review results before stopping the Mac service.
- If historical records already exist in Notion, GET loads them directly.

## Deploy checklist
1. Restrict GitHub repository visibility and review committed legacy database.
2. Protect all Vercel deployment targets with Vercel Authentication, including the production alias.
3. Set Notion environment variables in Vercel; verify database and data source permissions.
4. Run `npm ci && npm run build` and `npm test` with Python dependencies installed.
5. Merge migration PR to main; wait for Vercel build and verify protected access.
6. On iPad Pro 12.9, test 1366x1024 landscape and 1024x1366 portrait: buttons, chart, date navigation, safe areas, scrolling and touch.
7. Verify Notion create/update and read-back using a real entry or a clearly isolated temporary test date; never fabricate a health measurement in real records.
8. Export old local data, import and reconcile Notion history; keep backups until validated.
9. Disable the old Mac service only after successful cloud verification.

## Known constraints
- Vercel deployment protection may depend on the Vercel plan.
- The old Android 7.1 WebView continues using its legacy layout path; the iPad uses modern responsive CSS.
- Existing tests for the local Flask/SQLite server remain for the legacy server; add dedicated cloud API tests before full cutover.
