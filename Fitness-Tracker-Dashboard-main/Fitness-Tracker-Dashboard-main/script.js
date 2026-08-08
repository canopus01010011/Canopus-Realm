const DEFAULT_GOALS = { steps: 10000, calories: 500, water: 2.5, sleep: 8 };
const METRIC_COLORS = {
    steps: '#2fd8f5',
    calories: '#ff6fae',
    water: '#a78bfa',
    sleep: '#16ffb0',
    weight: '#ffb84d'
};
const METRIC_UNITS = { steps: '', calories: ' kcal', water: ' L', sleep: ' h', weight: ' kg' };

let user = null;         
let storeMode = 'local';
let firestore = null;     

let entries = [];        
let goals = { ...DEFAULT_GOALS };
let profile = { height: null, weight: null };

let activeTrendMetric = 'steps';
let trendChart = null;
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    setupStarfield();
    setupTabs();
    setupForms();
    setupHistoryToolbar();
    setupTrendPills();
    setDefaultDate();

    await resolveIdentity();
    renderIdentity();

    await Promise.all([loadEntries(), loadGoals(), loadProfile()]);

    renderAll();
});


async function resolveIdentity() {
    try {
        const parentWin = window.parent;
        const sameWindow = !parentWin || parentWin === window;
        if (!sameWindow && parentWin.auth && parentWin.auth.currentUser && parentWin.db) {
            const pUser = parentWin.auth.currentUser;
            user = {
                uid: pUser.uid,
                displayName: pUser.displayName || (pUser.email ? pUser.email.split('@')[0] : 'Explorer'),
                email: pUser.email || null
            };
            firestore = parentWin.db;
            storeMode = 'cloud';
            return;
        }
    } catch (err) {
        // Cross-origin or parent not ready. fall through to guest mode
        console.warn('Fitness Tracker: could not read parent session, using local mode.', err);
    }
    // Guest / standalone fallback .still fully usable, just local to this browser.
    const guestId = getOrCreateGuestId();
    user = { uid: guestId, displayName: 'Guest Explorer', email: null };
    storeMode = 'local';
}

function getOrCreateGuestId() {
    let id = localStorage.getItem('fitness_guest_id');
    if (!id) {
        id = 'guest-' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('fitness_guest_id', id);
    }
    return id;
}

function renderIdentity() {
    const initials = (user.displayName || 'U').trim().slice(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.displayName;
    document.getElementById('userMode').textContent = storeMode === 'cloud' ? 'Cloud synced' : 'Local guest mode';

    const syncNoteTop = document.getElementById('syncNoteTop');
    if (storeMode === 'cloud') {
        syncNoteTop.innerHTML = '<i class="fas fa-cloud"></i> Saving to your Canopus Realm account';
    } else {
        syncNoteTop.innerHTML = '<i class="fas fa-hard-drive"></i> Saved on this device only — log in from the realm to sync';
    }

    const greetingName = user.displayName.split(' ')[0];
    document.getElementById('greetingText').innerHTML = `Welcome back, <span class="accent">${escapeHtml(greetingName)}</span>`;
    document.getElementById('greetingDate').textContent = new Date().toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}


function localKey(suffix) { return `fitness_${suffix}_${user.uid}`; }

async function loadEntries() {
    if (storeMode === 'cloud') {
        try {
            const snap = await firestore.collection('users').doc(user.uid)
                .collection('fitnessEntries').orderBy('date', 'desc').get();
            entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            return;
        } catch (err) {
            console.warn('Fitness Tracker: cloud read failed, using local cache.', err);
        }
    }
    entries = JSON.parse(localStorage.getItem(localKey('entries')) || '[]');
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function persistLocalEntries() {
    localStorage.setItem(localKey('entries'), JSON.stringify(entries));
}

async function upsertEntry(data) {
    const isEdit = Boolean(editingId);
    if (storeMode === 'cloud') {
        try {
            if (isEdit) {
                await firestore.collection('users').doc(user.uid)
                    .collection('fitnessEntries').doc(editingId).set(data, { merge: true });
                const idx = entries.findIndex(e => e.id === editingId);
                if (idx > -1) entries[idx] = { id: editingId, ...entries[idx], ...data };
            } else {
                const ref = await firestore.collection('users').doc(user.uid)
                    .collection('fitnessEntries').add({ ...data, createdAt: new Date().toISOString() });
                entries.unshift({ id: ref.id, ...data });
            }
            entries.sort((a, b) => (a.date < b.date ? 1 : -1));
            return;
        } catch (err) {
            console.warn('Fitness Tracker: cloud write failed, saving locally instead.', err);
        }
    }
    if (isEdit) {
        const idx = entries.findIndex(e => e.id === editingId);
        if (idx > -1) entries[idx] = { ...entries[idx], ...data };
    } else {
        entries.unshift({ id: 'e-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), ...data });
    }
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    persistLocalEntries();
}

async function removeEntry(id) {
    if (storeMode === 'cloud') {
        try {
            await firestore.collection('users').doc(user.uid).collection('fitnessEntries').doc(id).delete();
        } catch (err) {
            console.warn('Fitness Tracker: cloud delete failed, removing locally instead.', err);
        }
    }
    entries = entries.filter(e => e.id !== id);
    if (storeMode !== 'cloud') persistLocalEntries();
}

async function loadGoals() {
    if (storeMode === 'cloud') {
        try {
            const doc = await firestore.collection('users').doc(user.uid).get();
            const data = doc.exists ? doc.data() : {};
            if (data.fitnessGoals) { goals = { ...DEFAULT_GOALS, ...data.fitnessGoals }; return; }
        } catch (err) {
            console.warn('Fitness Tracker: cloud goals read failed, using local/defaults.', err);
        }
    }
    goals = JSON.parse(localStorage.getItem(localKey('goals')) || 'null') || { ...DEFAULT_GOALS };
}

async function saveGoals(newGoals) {
    goals = newGoals;
    if (storeMode === 'cloud') {
        try {
            await firestore.collection('users').doc(user.uid).set({ fitnessGoals: goals }, { merge: true });
            return;
        } catch (err) {
            console.warn('Fitness Tracker: cloud goals write failed, saving locally instead.', err);
        }
    }
    localStorage.setItem(localKey('goals'), JSON.stringify(goals));
}

async function loadProfile() {
    if (storeMode === 'cloud') {
        try {
            const doc = await firestore.collection('users').doc(user.uid).get();
            const data = doc.exists ? doc.data() : {};
            if (data.fitnessProfile) { profile = data.fitnessProfile; return; }
        } catch (err) {
            console.warn('Fitness Tracker: cloud profile read failed, using local/defaults.', err);
        }
    }
    profile = JSON.parse(localStorage.getItem(localKey('profile')) || 'null') || { height: null, weight: null };
}

async function saveProfile(newProfile) {
    profile = newProfile;
    if (storeMode === 'cloud') {
        try {
            await firestore.collection('users').doc(user.uid).set({ fitnessProfile: profile }, { merge: true });
            return;
        } catch (err) {
            console.warn('Fitness Tracker: cloud profile write failed, saving locally instead.', err);
        }
    }
    localStorage.setItem(localKey('profile'), JSON.stringify(profile));
}


function renderAll() {
    renderOrbitRings();
    renderTrendChart();
    renderBadges();
    renderStreak();
    renderHistoryTable();
    populateGoalsForm();
    populateProfileForm();
}

function renderOrbitRings() {
    const today = todayStr();
    const todayEntry = entries.find(e => e.date === today) || {};

    setRing('steps', todayEntry.steps || 0, goals.steps, v => Number(v).toLocaleString());
    setRing('calories', todayEntry.calories || 0, goals.calories, v => `${v}`);
    setRing('water', todayEntry.water || 0, goals.water, v => `${v} L`);
    setRing('sleep', todayEntry.sleep || 0, goals.sleep, v => `${v} h`);

    document.getElementById('goal-steps-label').textContent = `of ${goals.steps.toLocaleString()} goal`;
    document.getElementById('goal-calories-label').textContent = `of ${goals.calories} goal`;
    document.getElementById('goal-water-label').textContent = `of ${goals.water} L goal`;
    document.getElementById('goal-sleep-label').textContent = `of ${goals.sleep} h goal`;
}

function setRing(key, value, goal, formatter) {
    const circle = document.getElementById(`ring-${key}`);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(1, goal ? value / goal : 0));
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = `${circumference * (1 - progress)}`;
    document.getElementById(`val-${key}`).textContent = formatter(value);
}

/* Weekly trend chart  */
function setupTrendPills() {
    document.querySelectorAll('.metric-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.metric-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeTrendMetric = pill.getAttribute('data-metric');
            renderTrendChart();
        });
    });
}

function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    const days = lastNDays(14);
    const byDate = {};
    entries.forEach(e => { byDate[e.date] = e; });

    const labels = days.map(d => formatShortDate(d));
    const data = days.map(d => {
        const e = byDate[d];
        if (!e) return null;
        const v = e[activeTrendMetric];
        return (v === undefined || v === null || v === '') ? null : Number(v);
    });

    const color = METRIC_COLORS[activeTrendMetric];

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: activeTrendMetric,
                data,
                borderColor: color,
                backgroundColor: hexToRgba(color, 0.15),
                pointBackgroundColor: color,
                pointRadius: 3,
                tension: 0.35,
                fill: true,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#7d93a6', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#7d93a6', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
            }
        }
    });
}

function computeStreak() {
    const logged = new Set(entries.map(e => e.date));
    let streak = 0;
    let cursor = new Date();
    // A streak counts today if logged, otherwise checks if yesterday was
    // logged so a day that hasn't been entered *yet* doesn't zero it out.
    if (!logged.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
    while (logged.has(dateToStr(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function renderStreak() {
    const streak = computeStreak();
    document.getElementById('streakText').textContent = `${streak} day${streak === 1 ? '' : 's'} streak`;
}

function renderBadges() {
    const streak = computeStreak();
    const hydrationHits = entries.filter(e => Number(e.water) >= goals.water).length;
    const restHits = entries.filter(e => Number(e.sleep) >= goals.sleep).length;
    const bigStepDay = entries.some(e => Number(e.steps) >= 10000);

    const badgeDefs = [
        { key: 'first', icon: 'fa-star', label: 'First Log', earned: entries.length >= 1 },
        { key: 'streak3', icon: 'fa-fire', label: '3-Day Streak', earned: streak >= 3 },
        { key: 'streak7', icon: 'fa-fire-flame-curved', label: '7-Day Streak', earned: streak >= 7 },
        { key: 'streak30', icon: 'fa-meteor', label: '30-Day Streak', earned: streak >= 30 },
        { key: 'steps10k', icon: 'fa-shoe-prints', label: '10K Step Club', earned: bigStepDay },
        { key: 'hydration', icon: 'fa-droplet', label: 'Hydration Hero', earned: hydrationHits >= 5 },
        { key: 'rested', icon: 'fa-moon', label: 'Well Rested', earned: restHits >= 5 },
    ];

    const row = document.getElementById('badgesRow');
    row.innerHTML = badgeDefs.map(b => `
        <div class="badge ${b.earned ? 'earned' : ''}" title="${b.earned ? 'Earned' : 'Locked'}">
            <i class="fas ${b.icon}"></i><span>${b.label}</span>
        </div>
    `).join('');
}

/*  History table  */
function renderHistoryTable(filterText = '') {
    const body = document.getElementById('historyBody');
    const empty = document.getElementById('historyEmpty');
    const q = filterText.trim().toLowerCase();

    const filtered = entries.filter(e => {
        if (!q) return true;
        return e.date.includes(q) || (e.notes || '').toLowerCase().includes(q);
    });

    document.getElementById('entryCountLabel').textContent =
        `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} logged`;

    if (filtered.length === 0) {
        body.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    body.innerHTML = filtered.map(e => `
        <tr>
            <td>${formatShortDate(e.date)}</td>
            <td>${e.steps ? Number(e.steps).toLocaleString() : '—'}</td>
            <td>${e.calories ?? '—'}</td>
            <td>${e.water ?? '—'} L</td>
            <td>${e.sleep ?? '—'} h</td>
            <td>${e.weight ? `${e.weight} kg` : '—'}</td>
            <td>${e.notes ? escapeHtml(truncate(e.notes, 40)) : '—'}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-action" title="Edit" onclick="editEntry('${e.id}')"><i class="fas fa-pen"></i></button>
                    <button class="icon-action danger" title="Delete" onclick="confirmDeleteEntry('${e.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupHistoryToolbar() {
    document.getElementById('historySearch').addEventListener('input', (e) => {
        renderHistoryTable(e.target.value);
    });
    document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
}

function exportCsv() {
    if (entries.length === 0) {
        showToast('Nothing to export yet — log a day first.', 'info');
        return;
    }
    const header = ['Date', 'Steps', 'Calories', 'Water (L)', 'Sleep (h)', 'Weight (kg)', 'Notes'];
    const rows = entries.map(e => [
        e.date, e.steps ?? '', e.calories ?? '', e.water ?? '', e.sleep ?? '', e.weight ?? '',
        `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-history-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('History exported.', 'success');
}

window.editEntry = function (id) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    editingId = id;
    document.getElementById('f-editing-id').value = id;
    document.getElementById('f-date').value = e.date;
    document.getElementById('f-steps').value = e.steps ?? '';
    document.getElementById('f-calories').value = e.calories ?? '';
    document.getElementById('f-water').value = e.water ?? '';
    document.getElementById('f-sleep').value = e.sleep ?? '';
    document.getElementById('f-weight').value = e.weight ?? '';
    document.getElementById('f-notes').value = e.notes ?? '';
    document.getElementById('saveEntryBtn').innerHTML = '<i class="fas fa-check"></i> Update entry';
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    switchTab('log');
};

window.confirmDeleteEntry = async function (id) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    const ok = window.confirm(`Delete the entry for ${formatShortDate(e.date)}? This can't be undone.`);
    if (!ok) return;
    await removeEntry(id);
    renderAll();
    showToast('Entry deleted.', 'success');
};


function setDefaultDate() {
    document.getElementById('f-date').value = todayStr();
}

function setupForms() {
    document.getElementById('entryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            date: document.getElementById('f-date').value,
            steps: Number(document.getElementById('f-steps').value) || 0,
            calories: Number(document.getElementById('f-calories').value) || 0,
            water: Number(document.getElementById('f-water').value) || 0,
            sleep: Number(document.getElementById('f-sleep').value) || 0,
            notes: document.getElementById('f-notes').value.trim()
        };
        const weightRaw = document.getElementById('f-weight').value;
        if (weightRaw !== '') data.weight = Number(weightRaw);

        if (!data.date) { showToast('Pick a date for this entry.', 'error'); return; }

        await upsertEntry(data);
        resetEntryForm();
        renderAll();
        showToast(editingId ? 'Entry updated.' : 'Entry saved.', 'success');
        editingId = null;
    });

    document.getElementById('cancelEditBtn').addEventListener('click', resetEntryForm);

    document.getElementById('goalsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newGoals = {
            steps: Number(document.getElementById('g-steps').value) || DEFAULT_GOALS.steps,
            calories: Number(document.getElementById('g-calories').value) || DEFAULT_GOALS.calories,
            water: Number(document.getElementById('g-water').value) || DEFAULT_GOALS.water,
            sleep: Number(document.getElementById('g-sleep').value) || DEFAULT_GOALS.sleep
        };
        await saveGoals(newGoals);
        renderAll();
        showToast('Goals updated.', 'success');
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const height = Number(document.getElementById('p-height').value) || null;
        const weight = Number(document.getElementById('p-weight').value) || null;
        await saveProfile({ height, weight });
        renderBmi();
        showToast('Profile saved.', 'success');
    });
}

function resetEntryForm() {
    editingId = null;
    document.getElementById('entryForm').reset();
    document.getElementById('f-editing-id').value = '';
    setDefaultDate();
    document.getElementById('saveEntryBtn').innerHTML = '<i class="fas fa-check"></i> Save entry';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function populateGoalsForm() {
    document.getElementById('g-steps').value = goals.steps;
    document.getElementById('g-calories').value = goals.calories;
    document.getElementById('g-water').value = goals.water;
    document.getElementById('g-sleep').value = goals.sleep;
}

function populateProfileForm() {
    document.getElementById('p-height').value = profile.height ?? '';
    document.getElementById('p-weight').value = profile.weight ?? '';
    renderBmi();
}

function renderBmi() {
    const result = document.getElementById('bmiResult');
    if (!profile.height || !profile.weight) {
        result.classList.remove('visible');
        return;
    }
    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    const rounded = bmi.toFixed(1);

    let category, color;
    if (bmi < 18.5) { category = 'Underweight'; color = '#2fd8f5'; }
    else if (bmi < 25) { category = 'Normal range'; color = '#16ffb0'; }
    else if (bmi < 30) { category = 'Overweight'; color = '#f59e0b'; }
    else { category = 'Obese'; color = '#ef4444'; }

    document.getElementById('bmiValue').textContent = rounded;
    const catEl = document.getElementById('bmiCategory');
    catEl.textContent = category;
    catEl.style.background = hexToRgba(color, 0.15);
    catEl.style.color = color;
    result.classList.add('visible');
}


function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
}

function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === name));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
}

function showToast(message, type = 'success') {
    const stack = document.getElementById('toastStack');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

/* STARFIELD bg */
function setupStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = document.documentElement.scrollHeight;
        const count = Math.min(160, Math.floor((w * h) / 11000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            baseAlpha: Math.random() * 0.55 + 0.2,
            speed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2
        }));
    }

    let t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            const alpha = reduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.25;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(230, 245, 245, ${Math.max(0, alpha)})`;
            ctx.fill();
        });
        t++;
        if (!reduced) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();
}


function todayStr() { return dateToStr(new Date()); }

function dateToStr(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function lastNDays(n) {
    const out = [];
    const d = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const day = new Date(d);
        day.setDate(d.getDate() - i);
        out.push(dateToStr(day));
    }
    return out;
}

function formatShortDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function truncate(str, n) { return str.length > n ? str.slice(0, n - 1) + '…' : str; }

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function hexToRgba(hex, alpha) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
