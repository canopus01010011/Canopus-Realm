// ============================================================
// CANOPUS ANIME TRACKER — app logic
// Data: Jikan v4 (MyAnimeList). Auth/data: Firebase (compat SDK).
// ============================================================

// ============= GLOBAL STATE =============
let currentUser = null;
let currentTheme = localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
let currentAnimeDetail = null;
let currentFilterStatus = 'all';
let currentUserRating = 0;

let searchPage = 1;
let searchHasNextPage = false;
let searchQuery = '';
let searchGenre = '';

const REVIEWS_PAGE_LIMIT = 20;
const REVIEWS_STATS_LIMIT = 200; // cap on how many reviews we average, to keep reads bounded

// ============= DOM REFERENCES =============
const animeList = document.getElementById('anime-list');
const loadingEl = document.getElementById('loading');
const loadMoreBtn = document.getElementById('load-more-btn');
const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const authModal = document.getElementById('auth-modal');
const animeDetailModal = document.getElementById('anime-detail-modal');
const userMenuPlaceholder = document.getElementById('user-menu-placeholder');
const userDropdown = document.getElementById('user-dropdown');
const topRatedContainer = document.getElementById('top-rated-container');
const trendingContainer = document.getElementById('trending-container');
const myListContainer = document.getElementById('my-list');
const reviewLoginGate = document.getElementById('review-login-gate');
const reviewForm = document.getElementById('review-form');
const reviewsListEl = document.getElementById('reviews-list');
const reviewTextEl = document.getElementById('review-text');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
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
        // Keep the open detail modal's review form in sync with auth state
        if (currentAnimeDetail) {
            refreshReviewFormForAuth();
        }
    });
}

function updateUIForAuth() {
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button"><i class="fas fa-user-circle"></i></button>`;
        document.getElementById('username-display').textContent = currentUser.displayName || 'User';
        document.getElementById('useremail-display').textContent = currentUser.email || '';
        document.getElementById('user-menu-btn').addEventListener('click', toggleUserDropdown);
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button">Login</button>`;
        document.getElementById('user-menu-btn').addEventListener('click', openAuthModal);
        userDropdown.classList.remove('active');
    }
}

// ============= EVENT LISTENERS =============
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(() => {
        searchPage = 1;
        fetchAnimeBySearch();
    }, 500));

    genreSelect.addEventListener('change', () => {
        searchPage = 1;
        fetchAnimeBySearch();
    });

    loadMoreBtn.addEventListener('click', () => fetchAnimeBySearch(true));

    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    // Auth tabs
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });

    // Filter pills (My List)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilterStatus = e.currentTarget.getAttribute('data-filter');
            loadUserList();
        });
    });

    // Star rating clicks (event delegation, works whenever the form is visible)
    document.getElementById('user-rating').addEventListener('click', (e) => {
        const star = e.target.closest('i[data-rating]');
        if (!star) return;
        selectRating(parseInt(star.getAttribute('data-rating'), 10));
    });

    // Review form submit
    reviewForm.addEventListener('submit', handleReviewSubmit);

    // Login prompt inside the review gate
    document.getElementById('review-login-btn').addEventListener('click', () => {
        closeAnimeModal();
        openAuthModal();
    });

    // Save to my list
    document.getElementById('save-anime-btn').addEventListener('click', saveToMyList);

    // Delegated clicks for anime cards (trending / top rated / search / my list)
    [trendingContainer, topRatedContainer, animeList, myListContainer].forEach(container => {
        container.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-id]');
            if (removeBtn) {
                e.stopPropagation();
                removeFromList(removeBtn.getAttribute('data-remove-id'));
                return;
            }
            const card = e.target.closest('[data-mal-id]');
            if (card) {
                openAnimeDetail(parseInt(card.getAttribute('data-mal-id'), 10));
            }
        });
    });

    // Close (x) buttons on both modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal === authModal) closeAuthModal();
            if (modal === animeDetailModal) closeAnimeModal();
        });
    });

    // Close modals / dropdown on outside click
    document.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (e.target === animeDetailModal) closeAnimeModal();
        if (!e.target.closest('#user-menu-btn') && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });

    // User dropdown actions
    document.getElementById('profile-link').addEventListener('click', (e) => {
        e.preventDefault();
        showMessage('Profile page coming soon!', 'warning');
        userDropdown.classList.remove('active');
    });
    document.getElementById('settings-link').addEventListener('click', (e) => {
        e.preventDefault();
        showMessage('Settings page coming soon!', 'warning');
        userDropdown.classList.remove('active');
    });
    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Navbar chrome
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
    hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => navMenu.classList.remove('active'));
    });

    document.getElementById('hero-search-btn').addEventListener('click', () => {
        document.getElementById('search-section').scrollIntoView({ behavior: 'smooth' });
        searchInput.focus();
    });
    document.getElementById('hero-signup-btn').addEventListener('click', () => {
        openAuthModal();
        document.querySelector('.auth-tab-btn[data-tab="signup"]').click();
    });
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ============= ANIME FETCHING =============
async function fetchAnimeBySearch(append = false) {
    const query = searchInput.value.trim();
    const genreId = genreSelect.value;
    searchQuery = query;
    searchGenre = genreId;

    if (!query && !genreId) {
        animeList.innerHTML = '<p class="no-results">Type a title or choose a genre to search.</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    if (!append) {
        loadingEl.style.display = 'flex';
        animeList.innerHTML = '';
    }
    loadMoreBtn.disabled = true;

    try {
        let url = `https://api.jikan.moe/v4/anime?limit=12&page=${searchPage}`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (genreId) url += `&genres=${encodeURIComponent(genreId)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.data || data.data.length === 0) {
            if (!append) {
                animeList.innerHTML = '<p class="no-results">No anime found. Try a different title or genre.</p>';
            }
            searchHasNextPage = false;
        } else {
            displayAnimes(data.data, animeList, append);
            searchHasNextPage = !!data.pagination?.has_next_page;
        }

        loadMoreBtn.style.display = searchHasNextPage ? 'inline-flex' : 'none';
    } catch (error) {
        console.error('Search fetch error:', error);
        if (!append) {
            animeList.innerHTML = '<p class="error">Failed to fetch results. Please try again.</p>';
        } else {
            showMessage('Failed to load more results', 'error');
        }
        loadMoreBtn.style.display = 'none';
    } finally {
        loadingEl.style.display = 'none';
        loadMoreBtn.disabled = false;
        if (append) searchPage += 1;
    }
}

async function loadTopRatedAnimes() {
    try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.data || !Array.isArray(data.data)) {
            topRatedContainer.innerHTML = '<p class="error">Unable to load anime.</p>';
            return;
        }
        displayAnimes(data.data, topRatedContainer);
    } catch (err) {
        console.error('Top rated error:', err);
        topRatedContainer.innerHTML = '<p class="error">Unable to load anime. Please try again later.</p>';
    }
}

async function loadTrendingAnimes() {
    try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.data || !Array.isArray(data.data)) {
            trendingContainer.innerHTML = '<p class="error">Unable to load anime.</p>';
            return;
        }
        displayAnimes(data.data, trendingContainer);
    } catch (error) {
        console.error('Trending error:', error);
        trendingContainer.innerHTML = '<p class="error">Unable to load anime. Please try again later.</p>';
    }
}

function displayAnimes(animes, container, append = false) {
    if (!append) container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    animes.forEach(anime => fragment.appendChild(createAnimeCard(anime)));
    container.appendChild(fragment);
}

const FALLBACK_POSTER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
        '<rect width="100%" height="100%" fill="#0c111d"/>' +
        '<text x="50%" y="50%" fill="#4a5768" font-family="sans-serif" font-size="14" text-anchor="middle">No Image</text>' +
        '</svg>'
    );

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.setAttribute('data-mal-id', anime.mal_id);
    card.setAttribute('tabindex', '0');

    const title = escapeHtml(anime.title || 'Untitled');
    const synopsis = anime.synopsis
        ? escapeHtml(anime.synopsis.substring(0, 80)) + '…'
        : 'No description available.';
    const imageUrl = anime.images?.jpg?.image_url || FALLBACK_POSTER;

    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" loading="lazy">
        <div class="anime-info">
            <h3 class="anime-title">${title}</h3>
            <p>${synopsis}</p>
            <div class="anime-rating">
                <i class="fas fa-star"></i> ${anime.score ?? 'N/A'}
            </div>
        </div>
        <button class="favorite-btn" type="button" aria-label="View details">
            <i class="fas fa-info-circle"></i>
        </button>
    `;
    card.querySelector('img').addEventListener('error', function () {
        this.src = FALLBACK_POSTER;
    });
    return card;
}

// ============= ANIME DETAIL MODAL =============
async function openAnimeDetail(animeId) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const anime = data.data;
        currentAnimeDetail = anime;

        document.getElementById('detail-poster').src = anime.images?.jpg?.image_url || FALLBACK_POSTER;
        document.getElementById('detail-poster').alt = anime.title || 'poster';
        document.getElementById('detail-title').textContent = anime.title || 'Untitled';
        document.getElementById('detail-synopsis').textContent = anime.synopsis || 'No synopsis available';
        document.getElementById('detail-rating').textContent = anime.score ?? 'N/A';
        document.getElementById('detail-episodes').textContent = anime.episodes ?? 'TBA';
        document.getElementById('detail-status').textContent = anime.status || 'N/A';
        document.getElementById('detail-year').textContent = anime.aired?.prop?.from?.year ?? 'N/A';

        document.getElementById('watch-status-select').value = '';
        currentUserRating = 0;
        reviewTextEl.value = '';
        updateStarDisplay();

        refreshReviewFormForAuth();

        if (currentUser) {
            await loadUserAnimeData(animeId);
            await loadUserReview(animeId);
        }
        await loadAnimeReviews(animeId);

        animeDetailModal.classList.add('active');
    } catch (error) {
        console.error('Detail error:', error);
        showMessage('Failed to load anime details', 'error');
    }
}

function refreshReviewFormForAuth() {
    if (currentUser) {
        reviewLoginGate.style.display = 'none';
        reviewForm.style.display = 'flex';
    } else {
        reviewLoginGate.style.display = 'block';
        reviewForm.style.display = 'none';
    }
}

async function loadUserAnimeData(animeId) {
    if (!currentUser) return;
    try {
        const docRef = db.collection('users').doc(currentUser.uid).collection('anime-list').doc(String(animeId));
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            if (data.status) {
                document.getElementById('watch-status-select').value = data.status;
            }
        }
    } catch (error) {
        console.error('Error loading user list entry:', error);
    }
}

async function loadUserReview(animeId) {
    if (!currentUser) return;
    try {
        const docRef = db.collection('anime').doc(String(animeId)).collection('reviews').doc(currentUser.uid);
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            currentUserRating = data.rating || 0;
            updateStarDisplay();
            reviewTextEl.value = data.text || '';
        }
    } catch (error) {
        console.error('Error loading user review:', error);
    }
}

async function loadAnimeReviews(animeId) {
    reviewsListEl.innerHTML = '<p class="muted-text">Loading reviews…</p>';
    try {
        const snapshot = await db.collection('anime').doc(String(animeId)).collection('reviews')
            .orderBy('timestamp', 'desc')
            .limit(REVIEWS_STATS_LIMIT)
            .get();

        const reviews = [];
        snapshot.forEach(doc => reviews.push(doc.data()));

        renderCommunityRating(reviews);
        renderReviewsList(reviews.slice(0, REVIEWS_PAGE_LIMIT));
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsListEl.innerHTML = '<p class="error">Unable to load reviews right now.</p>';
        document.getElementById('community-rating-value').textContent = '—';
        document.getElementById('community-rating-count').textContent = 'No ratings yet';
    }
}

function renderCommunityRating(reviews) {
    const rated = reviews.filter(r => typeof r.rating === 'number' && r.rating > 0);
    const valueEl = document.getElementById('community-rating-value');
    const countEl = document.getElementById('community-rating-count');

    if (rated.length === 0) {
        valueEl.textContent = '—';
        countEl.textContent = 'No ratings yet';
        return;
    }
    const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
    valueEl.textContent = avg.toFixed(1);
    countEl.textContent = `${rated.length} rating${rated.length === 1 ? '' : 's'}`;
}

function renderReviewsList(reviews) {
    if (reviews.length === 0) {
        reviewsListEl.innerHTML = '<p class="muted-text">No reviews yet — be the first to write one.</p>';
        return;
    }
    reviewsListEl.innerHTML = reviews.map(review => {
        const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
        const dateStr = review.timestamp?.toDate
            ? review.timestamp.toDate().toLocaleDateString()
            : '';
        const authorName = escapeHtml(review.authorName || 'Anonymous');
        const text = review.text ? `<p class="review-text">${escapeHtml(review.text)}</p>` : '';
        return `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${authorName}</span>
                    <span class="review-stars">${stars}</span>
                </div>
                ${text}
                <div class="review-date">${dateStr}</div>
            </div>
        `;
    }).join('');
}

function closeAnimeModal() {
    animeDetailModal.classList.remove('active');
    currentAnimeDetail = null;
    currentUserRating = 0;
    reviewTextEl.value = '';
    updateStarDisplay();
}

// ============= RATING & REVIEWS =============
function selectRating(rating) {
    currentUserRating = rating;
    updateStarDisplay();
}

function updateStarDisplay() {
    document.querySelectorAll('#user-rating i[data-rating]').forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'), 10);
        star.classList.toggle('active', starRating <= currentUserRating);
    });
}

async function handleReviewSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showMessage('Please login to post a review', 'warning');
        return;
    }
    if (!currentAnimeDetail) {
        showMessage('No anime selected', 'error');
        return;
    }
    if (currentUserRating < 1) {
        showMessage('Please select a star rating', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submit-review-btn');
    submitBtn.disabled = true;

    try {
        const animeId = String(currentAnimeDetail.mal_id);
        const text = reviewTextEl.value.trim();

        await db.collection('anime').doc(animeId).collection('reviews').doc(currentUser.uid).set({
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            rating: currentUserRating,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Keep the rating visible on the user's own list entry too, if they have one
        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(animeId).set({
            rating: currentUserRating
        }, { merge: true });

        showMessage('Review posted!', 'success');
        await loadAnimeReviews(currentAnimeDetail.mal_id);
        loadUserList();
    } catch (error) {
        console.error('Error posting review:', error);
        showMessage('Failed to post review', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

// ============= MY LIST =============
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

    const saveBtn = document.getElementById('save-anime-btn');
    saveBtn.disabled = true;

    try {
        const animeId = String(currentAnimeDetail.mal_id);
        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(animeId).set({
            malId: animeId,
            title: currentAnimeDetail.title,
            image: currentAnimeDetail.images?.jpg?.image_url || FALLBACK_POSTER,
            status: status,
            addedDate: firebase.firestore.FieldValue.serverTimestamp(),
            score: currentAnimeDetail.score ?? null
        }, { merge: true });

        showMessage('Anime added to your list!', 'success');
        loadUserList();
    } catch (error) {
        console.error('Error saving anime:', error);
        showMessage('Failed to save anime', 'error');
    } finally {
        saveBtn.disabled = false;
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
            myListContainer.innerHTML = '<p class="no-results">No anime in this category yet.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        snapshot.forEach(doc => {
            const anime = doc.data();
            const card = document.createElement('div');
            card.className = 'anime-card';
            card.setAttribute('data-mal-id', anime.malId);

            const title = escapeHtml(anime.title || 'Untitled');
            const imageUrl = anime.image || FALLBACK_POSTER;

            card.innerHTML = `
                <img src="${imageUrl}" alt="${title}" loading="lazy">
                <div class="anime-info">
                    <h3 class="anime-title">${title}</h3>
                    <div class="anime-rating">
                        <i class="fas fa-star"></i> ${anime.score ?? 'N/A'}
                    </div>
                    <p class="list-status">Status: ${escapeHtml(formatStatus(anime.status))}</p>
                    ${anime.rating ? `<p class="list-status">Your rating: ${anime.rating}/5</p>` : ''}
                </div>
                <button class="favorite-btn favorite-btn-danger" type="button" aria-label="Remove from list" data-remove-id="${doc.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            card.querySelector('img').addEventListener('error', function () {
                this.src = FALLBACK_POSTER;
            });
            fragment.appendChild(card);
        });
        myListContainer.appendChild(fragment);
    } catch (error) {
        console.error('Error loading user list:', error);
        myListContainer.innerHTML = '<p class="error">Unable to load your list right now.</p>';
    }
}

function formatStatus(status) {
    const map = {
        watching: 'Watching',
        completed: 'Completed',
        'on-hold': 'On Hold',
        'plan-to-watch': 'Plan to Watch',
        dropped: 'Dropped'
    };
    return map[status] || status || 'Unknown';
}

async function removeFromList(docId) {
    if (!currentUser) return;
    if (!confirm('Remove from list?')) return;

    try {
        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(docId).delete();
        showMessage('Anime removed from list', 'success');
        loadUserList();
    } catch (error) {
        console.error('Error removing anime:', error);
        showMessage('Failed to remove anime', 'error');
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
    const tabName = e.currentTarget.getAttribute('data-tab');

    document.querySelectorAll('.auth-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + '-tab').classList.add('active');
    e.currentTarget.classList.add('active');
}

function friendlyAuthError(error) {
    const map = {
        'auth/invalid-email': 'That email address looks invalid.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with that email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/email-already-in-use': 'An account with that email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return map[error.code] || error.message || 'Something went wrong. Please try again.';
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!', 'success');
        closeAuthModal();
        form.reset();
    } catch (error) {
        showMessage(friendlyAuthError(error), 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value.trim();
    const emailInputs = form.querySelectorAll('input[type="email"]');
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    const email = emailInputs[0].value.trim();
    const password = passwordInputs[0].value;
    const confirmPassword = passwordInputs[1].value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!name) {
        showMessage('Please enter a display name', 'warning');
        return;
    }
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    if (password.length < 8) {
        showMessage('Password must be at least 8 characters', 'warning');
        return;
    }

    submitBtn.disabled = true;
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
        form.reset();
    } catch (error) {
        showMessage(friendlyAuthError(error), 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

function toggleUserDropdown() {
    userDropdown.classList.toggle('active');
}

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        userDropdown.classList.remove('active');
    }).catch(error => showMessage(friendlyAuthError(error), 'error'));
}

// ============= THEME =============
function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    themeToggleBtn.innerHTML = theme === 'light'
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);

    if (currentUser) {
        db.collection('users').doc(currentUser.uid).set({
            preferences: { theme: currentTheme }
        }, { merge: true }).catch(err => console.error('Error saving theme preference:', err));
    }
}

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