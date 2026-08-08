
//Starfield bg
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

//DOM refs
const els = {
    composer: document.getElementById('composer'),
    noteTitle: document.getElementById('note-title'),
    noteInput: document.getElementById('note-input'),
    addBtn: document.getElementById('add-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
    newNoteBtn: document.getElementById('newNoteBtn'),
    notesContainer: document.getElementById('notes-container'),
    emptyState: document.getElementById('emptyState'),
    emptyStateText: document.getElementById('emptyStateText'),
    searchInput: document.getElementById('search-input'),
    colorFilter: document.getElementById('colorFilter'),
    colorPicker: document.getElementById('colorPicker'),
    charCount: document.getElementById('charCount'),
    accountDot: document.getElementById('accountDot'),
    accountLabel: document.getElementById('accountLabel'),
    guestBanner: document.getElementById('guestBanner'),
    toastStack: document.getElementById('toastStack'),
};

const COLOR_VAR = {
    emerald: 'var(--emerald)', cyan: 'var(--cyan)', violet: 'var(--violet)',
    pink: 'var(--nova-pink)', amber: 'var(--amber)'
};

let selectedColor = 'emerald';
let activeFilter = 'all';
let editingId = null;

els.colorPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-dot');
    if (!btn) return;
    els.colorPicker.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedColor = btn.getAttribute('data-color');
});

els.colorFilter.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-dot');
    if (!btn) return;
    els.colorFilter.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.getAttribute('data-color');
    render();
});

els.searchInput.addEventListener('input', render);

els.noteInput.addEventListener('input', () => {
    els.charCount.textContent = `${els.noteInput.value.length} / 4000`;
});

els.newNoteBtn.addEventListener('click', () => openComposer());
els.cancelBtn.addEventListener('click', () => closeComposer());

function openComposer(note) {
    editingId = note ? note.id : null;
    els.noteTitle.value = note ? note.title : '';
    els.noteInput.value = note ? note.body : '';
    els.charCount.textContent = `${els.noteInput.value.length} / 4000`;
    selectedColor = note ? note.color : 'emerald';
    els.colorPicker.querySelectorAll('.color-dot').forEach(b => b.classList.toggle('active', b.getAttribute('data-color') === selectedColor));
    els.addBtn.textContent = note ? 'Save changes' : 'Save note';
    els.composer.classList.add('active');
    els.noteTitle.focus();
    els.composer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeComposer() {
    editingId = null;
    els.noteTitle.value = '';
    els.noteInput.value = '';
    els.charCount.textContent = '0 / 4000';
    els.composer.classList.remove('active');
}

//data layer (cloud-first, local fallback)
let notes = [];        
let uid = null;
let saveTimer = null;
let unsubscribe = null;

function localKey() { return `nebula_notes_${uid || 'guest'}`; }

function loadLocal() {
    try { return JSON.parse(localStorage.getItem(localKey())) || []; } catch { return []; }
}
function saveLocal() { localStorage.setItem(localKey(), JSON.stringify(notes)); }

function scheduleSave() {
    saveLocal();
    if (!uid || typeof db === 'undefined') return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        db.collection('appData').doc(uid).set({ notes, notesUpdatedAt: new Date() }, { merge: true })
            .catch(err => console.error('Nebula: cloud save failed', err));
    }, 400);
}

function attachCloud(user) {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    uid = user ? user.uid : null;
    updateAccountUI(user);

    if (!user || typeof db === 'undefined') {
        notes = loadLocal();
        render();
        return;
    }

    unsubscribe = db.collection('appData').doc(user.uid).onSnapshot((doc) => {
        const cloudNotes = (doc.exists && Array.isArray(doc.data().notes)) ? doc.data().notes : null;
        if (cloudNotes) {
            notes = cloudNotes;
        } else {
            notes = loadLocal();
            scheduleSave();
        }
        render();
    }, (err) => {
        console.error('Nebula: cloud sync failed, falling back to local', err);
        notes = loadLocal();
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
        notes = loadLocal();
        render();
        return;
    }
    auth.onAuthStateChanged((user) => attachCloud(user));
}

initAuth();

//CRUD
els.addBtn.addEventListener('click', saveNote);

function saveNote() {
    const title = els.noteTitle.value.trim();
    const body = els.noteInput.value.trim();
    if (!title && !body) {
        toast('Write something before saving', 'warning');
        return;
    }
    if (editingId) {
        const n = notes.find(n => n.id === editingId);
        if (n) {
            n.title = title || 'Untitled';
            n.body = body;
            n.color = selectedColor;
            n.updatedAt = Date.now();
        }
        toast('Note updated', 'success');
    } else {
        notes.unshift({
            id: cryptoId(),
            title: title || 'Untitled',
            body,
            color: selectedColor,
            pinned: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
        toast('Note saved', 'success');
    }
    scheduleSave();
    closeComposer();
    render();
}

function deleteNote(id) {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const [removed] = notes.splice(idx, 1);
    scheduleSave();
    render();
    toast('Note deleted', 'error', {
        label: 'Undo',
        action: () => { notes.splice(idx, 0, removed); scheduleSave(); render(); }
    });
}

function togglePin(id) {
    const n = notes.find(n => n.id === id);
    if (!n) return;
    n.pinned = !n.pinned;
    scheduleSave();
    render();
}

function cryptoId() {
    return 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)) + Date.now().toString(36);
}

// Rendering
function render() {
    const query = els.searchInput.value.trim().toLowerCase();
    let list = notes.filter(n => {
        if (activeFilter !== 'all' && n.color !== activeFilter) return false;
        if (query && !(n.title.toLowerCase().includes(query) || n.body.toLowerCase().includes(query))) return false;
        return true;
    });

    list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
    });

    els.notesContainer.innerHTML = '';

    if (list.length === 0) {
        els.emptyState.hidden = false;
        els.emptyStateText.textContent = (query || activeFilter !== 'all')
            ? 'No notes match your filters.'
            : 'Tap "New note" to pin your first thought to the sky.';
    } else {
        els.emptyState.hidden = true;
    }

    list.forEach(n => els.notesContainer.appendChild(renderNoteCard(n)));
}

function renderNoteCard(n) {
    const card = document.createElement('div');
    card.className = 'note-card' + (n.pinned ? ' pinned' : '');
    card.style.setProperty('--note-color', COLOR_VAR[n.color] || 'var(--emerald)');

    const top = document.createElement('div');
    top.className = 'note-top';
    const title = document.createElement('div');
    title.className = 'note-title';
    title.textContent = n.title;
    const pinBtn = document.createElement('button');
    pinBtn.className = 'pin-btn' + (n.pinned ? ' active' : '');
    pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
    pinBtn.setAttribute('aria-label', 'Pin note');
    pinBtn.addEventListener('click', () => togglePin(n.id));
    top.appendChild(title);
    top.appendChild(pinBtn);

    const body = document.createElement('div');
    body.className = 'note-body';
    body.textContent = n.body;

    const footer = document.createElement('div');
    footer.className = 'note-footer';
    const ts = document.createElement('span');
    ts.className = 'note-timestamp';
    ts.textContent = formatTimestamp(n.updatedAt);

    const actions = document.createElement('div');
    actions.className = 'note-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-note-btn';
    editBtn.innerHTML = '<i class="fas fa-pen"></i>';
    editBtn.setAttribute('aria-label', 'Edit note');
    editBtn.addEventListener('click', () => openComposer(n));
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-note-btn';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.setAttribute('aria-label', 'Delete note');
    delBtn.addEventListener('click', () => {
        card.classList.add('removing');
        setTimeout(() => deleteNote(n.id), 180);
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    footer.appendChild(ts);
    footer.appendChild(actions);

    card.appendChild(top);
    card.appendChild(body);
    card.appendChild(footer);
    return card;
}

function formatTimestamp(ms) {
    const d = new Date(ms);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

//Toasts
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