const FALLBACK_POSTER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
        '<rect width="100%" height="100%" fill="#0c111d"/>' +
        '<text x="50%" y="50%" fill="#4a5768" font-family="sans-serif" font-size="14" text-anchor="middle">No Image</text>' +
        '</svg>'
    );

async function onAuthReady(user) {
    document.getElementById('profile-name').textContent = user.displayName || 'Otaku';
    document.getElementById('profile-email').textContent = user.email || '';
    document.getElementById('avatar-initial').textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
    document.getElementById('profile-verified').innerHTML = user.emailVerified
        ? '<i class="fas fa-circle-check" style="color:var(--success)"></i> Email verified'
        : '<i class="fas fa-triangle-exclamation" style="color:var(--warning)"></i> Email not verified';

    try {
        const snapshot = await db.collection('users').doc(user.uid).collection('anime-list')
            .orderBy('addedDate', 'desc')
            .get();

        const entries = [];
        snapshot.forEach(doc => entries.push(doc.data()));

        renderStats(entries);
        renderRecent(entries.slice(0, 6));
    } catch (error) {
        console.error('Error loading profile stats:', error);
        showMessage('Could not load your stats right now.', 'error');
    }
}

function renderStats(entries) {
    const counts = { watching: 0, completed: 0, 'plan-to-watch': 0, 'on-hold': 0, dropped: 0 };
    let ratingSum = 0;
    let ratingCount = 0;

    entries.forEach(e => {
        if (counts[e.status] !== undefined) counts[e.status] += 1;
        if (typeof e.rating === 'number' && e.rating > 0) {
            ratingSum += e.rating;
            ratingCount += 1;
        }
    });

    document.getElementById('stat-total').textContent = entries.length;
    document.getElementById('stat-watching').textContent = counts.watching;
    document.getElementById('stat-completed').textContent = counts.completed;
    document.getElementById('stat-plan').textContent = counts['plan-to-watch'];
    document.getElementById('stat-avg-rating').textContent = ratingCount ? (ratingSum / ratingCount).toFixed(1) : '—';
}

function renderRecent(entries) {
    const container = document.getElementById('recent-list');
    if (entries.length === 0) {
        container.innerHTML = '<p class="no-results">Nothing added yet — go find something to watch.</p>';
        return;
    }
    container.innerHTML = entries.map(anime => `
        <div class="anime-card">
            <div class="poster-wrap">
                <img src="${anime.image || FALLBACK_POSTER}" alt="${escapeHtml(anime.title || 'Untitled')}" loading="lazy"
                    onerror="this.src='${FALLBACK_POSTER}'">
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${escapeHtml(anime.title || 'Untitled')}</h3>
                <p class="list-status">Status: ${escapeHtml(formatStatus(anime.status))}</p>
            </div>
        </div>
    `).join('');
}

function formatStatus(status) {
    const map = {
        watching: 'Watching', completed: 'Completed', 'on-hold': 'On Hold',
        'plan-to-watch': 'Plan to Watch', dropped: 'Dropped'
    };
    return map[status] || status || 'Unknown';
}