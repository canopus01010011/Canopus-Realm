//  Starfield bg 
(function setupStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [], w, h, t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = document.documentElement.scrollHeight;
        const count = Math.min(160, Math.floor((w * h) / 11000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            baseAlpha: Math.random() * 0.6 + 0.2,
            speed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2
        }));
    }
    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            const a = reduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.25;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(230,245,245,${Math.max(0, a)})`;
            ctx.fill();
        });
        t++;
        if (!reduced) requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize(); draw();
})();

//  DOM refs 
const els = {
    newTask: document.getElementById('new-task'),
    taskDate: document.getElementById('task-date'),
    taskTag: document.getElementById('task-tag'),
    addBtn: document.getElementById('add-task'),
    clearBtn: document.getElementById('clear-all'),
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('emptyState'),
    emptyStateText: document.getElementById('emptyStateText'),
    searchInput: document.getElementById('search-input'),
    viewTabs: document.getElementById('viewTabs'),
    prioritySelect: document.getElementById('prioritySelect'),
    accountDot: document.getElementById('accountDot'),
    accountLabel: document.getElementById('accountLabel'),
    guestBanner: document.getElementById('guestBanner'),
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statDone: document.getElementById('statDone'),
    progressCircle: document.getElementById('progressCircle'),
    progressPercent: document.getElementById('progressPercent'),
    toastStack: document.getElementById('toastStack'),
};

// Default date field to today for convenience
(function seedDate() {
    const d = new Date();
    els.taskDate.value = d.toISOString().slice(0, 10);
})();

let selectedPriority = 'medium';
els.prioritySelect.addEventListener('click', (e) => {
    const btn = e.target.closest('.priority-opt');
    if (!btn) return;
    els.prioritySelect.querySelectorAll('.priority-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPriority = btn.getAttribute('data-priority');
});

let currentView = 'upcoming';
els.viewTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-tab');
    if (!btn) return;
    els.viewTabs.querySelectorAll('.view-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.getAttribute('data-view');
    render();
});

els.searchInput.addEventListener('input', render);

//Data layer
const PRIORITY_COLOR = { low: 'var(--cyan)', medium: 'var(--amber)', high: '#ff8a8a' };
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

let tasks = [];        
let uid = null;         
let cloudReady = false; 
let saveTimer = null;
let unsubscribe = null;

function localKey() {
    return `orbit_tasks_${uid || 'guest'}`;
}

function loadLocal() {
    try {
        return JSON.parse(localStorage.getItem(localKey())) || [];
    } catch { return []; }
}

function saveLocal() {
    localStorage.setItem(localKey(), JSON.stringify(tasks));
}

function scheduleSave() {
    saveLocal();
    if (!uid || typeof db === 'undefined') return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        db.collection('appData').doc(uid).set({ todos: tasks, todosUpdatedAt: new Date() }, { merge: true })
            .catch(err => console.error('Orbit: cloud save failed', err));
    }, 400);
}

function attachCloud(user) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    uid = user ? user.uid : null;
    updateAccountUI(user);

    if (!user || typeof db === 'undefined') {
        tasks = loadLocal();
        render();
        return;
    }

    // Live-sync from Firestore; merge in any locally-stashed guest tasks once.
    unsubscribe = db.collection('appData').doc(user.uid).onSnapshot((doc) => {
        const cloudTasks = (doc.exists && Array.isArray(doc.data().todos)) ? doc.data().todos : null;
        if (cloudTasks) {
            tasks = cloudTasks;
        } else {
            tasks = loadLocal();
            scheduleSave();
        }
        render();
    }, (err) => {
        console.error('Orbit: cloud sync failed, falling back to local', err);
        tasks = loadLocal();
        render();
    });
}

function updateAccountUI(user) {
    if (user) {
        els.accountDot.className = 'account-dot online';
        els.accountLabel.textContent = user.displayName || user.email || 'Synced';
        els.guestBanner.hidden = true;
    } else {
        els.accountDot.className = 'account-dot guest';
        els.accountLabel.textContent = 'Guest mode';
        els.guestBanner.hidden = false;
    }
}

function initAuth() {
    if (typeof firebase === 'undefined' || typeof auth === 'undefined') {
        els.accountLabel.textContent = 'Local mode';
        els.accountDot.className = 'account-dot guest';
        els.guestBanner.hidden = false;
        tasks = loadLocal();
        render();
        return;
    }
    auth.onAuthStateChanged((user) => attachCloud(user));
}

initAuth();

//CRUD 
function addTask() {
    const text = els.newTask.value.trim();
    const date = els.taskDate.value;
    const tag = els.taskTag.value.trim();
    if (!text || !date) {
        toast('Add a task description and a date first', 'warning');
        return;
    }
    tasks.push({
        id: cryptoId(),
        text, date, tag,
        priority: selectedPriority,
        completed: false,
        createdAt: Date.now()
    });
    els.newTask.value = '';
    els.taskTag.value = '';
    els.newTask.focus();
    scheduleSave();
    render();
    toast('Task added', 'success');
}

function toggleTask(id) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    scheduleSave();
    render();
}

function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const [removed] = tasks.splice(idx, 1);
    scheduleSave();
    render();
    toast('Task deleted', 'error', {
        label: 'Undo',
        action: () => {
            tasks.splice(idx, 0, removed);
            scheduleSave();
            render();
        }
    });
}

function editTask(id, newText) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    const trimmed = newText.trim();
    if (trimmed) t.text = trimmed;
    scheduleSave();
    render();
}

function clearAll() {
    if (tasks.length === 0) return;
    if (!confirm('Clear every task? This cannot be undone.')) return;
    tasks = [];
    scheduleSave();
    render();
    toast('All tasks cleared', 'warning');
}

els.addBtn.addEventListener('click', addTask);
els.newTask.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
els.clearBtn.addEventListener('click', clearAll);

function cryptoId() {
    return 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)) + Date.now().toString(36);
}

//  Rendering
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function getFilteredTasks() {
    const query = els.searchInput.value.trim().toLowerCase();
    let list = tasks.filter(t => {
        if (query && !(t.text.toLowerCase().includes(query) || (t.tag || '').toLowerCase().includes(query))) return false;
        return true;
    });

    const today = todayISO();
    if (currentView === 'today') {
        list = list.filter(t => t.date === today && !t.completed);
    } else if (currentView === 'upcoming') {
        list = list.filter(t => t.date >= today && !t.completed);
    } else if (currentView === 'completed') {
        list = list.filter(t => t.completed);
    }
    // 'all' -> no extra filter

    return list;
}

function render() {
    const list = getFilteredTasks();
    els.taskList.innerHTML = '';

    if (list.length === 0) {
        els.emptyState.hidden = false;
        els.emptyStateText.textContent = els.searchInput.value.trim()
            ? `No tasks match "${els.searchInput.value.trim()}"`
            : currentView === 'completed'
                ? 'Nothing completed yet — clear a task off the list to see it here.'
                : "Add your first task above and it'll drift into view.";
    } else {
        els.emptyState.hidden = true;
    }

    // group by date
    const groups = {};
    list.forEach(t => {
        if (!groups[t.date]) groups[t.date] = [];
        groups[t.date].push(t);
    });

    const dates = Object.keys(groups).sort((a, b) => currentView === 'completed' ? b.localeCompare(a) : a.localeCompare(b));

    dates.forEach(date => {
        const items = groups[date].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
        const section = document.createElement('div');
        section.className = 'date-group';

        const heading = document.createElement('div');
        heading.className = 'date-heading';
        heading.innerHTML = `<span>${formatDate(date)}</span><span class="date-count">${items.length} task${items.length > 1 ? 's' : ''}</span>`;
        section.appendChild(heading);

        items.forEach(t => section.appendChild(renderTaskItem(t)));
        els.taskList.appendChild(section);
    });

    updateStats();
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d - today) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function renderTaskItem(t) {
    const item = document.createElement('div');
    item.className = 'task-item' + (t.completed ? ' completed' : '');
    item.style.setProperty('--priority-color', PRIORITY_COLOR[t.priority] || 'var(--emerald)');

    const check = document.createElement('button');
    check.className = 'task-check';
    check.innerHTML = '<i class="fas fa-check"></i>';
    check.setAttribute('aria-label', 'Toggle complete');
    check.addEventListener('click', () => toggleTask(t.id));

    const body = document.createElement('div');
    body.className = 'task-body';
    const textEl = document.createElement('div');
    textEl.className = 'task-text';
    textEl.textContent = t.text;
    body.appendChild(textEl);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const pBadge = document.createElement('span');
    pBadge.className = 'task-priority-badge';
    pBadge.style.setProperty('--priority-color', PRIORITY_COLOR[t.priority]);
    pBadge.textContent = t.priority;
    meta.appendChild(pBadge);
    if (t.tag) {
        const tBadge = document.createElement('span');
        tBadge.className = 'task-tag-badge';
        tBadge.textContent = `#${t.tag}`;
        meta.appendChild(tBadge);
    }
    body.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-pen"></i>';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.addEventListener('click', () => startEdit(item, textEl, t));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.addEventListener('click', () => {
        item.classList.add('removing');
        setTimeout(() => deleteTask(t.id), 200);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(check);
    item.appendChild(body);
    item.appendChild(actions);
    return item;
}

function startEdit(item, textEl, t) {
    item.classList.add('editing');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-text-input';
    input.value = t.text;
    textEl.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function finish() {
        editTask(t.id, input.value);
    }
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { input.value = t.text; input.blur(); }
    });
}

function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pending = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;

    els.statTotal.textContent = total;
    els.statPending.textContent = pending;
    els.statDone.textContent = done;
    els.progressPercent.textContent = `${pct}%`;

    const circumference = 169.6;
    els.progressCircle.style.strokeDashoffset = circumference - (circumference * pct) / 100;
}

// Toasts
function toast(message, type = 'success', undo = null) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' }[type] || 'fa-circle-info';
    el.innerHTML = `<i class="fas ${icon}"></i><span>${escapeHtml(message)}</span>`;
    if (undo) {
        const btn = document.createElement('button');
        btn.className = 'toast-undo';
        btn.textContent = undo.label;
        btn.addEventListener('click', () => { undo.action(); el.remove(); });
        el.appendChild(btn);
    }
    els.toastStack.appendChild(el);
    setTimeout(() => el.remove(), undo ? 5000 : 3000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}