// ============= GLOBAL STATE =============
let currentUser = null;
let currentTheme = 'dark';
let currentAnimeDetail = null;
let currentFilterStatus = 'all';
let currentUserRating = 0;

const animeList = document.getElementById('anime-list');
const loadingEl = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const authModal = document.getElementById('auth-modal');
const animeDetailModal = document.getElementById('anime-detail-modal');
const userMenuPlaceholder = document.getElementById('user-menu-placeholder');
const userDropdown = document.getElementById('user-dropdown');
const topRatedContainer = document.getElementById('top-rated-container');
const trendingContainer = document.getElementById('trending-container');
const myListContainer = document.getElementById('my-list');

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
    loadTopRatedAnimes();
    loadTrendingAnimes();
});

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateUIForAuth();
        if (user) {
            document.getElementById('my-list-section').style.display = 'block';
            loadUserList();
        } else {
            document.getElementById('my-list-section').style.display = 'none';
        }
    });
}

function updateUIForAuth() {
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="toggleUserDropdown()"><i class="fas fa-user-circle"></i></button>`;
        document.getElementById('username-display').textContent = currentUser.displayName || 'User';
        document.getElementById('useremail-display').textContent = currentUser.email;
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="openAuthModal()">Login</button>`;
    }
}

// ============= EVENT LISTENERS =============
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(() => fetchAnimeBySearch(), 500));
    genreSelect.addEventListener('change', fetchAnimeBySearch);

    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    // Auth tabs
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilterStatus = e.target.getAttribute('data-filter');
            loadUserList();
        });
    });

    // Star rating clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.star-rating i')) {
            const star = e.target.closest('i');
            const rating = parseInt(star.getAttribute('data-rating'));
            selectRating(rating);
        }
    });

    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (e.target === animeDetailModal) closeAnimeModal();
        if (!e.target.closest('.user-menu-btn') && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ============= ANIME FETCHING =============
async function fetchAnimeBySearch() {
    const query = searchInput.value.trim();
    const genreId = genreSelect.value;

    loadingEl.style.display = 'flex';
    animeList.innerHTML = '';

    if (!query && !genreId) {
        loadingEl.style.display = 'none';
        return;
    }

    try {
        let url = `https://api.jikan.moe/v4/anime?limit=12`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (genreId) url += `&genres=${genreId}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.data.length === 0) {
            animeList.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No anime found</p>';
        } else {
if (data.data) {
    displayAnimes(data.data, topRatedContainer);
} else {
    console.error(data.message);
    topRatedContainer.innerHTML =
        `<p class="error">${data.message}</p>`;
}        }
    } catch (error) {
        console.error('Fetch error:', error);
        animeList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff6b6b;">Failed to fetch data</p>';
    } finally {
        loadingEl.style.display = 'none';
    }
}

async function loadTopRatedAnimes() {
    console.log("Loading top rated anime...");

    try {
        
const res = await fetch(
    "https://api.jikan.moe/v4/top/anime?limit=10"
);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.data || !Array.isArray(data.data)) {
            topRatedContainer.innerHTML =
                `<p class="error">${data.message || "No anime available."}</p>`;
            return;
        }

        displayAnimes(data.data, topRatedContainer);

    } catch (err) {
        console.error(err);
        topRatedContainer.innerHTML =
            `<p class="error">Unable to load anime. Please try again later.</p>`;
    }
}

async function loadTrendingAnimes() {
    try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
        const data = await res.json();
if (data.data) {
    displayAnimes(data.data, trendingContainer);
} else {
    console.error(data.message);
    trendingContainer.innerHTML =
        `<p class="error">${data.message}</p>`;
}    } catch (error) {
        console.error('Trending error:', error);
    }
}

function displayAnimes(animes, container) {
    container.innerHTML = '';
    animes.forEach(anime => {
        const card = createAnimeCard(anime);
        container.appendChild(card);
    });
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
        <img src="${anime.images.jpg.image_url}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
        <div class="anime-info">
            <h3 class="anime-title">${anime.title}</h3>
            <p>${anime.synopsis ? anime.synopsis.substring(0, 80) + '...' : 'No description'}</p>
            <div class="anime-rating">
                <i class="fas fa-star"></i> ${anime.score || 'N/A'}
            </div>
        </div>
        <button class="favorite-btn" onclick="event.stopPropagation(); openAnimeDetail(${anime.mal_id})">
            <i class="fas fa-info-circle"></i>
        </button>
    `;
    card.addEventListener('click', () => openAnimeDetail(anime.mal_id));
    return card;
}

// ============= ANIME DETAIL MODAL =============
async function openAnimeDetail(animeId) {
    if (!currentUser) {
        showMessage('Please login to view details', 'warning');
        openAuthModal();
        return;
    }

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
        const data = await res.json();
        const anime = data.data;
        currentAnimeDetail = anime;

        // Display anime info
        document.getElementById('detail-poster').src = anime.images.jpg.image_url;
        document.getElementById('detail-title').textContent = anime.title;
        document.getElementById('detail-synopsis').textContent = anime.synopsis || 'No synopsis available';
        document.getElementById('detail-rating').textContent = anime.score || 'N/A';
        document.getElementById('detail-episodes').textContent = anime.episodes || 'TBA';
        document.getElementById('detail-status').textContent = anime.status || 'N/A';
        document.getElementById('detail-year').textContent = anime.aired?.prop?.from?.year || 'N/A';

        // Load user's rating and status
        await loadUserAnimeData(animeId);

        // Load comments
        await loadAnimeComments(animeId);

        animeDetailModal.classList.add('active');
    } catch (error) {
        console.error('Detail error:', error);
        showMessage('Failed to load anime details', 'error');
    }
}

async function loadUserAnimeData(animeId) {
    if (!currentUser) return;

    try {
        const docRef = db.collection('users').doc(currentUser.uid).collection('anime-list').doc(String(animeId));
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            
            // Set rating
            if (data.rating) {
                currentUserRating = data.rating;
                updateStarDisplay();
            }

            // Set watch status
            if (data.status) {
                document.getElementById('watch-status-select').value = data.status;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadAnimeComments(animeId) {
    const commentsList = document.getElementById('comments-list');
    const noComments = document.getElementById('no-comments');
    
    try {
        const snapshot = await db.collection('anime').doc(String(animeId)).collection('comments')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        commentsList.innerHTML = '';

        if (snapshot.empty) {
            noComments.style.display = 'block';
        } else {
            noComments.style.display = 'none';
            snapshot.forEach(doc => {
                const comment = doc.data();
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <div class="comment-author">${comment.authorName}</div>
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                    <div class="comment-date">${new Date(comment.timestamp.toDate()).toLocaleDateString()}</div>
                `;
                commentsList.appendChild(commentEl);
            });
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

function closeAnimeModal() {
    animeDetailModal.classList.remove('active');
    currentAnimeDetail = null;
    currentUserRating = 0;
}

// ============= RATING SYSTEM =============
function selectRating(rating) {
    currentUserRating = rating;
    updateStarDisplay();
}

function updateStarDisplay() {
    document.querySelectorAll('.star-rating i').forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= currentUserRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

async function saveToMyList() {
    if (!currentUser) {
        showMessage('Please login first', 'warning');
        return;
    }

    if (!currentAnimeDetail) {
        showMessage('No anime selected', 'error');
        return;
    }

    const status = document.getElementById('watch-status-select').value;
    if (!status) {
        showMessage('Please select a status', 'warning');
        return;
    }

    try {
        const animeId = String(currentAnimeDetail.mal_id);
        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(animeId).set({
            malId: animeId,
            title: currentAnimeDetail.title,
            image: currentAnimeDetail.images.jpg.image_url,
            rating: currentUserRating,
            status: status,
            addedDate: firebase.firestore.FieldValue.serverTimestamp(),
            score: currentAnimeDetail.score
        }, { merge: true });

        showMessage('Anime added to your list!', 'success');
        loadUserList();
    } catch (error) {
        console.error('Error saving anime:', error);
        showMessage('Failed to save anime', 'error');
    }
}

async function loadUserList() {
    if (!currentUser) return;

    try {
        let query = db.collection('users').doc(currentUser.uid).collection('anime-list');

        if (currentFilterStatus !== 'all') {
            query = query.where('status', '==', currentFilterStatus);
        }

        const snapshot = await query.get();
        myListContainer.innerHTML = '';

        if (snapshot.empty) {
            myListContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No anime in this category</p>';
            return;
        }

        snapshot.forEach(doc => {
            const anime = doc.data();
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.innerHTML = `
                <img src="${anime.image}" alt="${anime.title}">
                <div class="anime-info">
                    <h3 class="anime-title">${anime.title}</h3>
                    <div class="anime-rating">
                        <i class="fas fa-star"></i> ${anime.score || 'N/A'}
                    </div>
                    <p style="font-size: 0.85rem; color: #ffd93d; margin-top: 0.5rem;">
                        Status: ${anime.status}
                    </p>
                    ${anime.rating ? `<p style="font-size: 0.85rem; color: #ff6b6b;">Your: ⭐${anime.rating}/5</p>` : ''}
                </div>
                <button class="favorite-btn" style="background: #ff6b6b;" onclick="removeFromList('${doc.id}'); event.stopPropagation();">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            myListContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading user list:', error);
    }
}

async function removeFromList(docId) {
    if (!confirm('Remove from list?')) return;

    try {
        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(docId).delete();
        showMessage('Anime removed from list', 'success');
        loadUserList();
    } catch (error) {
        showMessage('Failed to remove anime', 'error');
    }
}

// ============= COMMENTS =============
function showAddCommentForm() {
    document.getElementById('add-comment-form').style.display = 'block';
    document.getElementById('add-comment-btn').style.display = 'none';
}

function toggleCommentsSection() {
    const section = document.getElementById('comments-section');
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

async function postComment() {
    if (!currentUser) {
        showMessage('Please login to comment', 'warning');
        return;
    }

    if (!currentAnimeDetail) {
        showMessage('No anime selected', 'error');
        return;
    }

    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        showMessage('Comment cannot be empty', 'warning');
        return;
    }

    try {
        await db.collection('anime').doc(String(currentAnimeDetail.mal_id)).collection('comments').add({
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            text: commentText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            rating: currentUserRating
        });

        document.getElementById('comment-text').value = '';
        document.getElementById('add-comment-form').style.display = 'none';
        document.getElementById('add-comment-btn').style.display = 'block';
        showMessage('Comment posted!', 'success');
        await loadAnimeComments(currentAnimeDetail.mal_id);
    } catch (error) {
        console.error('Error posting comment:', error);
        showMessage('Failed to post comment', 'error');
    }
}

// ============= AUTHENTICATION =============
function openAuthModal() {
    authModal.classList.add('active');
}

function closeAuthModal() {
    authModal.classList.remove('active');
}

function switchAuthTab(e) {
    const tabName = e.target.getAttribute('data-tab');
    
    document.querySelectorAll('.auth-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    e.target.classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!', 'success');
        closeAuthModal();
        e.target.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelectorAll('input[type="email"]')[0].value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });

        await db.collection('users').doc(result.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage('Account created successfully!', 'success');
        closeAuthModal();
        e.target.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function toggleUserDropdown() {
    userDropdown.classList.toggle('active');
}

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        userDropdown.classList.remove('active');
    }).catch(error => showMessage(error.message, 'error'));
}

function goToUserProfile() {
    showMessage('Profile feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

function goToUserSettings() {
    showMessage('Settings feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

// ============= THEME =============
function toggleDarkMode() {
    document.body.classList.toggle('light');
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (currentUser) {
        db.collection('users').doc(currentUser.uid).update({
            'preferences.theme': currentTheme
        });
    }
    localStorage.setItem('theme', currentTheme);
}

// Load theme on startup
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
        currentTheme = 'light';
    }
});

// ============= UTILITIES =============
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.remove(), 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('Anime Tracker loaded successfully');
