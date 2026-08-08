// Canopus Anime Tracker — app logic
// Data: Jikan v4 (MyAnimeList, unauthenticated, public API)
// Auth & storage: Firebase (compat SDK)

let currentUser = null;
let currentAnimeDetail = null;
let currentFilterStatus = 'all';
let currentUserRating = 0;
let userListMap = {}; 

let searchPage = 1;
let searchHasNextPage = false;

const REVIEWS_PAGE_LIMIT = 20;
const REVIEWS_STATS_LIMIT = 200; 
const JIKAN_BASE = 'https://api.jikan.moe/v4';

//DOM refer
const animeList = document.getElementById('anime-list');
const loadingEl = document.getElementById('loading');
const loadMoreBtn = document.getElementById('load-more-btn');
const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const sortSelect = document.getElementById('sort-select');
const surpriseBtn = document.getElementById('surprise-btn');
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

const FALLBACK_POSTER =
    'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
        '<rect width="100%" height="100%" fill="#0c111d"/>' +
        '<text x="50%" y="50%" fill="#4a5768" font-family="sans-serif" font-size="14" text-anchor="middle">No Image</text>' +
        '</svg>'
    );


document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getStoredTheme());
    initializeAuth();
    setupEventListeners();
    loadTopRatedAnimes();
    loadTrendingAnimes();
});

function initializeAuth() {
    if (typeof auth === 'undefined') {
        console.warn('Firebase auth is not configured — running in guest mode.');
        updateUIForAuth();
        return;
    }
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        updateUIForAuth();
        if (user) {
            document.getElementById('my-list-section').style.display = 'block';
            await refreshUserListMap();
            loadUserList();
            loadThemePreference();
        } else {
            document.getElementById('my-list-section').style.display = 'none';
            userListMap = {};
            updateQuickAddButtons();
        }
        if (currentAnimeDetail) refreshReviewFormForAuth();
    });
}

function updateUIForAuth() {
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button"><i class="fas fa-user-circle"></i></button>`;
        document.getElementById('username-display').textContent = currentUser.displayName || 'Otaku';
        document.getElementById('useremail-display').textContent = currentUser.email || '';
        document.getElementById('user-menu-btn').addEventListener('click', toggleUserDropdown);
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button">Login</button>`;
        document.getElementById('user-menu-btn').addEventListener('click', openAuthModal);
        userDropdown.classList.remove('active');
    }
}

//Event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', debounce(() => {
        searchPage = 1;
        fetchAnimeBySearch();
    }, 450));

    genreSelect.addEventListener('change', () => {
        searchPage = 1;
        fetchAnimeBySearch();
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            searchPage = 1;
            fetchAnimeBySearch();
        });
    }

    loadMoreBtn.addEventListener('click', () => fetchAnimeBySearch(true));

    if (surpriseBtn) surpriseBtn.addEventListener('click', surpriseMe);

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAuthTab);
    });

    document.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (!input) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.innerHTML = showing ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    });

    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) forgotBtn.addEventListener('click', handleForgotPassword);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilterStatus = e.currentTarget.getAttribute('data-filter');
            loadUserList();
        });
    });

    document.getElementById('user-rating').addEventListener('click', (e) => {
        const star = e.target.closest('i[data-rating]');
        if (!star) return;
        selectRating(parseInt(star.getAttribute('data-rating'), 10));
    });

    reviewForm.addEventListener('submit', handleReviewSubmit);

    if (reviewTextEl) {
        reviewTextEl.addEventListener('input', () => {
            const counter = document.getElementById('review-char-count');
            if (counter) counter.textContent = `${reviewTextEl.value.length}/500`;
        });
    }

    document.getElementById('review-login-btn').addEventListener('click', () => {
        closeAnimeModal();
        openAuthModal();
    });

    document.getElementById('save-anime-btn').addEventListener('click', saveToMyList);

    [trendingContainer, topRatedContainer, animeList, myListContainer].forEach(container => {
        if (!container) return;
        container.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-id]');
            if (removeBtn) {
                e.stopPropagation();
                removeFromList(removeBtn.getAttribute('data-remove-id'));
                return;
            }
            const quickAddBtn = e.target.closest('[data-quick-add-id]');
            if (quickAddBtn) {
                e.stopPropagation();
                toggleQuickAdd(quickAddBtn);
                return;
            }
            const card = e.target.closest('[data-mal-id]');
            if (card) {
                openAnimeDetail(parseInt(card.getAttribute('data-mal-id'), 10));
            }
        });
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal === authModal) closeAuthModal();
            if (modal === animeDetailModal) closeAnimeModal();
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (e.target === animeDetailModal) closeAnimeModal();
        if (!e.target.closest('#user-menu-btn') && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (authModal.classList.contains('active')) closeAuthModal();
        if (animeDetailModal.classList.contains('active')) closeAnimeModal();
    });

    document.getElementById('profile-link').addEventListener('click', (e) => {
        if (!currentUser) {
            e.preventDefault();
            userDropdown.classList.remove('active');
            showMessage('Log in to view your profile.', 'warning');
            openAuthModal();
        }
    });
    document.getElementById('settings-link').addEventListener('click', (e) => {
        if (!currentUser) {
            e.preventDefault();
            userDropdown.classList.remove('active');
            showMessage('Log in to view your settings.', 'warning');
            openAuthModal();
        }
    });
    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    themeToggleBtn.addEventListener('click', toggleTheme);

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

//Anime fetching 
async function fetchAnimeBySearch(append = false) {
    const query = searchInput.value.trim();
    const genreId = genreSelect.value;
    const sortValue = sortSelect ? sortSelect.value : 'popularity';

    if (!query && !genreId) {
        animeList.innerHTML = '<p class="no-results">Type a title or choose a genre to search.</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }


    if (append) {
        searchPage += 1;
    } else {
        searchPage = 1;
        loadingEl.style.display = 'flex';
        renderSkeletons(animeList, 8);
    }
    loadMoreBtn.disabled = true;

    try {
        const params = new URLSearchParams({ limit: '12', page: String(searchPage) });
        if (query) params.set('q', query);
        if (genreId) params.set('genres', genreId);
        if (sortValue) {
            const [orderBy, sortDir] = sortValue.split(':');
            params.set('order_by', orderBy);
            params.set('sort', sortDir || 'desc');
        }

        const data = await jikanFetch(`${JIKAN_BASE}/anime?${params.toString()}`);

        if (!data.data || data.data.length === 0) {
            if (!append) {
                animeList.innerHTML = renderEmptyState(
                    'fa-ghost',
                    'No anime matched that search.',
                    'Try a different title, or widen your search with just a genre.'
                );
            } else {
                showMessage('No more results.', 'warning');
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
            animeList.innerHTML = renderEmptyState('fa-triangle-exclamation', 'Search is unavailable right now.', 'Please try again in a moment.');
        } else {
            showMessage('Failed to load more results.', 'error');
            searchPage -= 1; 
        }
        loadMoreBtn.style.display = 'none';
    } finally {
        loadingEl.style.display = 'none';
        loadMoreBtn.disabled = false;
    }
}

async function loadTopRatedAnimes() {
    renderSkeletons(topRatedContainer, 6);
    try {
        const data = await jikanFetch(`${JIKAN_BASE}/top/anime?limit=10`);
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
    renderSkeletons(trendingContainer, 6);
    try {
        const data = await jikanFetch(`${JIKAN_BASE}/top/anime?filter=airing&limit=10`);
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

async function surpriseMe() {
    if (!surpriseBtn) return;
    surpriseBtn.disabled = true;
    const originalHtml = surpriseBtn.innerHTML;
    surpriseBtn.innerHTML = '<i class="fas fa-dice"></i> Picking…';
    try {
        const data = await jikanFetch(`${JIKAN_BASE}/random/anime`);
        if (data.data?.mal_id) {
            await openAnimeDetail(data.data.mal_id);
        } else {
            showMessage('Could not find a pick — try again.', 'warning');
        }
    } catch (error) {
        console.error('Random anime error:', error);
        showMessage('The random picker is unavailable right now.', 'error');
    } finally {
        surpriseBtn.disabled = false;
        surpriseBtn.innerHTML = originalHtml;
    }
}

async function jikanFetch(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function renderSkeletons(container, count) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-poster"></div>
            <div class="skeleton-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
            </div>
        </div>
    `).join('');
}

function renderEmptyState(icon, title, subtitle) {
    return `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <p><strong>${escapeHtml(title)}</strong><br>${escapeHtml(subtitle)}</p>
        </div>
    `;
}

function displayAnimes(animes, container, append = false) {
    if (!append) container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    animes.forEach(anime => fragment.appendChild(createAnimeCard(anime)));
    container.appendChild(fragment);
}

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
    const inList = Boolean(userListMap[anime.mal_id]);

    card.innerHTML = `
        <div class="poster-wrap">
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <button class="quick-add-btn${inList ? ' in-list' : ''}" type="button"
                data-quick-add-id="${anime.mal_id}"
                data-quick-add-title="${title}"
                data-quick-add-image="${imageUrl}"
                data-quick-add-score="${anime.score ?? ''}"
                aria-label="${inList ? 'Remove from my list' : 'Add to my list'}">
                <i class="fas ${inList ? 'fa-check' : 'fa-plus'}"></i>
            </button>
            <button class="favorite-btn" type="button" aria-label="View details">
                <i class="fas fa-info-circle"></i>
            </button>
        </div>
        <div class="anime-info">
            <h3 class="anime-title">${title}</h3>
            <p>${synopsis}</p>
            <div class="anime-rating">
                <i class="fas fa-star"></i> ${anime.score ?? 'N/A'}
            </div>
        </div>
    `;
    card.querySelector('img').addEventListener('error', function () {
        this.src = FALLBACK_POSTER;
    });
    return card;
}

async function refreshUserListMap() {
    if (!currentUser) { userListMap = {}; return; }
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('anime-list').get();
        userListMap = {};
        snapshot.forEach(doc => { userListMap[doc.id] = doc.data().status; });
        updateQuickAddButtons();
    } catch (error) {
        console.error('Error loading list cache:', error);
    }
}

function updateQuickAddButtons() {
    document.querySelectorAll('[data-quick-add-id]').forEach(btn => {
        const inList = Boolean(userListMap[btn.getAttribute('data-quick-add-id')]);
        btn.classList.toggle('in-list', inList);
        btn.querySelector('i').className = `fas ${inList ? 'fa-check' : 'fa-plus'}`;
        btn.setAttribute('aria-label', inList ? 'Remove from my list' : 'Add to my list');
    });
}

async function toggleQuickAdd(btn) {
    if (!currentUser) {
        showMessage('Log in to build your list.', 'warning');
        openAuthModal();
        return;
    }
    const malId = btn.getAttribute('data-quick-add-id');
    const alreadyIn = Boolean(userListMap[malId]);
    btn.disabled = true;

    try {
        const docRef = db.collection('users').doc(currentUser.uid).collection('anime-list').doc(malId);
        if (alreadyIn) {
            await docRef.delete();
            delete userListMap[malId];
            showMessage('Removed from your list.', 'success');
        } else {
            await docRef.set({
                malId,
                title: btn.getAttribute('data-quick-add-title'),
                image: btn.getAttribute('data-quick-add-image'),
                status: 'plan-to-watch',
                score: btn.getAttribute('data-quick-add-score') || null,
                addedDate: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            userListMap[malId] = 'plan-to-watch';
            showMessage('Added to Plan to Watch.', 'success');
        }
        updateQuickAddButtons();
        if (document.getElementById('my-list-section').style.display !== 'none') loadUserList();
    } catch (error) {
        console.error('Quick add error:', error);
        showMessage('Could not update your list.', 'error');
    } finally {
        btn.disabled = false;
    }
}

//Anime detail modal
async function openAnimeDetail(animeId) {
    try {
        const data = await jikanFetch(`${JIKAN_BASE}/anime/${animeId}/full`);
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
        showMessage('Failed to load anime details.', 'error');
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
            if (data.status) document.getElementById('watch-status-select').value = data.status;
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
            const counter = document.getElementById('review-char-count');
            if (counter) counter.textContent = `${reviewTextEl.value.length}/500`;
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
        snapshot.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));

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
        const dateStr = review.timestamp?.toDate ? review.timestamp.toDate().toLocaleDateString() : '';
        const authorName = escapeHtml(review.authorName || 'Anonymous');
        const text = review.text ? `<p class="review-text">${escapeHtml(review.text)}</p>` : '';
        const isOwn = currentUser && review.id === currentUser.uid;
        return `
            <div class="review-item${isOwn ? ' own-review' : ''}">
                <div class="review-header">
                    <span class="review-author">${authorName}${isOwn ? ' (you)' : ''}</span>
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

//Rating & reviews
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
        showMessage('Please log in to post a review.', 'warning');
        return;
    }
    if (!currentAnimeDetail) {
        showMessage('No anime selected.', 'error');
        return;
    }
    if (currentUserRating < 1) {
        showMessage('Please select a star rating.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submit-review-btn');
    submitBtn.disabled = true;

    try {
        const animeId = String(currentAnimeDetail.mal_id);
        const text = reviewTextEl.value.trim().slice(0, 500);

        await db.collection('anime').doc(animeId).collection('reviews').doc(currentUser.uid).set({
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Anonymous',
            rating: currentUserRating,
            text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('users').doc(currentUser.uid).collection('anime-list').doc(animeId).set({
            rating: currentUserRating
        }, { merge: true });

        showMessage('Review posted!', 'success');
        await loadAnimeReviews(currentAnimeDetail.mal_id);
        loadUserList();
    } catch (error) {
        console.error('Error posting review:', error);
        showMessage('Failed to post review.', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

//My list
async function saveToMyList() {
    if (!currentUser) {
        showMessage('Please log in first.', 'warning');
        return;
    }
    if (!currentAnimeDetail) {
        showMessage('No anime selected.', 'error');
        return;
    }

    const status = document.getElementById('watch-status-select').value;
    if (!status) {
        showMessage('Please select a status.', 'warning');
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
            status,
            addedDate: firebase.firestore.FieldValue.serverTimestamp(),
            score: currentAnimeDetail.score ?? null
        }, { merge: true });

        userListMap[animeId] = status;
        updateQuickAddButtons();
        showMessage('Anime added to your list!', 'success');
        loadUserList();
    } catch (error) {
        console.error('Error saving anime:', error);
        showMessage('Failed to save anime.', 'error');
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
            myListContainer.innerHTML = renderEmptyState(
                'fa-bookmark',
                'Nothing here yet.',
                'Tap the + on any card, or open a title and set a status.'
            );
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
                <div class="poster-wrap">
                    <img src="${imageUrl}" alt="${title}" loading="lazy">
                    <button class="favorite-btn favorite-btn-danger" type="button" aria-label="Remove from list" data-remove-id="${doc.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="anime-info">
                    <h3 class="anime-title">${title}</h3>
                    <div class="anime-rating">
                        <i class="fas fa-star"></i> ${anime.score ?? 'N/A'}
                    </div>
                    <p class="list-status">Status: ${escapeHtml(formatStatus(anime.status))}</p>
                    ${anime.rating ? `<p class="list-status">Your rating: ${anime.rating}/5</p>` : ''}
                </div>
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
        delete userListMap[docId];
        updateQuickAddButtons();
        showMessage('Anime removed from list.', 'success');
        loadUserList();
    } catch (error) {
        console.error('Error removing anime:', error);
        showMessage('Failed to remove anime.', 'error');
    }
}

//authentication
function openAuthModal() { authModal.classList.add('active'); }
function closeAuthModal() { authModal.classList.remove('active'); }

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
        'auth/weak-password': 'Password should be at least 8 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/requires-recent-login': 'Please log in again to confirm this change.'
    };
    return map[error.code] || error.message || 'Something went wrong. Please try again.';
}

function setFormLoading(form, isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('loading', isLoading);
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;

    if (!auth) { showMessage('Authentication is not configured yet.', 'error'); return; }

    setFormLoading(form, true);
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!', 'success');
        closeAuthModal();
        form.reset();
    } catch (error) {
        showMessage(friendlyAuthError(error), 'error');
    } finally {
        setFormLoading(form, false);
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

    if (!name) { showMessage('Please enter a display name.', 'warning'); return; }
    if (password !== confirmPassword) { showMessage('Passwords do not match.', 'error'); return; }
    if (password.length < 8) { showMessage('Password must be at least 8 characters.', 'warning'); return; }

    setFormLoading(form, true);
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });

        await db.collection('users').doc(result.user.uid).set({
            name,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            preferences: { theme: getStoredTheme(), notifications: true }
        });

        showMessage('Account created successfully!', 'success');
        closeAuthModal();
        form.reset();
    } catch (error) {
        showMessage(friendlyAuthError(error), 'error');
    } finally {
        setFormLoading(form, false);
    }
}

function handleForgotPassword() {
    const loginForm = document.getElementById('login-form');
    const email = (loginForm.querySelector('input[type="email"]').value || '').trim();
    if (!email) {
        showMessage('Enter your email above first, then try again.', 'warning');
        return;
    }
    auth.sendPasswordResetEmail(email)
        .then(() => showMessage(`Password reset email sent to ${email}.`, 'success'))
        .catch(err => showMessage(friendlyAuthError(err), 'error'));
}

function toggleUserDropdown() { userDropdown.classList.toggle('active'); }

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        userDropdown.classList.remove('active');
    }).catch(error => showMessage(friendlyAuthError(error), 'error'));
}


function getStoredTheme() {
    return localStorage.getItem('canopus-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === 'light' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
}

function toggleTheme() {
    const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('canopus-theme', next);
    applyTheme(next);

    if (currentUser && typeof db !== 'undefined') {
        db.collection('users').doc(currentUser.uid).set({
            preferences: { theme: next }
        }, { merge: true }).catch(err => console.error('Error saving theme preference:', err));
    }
}

async function loadThemePreference() {
    if (!currentUser || typeof db === 'undefined') return;
    try {
        const doc = await db.collection('users').doc(currentUser.uid).get();
        const savedTheme = doc.exists ? doc.data()?.preferences?.theme : null;
        if (savedTheme && savedTheme !== getStoredTheme()) {
            localStorage.setItem('canopus-theme', savedTheme);
            applyTheme(savedTheme);
        }
    } catch (error) {
        console.error('Error loading theme preference:', error);
    }
}

//Utilities
let activeMessages = [];

function showMessage(message, type = 'success') {
    // Cap the stack so a burst of actions doesn't paper the screen in toasts.
    if (activeMessages.length >= 3) {
        const oldest = activeMessages.shift();
        oldest.remove();
    }
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.top = `${100 + activeMessages.length * 64}px`;
    document.body.appendChild(messageEl);
    activeMessages.push(messageEl);

    setTimeout(() => {
        messageEl.remove();
        activeMessages = activeMessages.filter(m => m !== messageEl);
        repositionMessages();
    }, 3000);
}

function repositionMessages() {
    activeMessages.forEach((el, i) => { el.style.top = `${100 + i * 64}px`; });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}