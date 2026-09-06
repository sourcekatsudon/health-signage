"""Local signage server. SQLite is authoritative; Notion is a retryable backup."""
from pathlib import Path
from contextlib import contextmanager
from datetime import datetime, date
from zoneinfo import ZoneInfo
import json
import math
import os
import sqlite3
import threading
from urllib.parse import urlsplit
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from notion_sync import NotionClient, NotionError

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env.local')
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024
DB = os.getenv('HEALTH_DB_PATH', str(ROOT / 'health.db'))
notion = NotionClient()
sync_lock = threading.Lock()
LIMITS = {'energy': (1, 5, 1), 'mood': (1, 5, 1), 'suicidalThought': (0, 4, 1),
          'moyamoya': (0, 4, 1), 'realityHandling': (1, 5, 1), 'workHours': (0, 16, .5),
          'hobbyHours': (0, 16, .5), 'sleepHours': (0, 24, .01), 'steps': (0, 200000, 1)}

@contextmanager
def connect():
    conn = sqlite3.connect(DB, timeout=20)
    conn.row_factory = sqlite3.Row
    try:
        with conn:
            yield conn
    finally:
        conn.close()

def init_db():
    with connect() as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS health_logs (date TEXT PRIMARY KEY, payload TEXT NOT NULL, pending INTEGER NOT NULL DEFAULT 1)')

init_db()

def validate(data):
    if not isinstance(data, dict) or set(data) - (set(LIMITS) | {'date', 'updatedAt'}):
        raise ValueError('Invalid fields')
    day = date.fromisoformat(data['date'])
    if day.isoformat() != data['date'] or day > datetime.now(ZoneInfo('Asia/Tokyo')).date():
        raise ValueError('Invalid date')
    timestamp = datetime.fromisoformat(data['updatedAt'].replace('Z', '+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Timezone required')
    for key, (low, high, step) in LIMITS.items():
        value = data.get(key)
        if value is not None and (type(value) not in (int, float) or not math.isfinite(value) or not low <= value <= high or abs(value / step - round(value / step)) > 1e-6):
            raise ValueError('Invalid ' + key)
    return {k: data[k] for k in ('date', 'updatedAt', *LIMITS) if k in data}

@app.before_request
def local_only():
    if request.host.split(':')[0] not in ('127.0.0.1', 'localhost', '[::1]'):
        return jsonify(error='Local access only'), 403
    if request.method == 'POST':
        origin = request.headers.get('Origin')
        if origin and urlsplit(origin).netloc != request.host:
            return jsonify(error='Invalid origin'), 403
        if not request.is_json:
            return jsonify(error='JSON required'), 415

@app.after_request
def headers(response):
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
    return response

@app.get('/')
def index():
    return send_file(ROOT / 'index.html')

@app.get('/api/health-log')
def logs():
    with connect() as conn:
        rows = conn.execute('SELECT payload,pending FROM health_logs ORDER BY date').fetchall()
    return jsonify(entries=[json.loads(r['payload']) for r in rows], pending=[json.loads(r['payload'])['date'] for r in rows if r['pending']], notionConfigured=notion.configured)

def sync_date(day):
    # Serialize query+create across request threads and the background retry loop.
    # Run one local server process, as documented.
    with sync_lock:
        with connect() as conn:
            row = conn.execute('SELECT payload,pending FROM health_logs WHERE date=?', (day,)).fetchone()
        if not row or not row['pending']:
            return {'synced': True}
        try:
            result = notion.upsert(json.loads(row['payload']))
        except NotionError:
            return {'synced': False}
        with connect() as conn:
            conn.execute('UPDATE health_logs SET pending=0 WHERE date=? AND payload=?', (day, row['payload']))
        return {'synced': True, **result}

@app.post('/api/health-log')
def save():
    try:
        entry = validate(request.get_json())
    except (ValueError, KeyError, TypeError):
        return jsonify(error='Invalid health log'), 400
    payload = json.dumps(entry, ensure_ascii=False, sort_keys=True)
    with connect() as conn:
        conn.execute('BEGIN IMMEDIATE')
        previous = conn.execute('SELECT payload FROM health_logs WHERE date=?', (entry['date'],)).fetchone()
        if previous:
            old = json.loads(previous['payload'])
            if datetime.fromisoformat(old['updatedAt'].replace('Z', '+00:00')) > datetime.fromisoformat(entry['updatedAt'].replace('Z', '+00:00')):
                return jsonify(error='Newer local record exists'), 409
        conn.execute('INSERT INTO health_logs (date,payload,pending) VALUES (?,?,1) ON CONFLICT(date) DO UPDATE SET payload=excluded.payload,pending=CASE WHEN health_logs.payload=excluded.payload THEN health_logs.pending ELSE 1 END', (entry['date'], payload))
    return jsonify(localSaved=True, **sync_date(entry['date']))

def retry_loop():
    while True:
        threading.Event().wait(30)
        if not notion.configured:
            continue
        try:
            with connect() as conn:
                days = [r['date'] for r in conn.execute('SELECT date FROM health_logs WHERE pending=1')]
            for day in days:
                if not sync_date(day)['synced']:
                    break
        except Exception:
            app.logger.warning('Background sync unavailable; local outbox retained')

if os.getenv('HEALTH_DISABLE_WORKER') != '1':
    threading.Thread(target=retry_loop, daemon=True, name='notion-outbox').start()

if __name__ == '__main__':
    app.run(debug=False, host='127.0.0.1', port=5001)
