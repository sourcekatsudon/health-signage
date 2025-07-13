let currentData = {
    mood: 3,
    sleep_hours: 7,
    creative_hours: 0,
    meal_count: 0,
    exercise_minutes: 0,
    took_medicine: 0
};

let charts = {
    mood: null,
    sleep: null,
    creative: null,
    meal: null,
    exercise: null
};

let displayDays = 14;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeInputs();
    loadCharts();
    
    
    // 表示日数スライダー
    const daysSlider = document.getElementById('daysSlider');
    daysSlider.addEventListener('input', function() {
        displayDays = parseInt(this.value);
        const weeks = displayDays / 7;
        const daysValue = document.getElementById('daysValue');
        daysValue.textContent = displayDays;
        daysValue.parentNode.innerHTML = `表示期間: <span id="daysValue">${displayDays}</span>日 (${weeks}週間)`;
        loadCharts();
    });
});

// 入力要素の初期化
function initializeInputs() {
    // 気分ボタン
    document.querySelectorAll('.mood-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.mood-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            this.style.setProperty('--mood-color', this.dataset.color);
            currentData.mood = parseInt(this.dataset.value);
            saveData();
        });
    });

    // 睡眠時間スライダー
    const sleepSlider = document.getElementById('sleepSlider');
    const sleepValue = document.getElementById('sleepValue');
    sleepSlider.addEventListener('input', function() {
        sleepValue.textContent = this.value;
        currentData.sleep_hours = parseInt(this.value);
        saveData();
    });

    // クリエイティブ時間スライダー
    const creativeSlider = document.getElementById('creativeSlider');
    const creativeValue = document.getElementById('creativeValue');
    creativeSlider.addEventListener('input', function() {
        creativeValue.textContent = this.value;
        currentData.creative_hours = parseInt(this.value);
        saveData();
    });

    // 食事回数ボタン
    document.querySelectorAll('.meal-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.meal-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const value = parseInt(this.dataset.value);
            document.getElementById('mealValue').textContent = value;
            currentData.meal_count = value;
            saveData();
        });
    });

    // 運動時間ボタン
    document.querySelectorAll('.exercise-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.exercise-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const value = parseInt(this.dataset.value);
            document.getElementById('exerciseValue').textContent = value;
            currentData.exercise_minutes = value;
            saveData();
        });
    });

    // 薬ボタン
    document.querySelectorAll('.medicine-button').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.medicine-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentData.took_medicine = parseInt(this.dataset.value);
            saveData();
        });
    });
}

// データ保存
async function saveData() {
    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentData)
        });
        
        if (response.ok) {
            loadCharts(); // チャートを更新
        }
    } catch (error) {
        console.error('データ保存エラー:', error);
    }
}

// チャート読み込み
async function loadCharts() {
    try {
        const response = await fetch(`/api/entries?days=${displayDays}`);
        const entries = await response.json();
        
        // 日付範囲を生成
        const dates = [];
        const today = new Date();
        for (let i = displayDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        // データマップを作成
        const entryMap = {};
        entries.forEach(entry => {
            entryMap[entry.date] = entry;
        });
        
        // グラフデータを準備
        const labels = dates.map(date => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        
        const moodData = dates.map(date => {
            const entry = entryMap[date];
            return entry ? entry.mood : null;
        });
        
        const sleepData = dates.map(date => {
            const entry = entryMap[date];
            return entry ? entry.sleep_hours : null;
        });
        
        const creativeData = dates.map(date => {
            const entry = entryMap[date];
            return entry ? entry.creative_hours : null;
        });
        
        const mealData = dates.map(date => {
            const entry = entryMap[date];
            return entry ? entry.meal_count : null;
        });
        
        const exerciseData = dates.map(date => {
            const entry = entryMap[date];
            return entry ? entry.exercise_minutes : null;
        });
        
        drawMoodChart(labels, moodData, sleepData);
        drawCreativeChart(labels, creativeData);
        drawMealChart(labels, mealData);
        drawExerciseChart(labels, exerciseData);
        
    } catch (error) {
        console.error('チャート読み込みエラー:', error);
    }
}

// 気分＋睡眠時間チャート
function drawMoodChart(labels, moodData, sleepData) {
    const ctx = document.getElementById('moodChart').getContext('2d');
    
    if (charts.mood) {
        charts.mood.destroy();
    }
    
    charts.mood = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '気分',
                    data: moodData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 3,
                    fill: true,
                    yAxisID: 'mood'
                },
                {
                    label: '睡眠時間',
                    data: sleepData,
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    tension: 0.3,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    borderWidth: 1,
                    fill: false,
                    yAxisID: 'sleep'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.dataset.label === '気分') {
                                const moodLabels = ['', '死にたい', '悪い', '普通', 'まぁよい', '良い'];
                                return moodLabels[context.parsed.y] || '';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                },
                mood: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        font: { size: 10 },
                        callback: function(value) {
                            const moodLabels = ['', '死にたい', '悪い', '普通', 'まぁよい', '良い'];
                            return moodLabels[value] || '';
                        }
                    }
                },
                sleep: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 16,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                            return value + 'h';
                        }
                    }
                }
            }
        }
    });
}


// クリエイティブ時間チャート
function drawCreativeChart(labels, data) {
    const ctx = document.getElementById('creativeChart').getContext('2d');
    
    if (charts.creative) {
        charts.creative.destroy();
    }
    
    charts.creative = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'クリエイティブ時間',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.3,
                pointRadius: 3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 10 } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                y: { min: 0, max: 10, ticks: { font: { size: 8 } } }
            }
        }
    });
}

// 食事回数チャート
function drawMealChart(labels, data) {
    const ctx = document.getElementById('mealChart').getContext('2d');
    
    if (charts.meal) {
        charts.meal.destroy();
    }
    
    charts.meal = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '食事回数',
                data: data,
                backgroundColor: 'rgba(245, 158, 11, 0.6)',
                borderColor: '#f59e0b',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 10 } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                y: { min: 0, max: 5, ticks: { font: { size: 8 } } }
            }
        }
    });
}

// 運動時間チャート
function drawExerciseChart(labels, data) {
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    
    if (charts.exercise) {
        charts.exercise.destroy();
    }
    
    charts.exercise = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '運動時間(分)',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 10 } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                y: { min: 0, max: 60, ticks: { font: { size: 8 } } }
            }
        }
    });
}

// ダミーデータ生成
async function generateDummyData() {
    try {
        const response = await fetch('/api/generate-dummy', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            loadCharts();
        }
    } catch (error) {
        console.error('ダミーデータ生成エラー:', error);
    }
}