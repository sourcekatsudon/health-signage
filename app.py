from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime, timedelta
import random

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('mood.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mood_entries (
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
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/entries')
def get_entries():
    days = request.args.get('days', 14, type=int)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    conn = sqlite3.connect('mood.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM mood_entries 
        WHERE date >= ? AND date <= ? 
        ORDER BY date ASC
    ''', (start_date, end_date))
    
    entries = []
    for row in cursor.fetchall():
        entries.append({
            'id': row[0],
            'date': row[1],
            'mood': row[2],
            'sleep_hours': row[3],
            'creative_hours': row[4],
            'meal_count': row[5],
            'exercise_minutes': row[6],
            'took_medicine': row[7]
        })
    
    conn.close()
    return jsonify(entries)

@app.route('/api/entries', methods=['POST'])
def save_entry():
    data = request.get_json()
    today = datetime.now().date()
    
    conn = sqlite3.connect('mood.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO mood_entries 
        (date, mood, sleep_hours, creative_hours, meal_count, exercise_minutes, took_medicine, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (
        today,
        data.get('mood', 3),
        data.get('sleep_hours', 7),
        data.get('creative_hours', 0),
        data.get('meal_count', 0),
        data.get('exercise_minutes', 0),
        data.get('took_medicine', 0)
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'date': str(today)})

@app.route('/api/generate-dummy', methods=['POST'])
def generate_dummy_data():
    conn = sqlite3.connect('mood.db')
    cursor = conn.cursor()
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=90)
    
    current_date = start_date
    while current_date <= end_date:
        if random.random() > 0.2:  # 80%の確率でデータを生成
            cursor.execute('''
                INSERT OR REPLACE INTO mood_entries 
                (date, mood, sleep_hours, creative_hours, meal_count, exercise_minutes, took_medicine)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                current_date,
                random.randint(1, 5),
                random.randint(4, 10),
                random.randint(0, 8),
                random.randint(1, 5),
                random.choice([0, 15, 30, 45, 60]),
                random.randint(0, 1)
            ))
        current_date += timedelta(days=1)
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'ダミーデータを生成しました'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)