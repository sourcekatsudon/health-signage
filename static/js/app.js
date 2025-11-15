const STORAGE_KEY = 'moodSignageEntries';
const DEFAULT_ENTRY = {
    mood: 3,
    sleep_hours: 7,
    creative_hours: 0,
    meal_count: 0,
    exercise_minutes: 0,
    took_medicine: 0,
    took_sleep_medicine: 0
};

let currentData = { ...DEFAULT_ENTRY };
let entries = {};
let displayDays = 14;

let charts = {
    mood: null
};

document.addEventListener('DOMContentLoaded', () => {
    entries = loadStoredEntries();
    currentData = getEntryForToday();
    applyDataToInputs(currentData);
    initializeInputs();
    setupDaysSlider();
    setupSettingsPanel();
    loadCharts();
});

function initializeInputs() {
    document.querySelectorAll('.mood-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value, 10);
            currentData.mood = value;
            setActiveButtonGroup('.mood-button', value);
            saveData();
        });
    });

    const sleepSlider = document.getElementById('sleepSlider');
    const sleepValue = document.getElementById('sleepValue');
    sleepSlider.addEventListener('input', event => {
        const value = parseInt(event.target.value, 10);
        currentData.sleep_hours = value;
        sleepValue.textContent = value;
        saveData();
    });

    const creativeSlider = document.getElementById('creativeSlider');
    const creativeValue = document.getElementById('creativeValue');
    creativeSlider.addEventListener('input', event => {
        const value = parseInt(event.target.value, 10);
        currentData.creative_hours = value;
        creativeValue.textContent = value;
        saveData();
    });

    document.querySelectorAll('.meal-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value, 10);
            currentData.meal_count = value;
            document.getElementById('mealValue').textContent = value;
            setActiveButtonGroup('.meal-button', value);
            saveData();
        });
    });

    document.querySelectorAll('.exercise-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value, 10);
            currentData.exercise_minutes = value;
            document.getElementById('exerciseValue').textContent = value;
            setActiveButtonGroup('.exercise-button', value);
            saveData();
        });
    });

    document.querySelectorAll('.medicine-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value, 10);
            currentData.took_medicine = value;
            setActiveButtonGroup('.medicine-button', value);
            saveData();
        });
    });

    document.querySelectorAll('.mini-medicine-button').forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value, 10);
            currentData.took_sleep_medicine = value;
            setActiveButtonGroup('.mini-medicine-button', value);
            saveData();
        });
    });
}

function setupDaysSlider() {
    const daysSlider = document.getElementById('daysSlider');
    updateDaysLabel();
    daysSlider.addEventListener('input', event => {
        displayDays = parseInt(event.target.value, 10);
        updateDaysLabel();
        loadCharts();
    });
}

function setupSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    const toggle = document.getElementById('settingsToggle');
    const close = document.getElementById('settingsClose');
    const importButton = document.getElementById('importDataButton');
    const exportButton = document.getElementById('exportDataButton');
    const importInput = document.getElementById('importFileInput');

    toggle.addEventListener('click', event => {
        event.stopPropagation();
        panel.classList.toggle('visible');
    });

    close.addEventListener('click', () => panel.classList.remove('visible'));

    document.addEventListener('click', event => {
        if (!panel.contains(event.target) && event.target !== toggle) {
            panel.classList.remove('visible');
        }
    });

    exportButton.addEventListener('click', () => {
        const exportBlob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(exportBlob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = `mood-data-${getTodayKey().replace(/-/g, '')}.json`;
        anchor.click();
        URL.revokeObjectURL(downloadUrl);
    });

    importButton.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', event => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const importedEntries = sanitizeImportedEntries(parsed);
                entries = { ...entries, ...importedEntries };
                persistEntries(entries);
                currentData = getEntryForToday();
                applyDataToInputs(currentData);
                loadCharts();
                alert('データをインポートしました');
            } catch (error) {
                console.error('Import failed:', error);
                alert('インポートに失敗しました。ファイル形式を確認してください。');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    });
}

function saveData() {
    const todayKey = getTodayKey();
    const sanitizedEntry = normalizeEntry({ ...currentData, date: todayKey, updated_at: new Date().toISOString() });
    const updatedEntries = { ...entries, [todayKey]: sanitizedEntry };
    persistEntries(updatedEntries);
    loadCharts();
}

function loadCharts() {
    const dates = [];
    const today = new Date();
    for (let i = displayDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(formatDate(date));
    }

    const labels = dates.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    const moodData = dates.map(date => entries[date]?.mood ?? null);
    const sleepData = dates.map(date => entries[date]?.sleep_hours ?? null);
    const sleepMedicineData = dates.map(date => entries[date]?.took_sleep_medicine ?? null);
    const tookMedicineData = dates.map(date => entries[date]?.took_medicine ?? 0);
    const mealData = dates.map(date => entries[date]?.meal_count ?? null);
    const exerciseData = dates.map(date => entries[date]?.exercise_minutes ?? null);
    const creativeData = dates.map(date => entries[date]?.creative_hours ?? null);

    const mealScaledForChart = mealData.map(value => (value ?? null) === null ? null : value * (16 / 5));
    const exerciseScaledHours = exerciseData.map(value => {
        if (value === null) return null;
        return (value / 60) * 16; // 60分を16h換算
    });

    drawMoodChart(labels, moodData, sleepData, sleepMedicineData, mealData, mealScaledForChart, exerciseData, exerciseScaledHours, tookMedicineData, creativeData);
}

function updateDaysLabel() {
    const label = document.querySelector('.days-control label');
    const weeks = displayDays / 7;
    label.innerHTML = `表示期間: <span id="daysValue">${displayDays}</span>日 (${weeks}週間)`;
}

function applyDataToInputs(data) {
    const sanitized = normalizeEntry(data);
    setActiveButtonGroup('.mood-button', sanitized.mood);
    setActiveButtonGroup('.meal-button', sanitized.meal_count);
    setActiveButtonGroup('.exercise-button', sanitized.exercise_minutes);
    setActiveButtonGroup('.medicine-button', sanitized.took_medicine);
    setActiveButtonGroup('.mini-medicine-button', sanitized.took_sleep_medicine);

    const sleepSlider = document.getElementById('sleepSlider');
    const sleepValue = document.getElementById('sleepValue');
    sleepSlider.value = sanitized.sleep_hours;
    sleepValue.textContent = sanitized.sleep_hours;

    const creativeSlider = document.getElementById('creativeSlider');
    const creativeValue = document.getElementById('creativeValue');
    creativeSlider.value = sanitized.creative_hours;
    creativeValue.textContent = sanitized.creative_hours;

    document.getElementById('mealValue').textContent = sanitized.meal_count;
    document.getElementById('exerciseValue').textContent = sanitized.exercise_minutes;
    currentData = sanitized;
}

function setActiveButtonGroup(selector, value) {
    document.querySelectorAll(selector).forEach(button => {
        const buttonValue = parseInt(button.dataset.value, 10);
        const isActive = buttonValue === value;
        button.classList.toggle('active', isActive);
        if (isActive && button.dataset.color) {
            button.style.setProperty('--mood-color', button.dataset.color);
        }
    });
}

function loadStoredEntries() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        const sanitized = {};
        Object.entries(parsed).forEach(([dateKey, entry]) => {
            if (isValidDateKey(dateKey)) {
                sanitized[dateKey] = normalizeEntry(entry);
            }
        });
        return sanitized;
    } catch (error) {
        console.error('Failed to parse stored data:', error);
        return {};
    }
}

function persistEntries(updatedEntries) {
    entries = updatedEntries;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getEntryForToday() {
    const todayKey = getTodayKey();
    const todayEntry = entries[todayKey];
    return todayEntry ? normalizeEntry(todayEntry) : { ...DEFAULT_ENTRY };
}

function sanitizeImportedEntries(data) {
    if (typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid import format');
    }

    const sanitized = {};
    Object.entries(data).forEach(([dateKey, entry]) => {
        if (isValidDateKey(dateKey)) {
            sanitized[dateKey] = normalizeEntry(entry);
        }
    });
    return sanitized;
}

function normalizeEntry(entry = {}) {
    return {
        mood: clampNumber(entry.mood, 1, 5, DEFAULT_ENTRY.mood),
        sleep_hours: clampNumber(entry.sleep_hours, 2, 16, DEFAULT_ENTRY.sleep_hours),
        creative_hours: clampNumber(entry.creative_hours, 0, 10, DEFAULT_ENTRY.creative_hours),
        meal_count: clampNumber(entry.meal_count, 0, 5, DEFAULT_ENTRY.meal_count),
        exercise_minutes: clampNumber(entry.exercise_minutes, 0, 60, DEFAULT_ENTRY.exercise_minutes),
        took_medicine: toBinary(entry.took_medicine),
        took_sleep_medicine: toBinary(entry.took_sleep_medicine),
        date: entry.date || undefined,
        updated_at: entry.updated_at || undefined
    };
}

function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(num)));
}

function toBinary(value) {
    return value === 1 || value === '1' || value === true ? 1 : 0;
}

function isValidDateKey(dateKey) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

function getTodayKey() {
    return formatDate(new Date());
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function drawMoodChart(labels, moodData, sleepData, sleepMedicineData, mealOriginal, mealScaled, exerciseOriginal, exerciseScaled, tookMedicineData, creativeOriginal) {
    const ctx = document.getElementById('moodChart').getContext('2d');

    if (charts.mood) {
        charts.mood.destroy();
    }

    const barIconPlugin = {
        id: 'barIcons',
        afterDatasetsDraw(chart, _args, pluginOpts) {
            const { ctx, data } = chart;
            const icons = pluginOpts?.icons || {};
            const offset = pluginOpts?.offset ?? 18;
            const font = pluginOpts?.font || '16px sans-serif';
            ctx.save();
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            data.datasets.forEach((dataset, datasetIndex) => {
                const icon = icons[dataset.label];
                if (!icon) return;
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((element, index) => {
                    if (dataset.data[index] == null) return;
                    if (!element || typeof element.tooltipPosition !== 'function') return;
                    const pos = element.tooltipPosition();
                    ctx.fillText(icon, pos.x, pos.y - offset);
                });
            });

            ctx.restore();
        }
    };

    const medicineMarkerPlugin = {
        id: 'medicineMarkers',
        afterDatasetsDraw(chart, _args, pluginOpts) {
            const { ctx, scales, chartArea } = chart;
            const data = pluginOpts?.data || [];
            const icon = pluginOpts?.icon || '💊';
            const label = pluginOpts?.label || '薬OK';
            const color = pluginOpts?.color || '#ef4444';
            const font = pluginOpts?.font || '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
            const padding = pluginOpts?.padding ?? 4;
            const verticalOffset = pluginOpts?.verticalOffset ?? 24;

            ctx.save();
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            data.forEach((value, index) => {
                if (value !== 1) return;
                const xPos = scales.x.getPixelForValue(index);
                const iconY = chartArea.bottom + padding + verticalOffset;
                ctx.fillText(icon, xPos, iconY);
                ctx.fillText(label, xPos, iconY + 14);
            });

            ctx.restore();
        }
    };

    const moodFacePlugin = {
        id: 'moodFaces',
        afterDatasetsDraw(chart, _args, pluginOpts) {
            const { ctx, data } = chart;
            const faceMap = pluginOpts?.faces || [];
            const offset = pluginOpts?.offset ?? 18;
            const font = pluginOpts?.font || '18px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';

            ctx.save();
            ctx.font = font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            data.datasets.forEach((dataset, datasetIndex) => {
                if (dataset.label !== '🙂 気分') return;
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((element, index) => {
                    const value = dataset.data[index];
                    if (value == null) return;
                    const emoji = faceMap[value] || '';
                    if (!emoji) return;
                    const pos = element.tooltipPosition();
                    ctx.fillText(emoji, pos.x, pos.y - offset);
                });
            });

            ctx.restore();
        }
    };

    const sleepPointColors = sleepData.map((value, index) => {
        if (value === null) return 'rgba(156, 163, 175, 0.5)';
        return sleepMedicineData[index] === 1 ? '#ef4444' : '#3b82f6';
    });

    charts.mood = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: '🍱 食事回数 (棒)',
                    data: mealScaled,
                    backgroundColor: 'rgba(249, 115, 22, 0.35)',
                    borderColor: '#f97316',
                    borderWidth: 1,
                    yAxisID: 'sleep',
                    order: 1,
                    borderSkipped: false
                },
                {
                    type: 'bar',
                    label: '🎨 クリエイティブ時間',
                    data: creativeOriginal,
                    backgroundColor: 'rgba(139, 92, 246, 0.18)',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    yAxisID: 'sleep',
                    order: 1,
                    borderSkipped: false
                },
                {
                    type: 'bar',
                    label: '🏃 運動時間 (分→h換算)',
                    data: exerciseScaled,
                    backgroundColor: 'rgba(16, 185, 129, 0.35)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    yAxisID: 'sleep',
                    order: 1,
                    borderSkipped: false
                },
                {
                    label: '🙂 気分',
                    data: moodData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.14)',
                    tension: 0.35,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 4,
                    fill: true,
                    yAxisID: 'mood'
                },
                {
                    label: '🛏 睡眠時間',
                    data: sleepData,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.14)',
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: sleepPointColors,
                    pointBorderColor: sleepPointColors,
                    borderWidth: 3,
                    fill: true,
                    yAxisID: 'sleep',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    bottom: 60
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { size: 10 }, usePointStyle: true, pointStyle: 'rectRounded' }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: context => {
                            switch (context.dataset.label) {
                                case '🙂 気分': {
                                    const moodLabels = ['', 'とても悪い', 'あまり', 'ふつう', 'よい', 'とても良い'];
                                    return moodLabels[context.parsed.y] || '';
                                }
                                case '🛏 睡眠時間': {
                                    const took = sleepMedicineData[context.dataIndex];
                                    return took === 1 ? '睡眠薬: 使用' : '睡眠薬: なし';
                                }
                                case '🍱 食事回数 (棒)': {
                                    const original = mealOriginal[context.dataIndex];
                                    return original == null ? '' : `${original}回`;
                                }
                                case '🎨 クリエイティブ時間': {
                                    const original = creativeOriginal[context.dataIndex];
                                    return original == null ? '' : `${original}h`;
                                }
                                case '🏃 運動時間 (分→h換算)': {
                                    const original = exerciseOriginal[context.dataIndex];
                                    if (original == null) return '';
                                    const hours = context.parsed.y?.toFixed(1) ?? '';
                                    return `${original}分 (${hours}h換算)`;
                                }
                                default:
                                    return '';
                            }
                        }
                    }
                },
                barIcons: {
                    icons: {
                        '🍱 食事回数 (棒)': '🍱',
                        '🏃 運動時間 (分→h換算)': '🏃'
                    },
                    offset: 18,
                    font: '16px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
                },
                moodFaces: {
                    faces: ['', '😣', '🙁', '😐', '🙂', '😀'],
                    offset: 20,
                    font: '18px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
                },
                medicineMarkers: {
                    data: tookMedicineData,
                    icon: '💊',
                    label: '薬OK',
                    color: '#ef4444',
                    font: '12px "Segoe UI Emoji", "Apple Color Emoji", sans-serif',
                    padding: 6,
                    verticalOffset: 24
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
                        callback: value => {
                            const moodLabels = ['', 'とても悪い', 'あまり', 'ふつう', 'よい', 'とても良い'];
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
                    grid: { drawOnChartArea: false },
                    ticks: {
                        font: { size: 10 },
                        callback: value => `${value}h`
                    }
                }
            }
        },
        plugins: [barIconPlugin, moodFacePlugin, medicineMarkerPlugin]
    });
}
