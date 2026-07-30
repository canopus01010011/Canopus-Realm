// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;

const projectPaths = {
    'Anime-Tracker-main': '../Anime-Tracker-main/index.html',
    'ROCK-PAPER-SCISSOR02-main': '../ROCK-PAPER-SCISSOR02-main/index.html',
    'Tic-Tac-Toe-website-version--main': '../Tic-Tac-Toe-website-version--main/index.html',
    'Quiz-main': '../Quiz-main/index.html',
    'Note-Web-main': '../Note-Web-main/index.html',
    'To-Do-List-main': '../To-Do-List-main/index.html',
    'Fitness-Tracker-Dashboard-main': '../Fitness-Tracker-Dashboard-main/index.html',
    'Epic-Page-main': '../Epic-Page-main/index.html',
    'Epic-Music-Player-main': '../Epic-Music-Player-main/index2.html',
    'weather-main': '../weather-main/index.html',
    'Calculator-main': '../Calculator-main/index.html',
    'Currency-Converter-main': '../Currency-Converter-main/index.html',
    'ValentineLOL-main': '../ValentineLOL-main/index.html',
    'Eid-main': '../Eid-main/index.html'
};

// Featured project rotation data
const featuredProjects = [
    {
        key: 'Anime-Tracker-main', title: 'Anime Tracker', icon: 'fa-film',
        desc: "My largest anime management application — track, rate, and discuss every series you watch.",
        tags: ['HTML', 'CSS', 'JS', 'Firebase'], glow: 'rgba(47,216,245,0.22)'
    },
    {
        key: 'Calculator-main', title: 'Calculator', icon: 'fa-calculator',
        desc: "An advanced calculator with a scientific mode and full calculation history.",
        tags: ['HTML', 'CSS', 'JS'], glow: 'rgba(167,139,250,0.22)'
    },
    {
        key: 'Fitness-Tracker-Dashboard-main', title: 'Fitness Tracker', icon: 'fa-heartbeat',
        desc: "A dashboard for tracking fitness goals, workouts, and progress over time.",
        tags: ['HTML', 'CSS', 'JS'], glow: 'rgba(22,255,176,0.22)'
    },
    {
        key: 'ValentineLOL-main', title: 'Valentine', icon: 'fa-heart',
        desc: "A small, playful website built for asking someone out.",
        tags: ['Love', 'Confession'], glow: 'rgba(255,111,174,0.22)'
    }
];

// DOM refs
const authModal = document.getElementById('auth-modal');
const userDropdown = document.getElementById('user-dropdown');
const userMenuPlaceholder = document.getElementById('user-menu-placeholder');
const projectModal = document.getElementById('project-modal');
const projectIframe = document.getElementById('project-iframe');
const projectLoader = document.querySelector('.project-loader');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navbar = document.getElementById('navbar');

document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupEventListeners();
    setupNavigation();
    setupNavbarScroll();
    setupStarfield();
    setupCursorGlow();
    setupFilters();
    setupSearch();
    setupFeatured();
    setupStatCounters();
    setupCardReveal();
    setupCardTilt();
    console.log('Canopus Realm initialized');
});

// ============= NAVIGATION =============
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            scrollToSection(section);
            updateActiveNav(link);
            if (navMenu.classList.contains('active')) toggleHamburger();
        });
    });

    // Highlight nav link matching the section currently in view
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const match = document.querySelector(`.nav-link[data-section="${id}"]`);
                if (match) updateActiveNav(match);
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => observer.observe(s));
}

function updateActiveNav(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

hamburger.addEventListener('click', toggleHamburger);
function toggleHamburger() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

function setupNavbarScroll() {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        lastY = window.scrollY;
    }, { passive: true });
}

// ============= AMBIENT STARFIELD =============
function setupStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = document.documentElement.scrollHeight;
        const count = Math.min(220, Math.floor((w * h) / 9000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.3 + 0.3,
            baseAlpha: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2
        }));
    }

    let t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            const alpha = reduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.25;
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

// ============= CURSOR GLOW + PLANET PARALLAX =============
function setupCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    const planet = document.querySelector('.planet');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { glow.style.display = 'none'; return; }

    window.addEventListener('mousemove', (e) => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        if (planet && e.clientY < window.innerHeight) {
            const dx = (e.clientX / window.innerWidth - 0.5) * 24;
            const dy = (e.clientY / window.innerHeight - 0.5) * 24;
            planet.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }, { passive: true });
}

// ============= CATEGORY FILTER =============
function setupFilters() {
    const pills = document.querySelectorAll('.filter-pill');
    const worlds = document.querySelectorAll('.world');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filter = pill.getAttribute('data-filter');

            worlds.forEach(world => {
                const worldName = world.getAttribute('data-world');
                const show = filter === 'all' || filter === worldName;
                world.style.display = show ? '' : 'none';
            });

            if (filter !== 'all') {
                const target = document.getElementById(filter);
                if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 50);
            }
        });
    });
}

// ============= SEARCH =============
function setupSearch() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const toggle = document.getElementById('searchToggle');
    const heroBtn = document.getElementById('heroSearchBtn');
    const cards = Array.from(document.querySelectorAll('.project-card'));

    function openSearch() {
        overlay.classList.add('active');
        input.value = '';
        renderResults('');
        setTimeout(() => input.focus(), 50);
    }
    function closeSearch() { overlay.classList.remove('active'); }

    function renderResults(query) {
        const q = query.trim().toLowerCase();
        const matches = q === '' ? [] : cards.filter(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const tags = card.getAttribute('data-tags').toLowerCase();
            return name.includes(q) || tags.includes(q);
        });

        results.innerHTML = '';
        if (q !== '' && matches.length === 0) {
            results.innerHTML = `<p class="no-results">No projects found for "${escapeHtml(query)}"</p>`;
            return;
        }
        matches.forEach(card => {
            const name = card.getAttribute('data-name');
            const icon = card.querySelector('.project-visual i').className;
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `<i class="${icon}"></i><div><div class="srn">${name}</div><div class="srd">${card.querySelector('p').textContent}</div></div>`;
            item.addEventListener('click', () => {
                closeSearch();
                card.click();
            });
            results.appendChild(item);
        });
    }

    toggle.addEventListener('click', openSearch);
    heroBtn.addEventListener('click', openSearch);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', () => renderResults(input.value));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
        if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            openSearch();
        }
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============= FEATURED PROJECT ROTATION =============
function setupFeatured() {
    const card = document.getElementById('featuredCard');
    const titleEl = document.getElementById('featuredTitle');
    const descEl = document.getElementById('featuredDesc');
    const tagsEl = document.getElementById('featuredTags');
    const visualEl = document.getElementById('featuredVisual');
    const launchBtn = document.getElementById('featuredLaunch');
    const dotsWrap = document.getElementById('featuredDots');

    let index = 0;
    let timer;

    featuredProjects.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'featured-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => setFeatured(i, true));
        dotsWrap.appendChild(dot);
    });

    function setFeatured(i, userTriggered) {
        index = i;
        const p = featuredProjects[i];
        card.style.setProperty('--featured-glow', p.glow);
        titleEl.textContent = p.title;
        descEl.textContent = p.desc;
        visualEl.innerHTML = `<i class="fas ${p.icon}"></i>`;
        tagsEl.innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
        launchBtn.onclick = () => openProject(p.key);
        Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle('active', di === i));
        if (userTriggered) restart();
    }

    function restart() {
        clearInterval(timer);
        timer = setInterval(() => setFeatured((index + 1) % featuredProjects.length, false), 6000);
    }

    setFeatured(0, false);
    restart();
}

// ============= STAT COUNTERS =============
function setupStatCounters() {
    const nums = document.querySelectorAll('.stat-num');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            const suffix = el.getAttribute('data-suffix') || '';
            if (reduced) {
                el.textContent = target + suffix;
            } else {
                const duration = 1400;
                const start = performance.now();
                function tick(now) {
                    const progress = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.floor(eased * target) + suffix;
                    if (progress < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
            }
            obs.unobserve(el);
        });
    }, { threshold: 0.6 });

    nums.forEach(n => observer.observe(n));
}

// ============= CARD REVEAL ON SCROLL =============
function setupCardReveal() {
    const cards = document.querySelectorAll('.project-card');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${(i % 4) * 0.08}s`;
                entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => observer.observe(c));
}

// ============= CARD CURSOR-TRACKED GLOW =============
function setupCardTilt() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mx', `${x}%`);
            card.style.setProperty('--my', `${y}%`);
        });
    });
}

// ============= AUTHENTICATION =============
function initializeAuth() {
    if (typeof auth === 'undefined') {
        console.warn('Firebase auth not configured — auth features disabled.');
        updateUIForAuth();
        return;
    }
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateUIForAuth();
    });
}

function updateUIForAuth() {
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="toggleUserDropdown()"><i class="fas fa-user-circle"></i></button>`;
        document.getElementById('username-display').textContent = currentUser.displayName || 'User';
        document.getElementById('useremail-display').textContent = currentUser.email;
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" onclick="openAuthModal()">Login / Sign Up</button>`;
    }
}

function openAuthModal() { authModal.classList.add('active'); }
function closeAuthModal() { authModal.classList.remove('active'); }

function switchTab(tabName) {
    document.querySelectorAll('.auth-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.closest('#auth-modal')) closeAuthModal();
    });
});

authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Welcome back!', 'success');
        closeAuthModal();
        e.target.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelectorAll('input[type="email"]')[0].value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        await db.collection('users').doc(result.user.uid).set({
            name: name,
            email: email,
            createdAt: new Date(),
            preferences: { theme: 'dark', notifications: true }
        });
        showMessage('Account created — welcome to the realm!', 'success');
        closeAuthModal();
        e.target.reset();
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

function toggleUserDropdown() { userDropdown.classList.toggle('active'); }

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        userDropdown.classList.remove('active');
    }).catch((error) => showMessage(error.message, 'error'));
}

function goToUserProfile() {
    showMessage('Profile feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

function goToUserSettings() {
    showMessage('Settings feature coming soon!', 'warning');
    userDropdown.classList.remove('active');
}

// ============= PROJECT MODAL =============
function openProject(projectName) {
    if (!currentUser) {
        showMessage('Please login to access projects', 'warning');
        openAuthModal();
        return;
    }

    projectModal.classList.add('active');
    projectLoader.style.display = 'flex';
    projectIframe.style.display = 'none';

    const projectPath = projectPaths[projectName];
    if (projectPath) {
        projectIframe.src = projectPath;
        projectIframe.onload = () => {
            projectLoader.style.display = 'none';
            projectIframe.style.display = 'block';
        };
        trackActivity('open_project', projectName);
    } else {
        showMessage('Project not found!', 'error');
        closeProjectModal();
    }
}

function closeProjectModal() {
    projectModal.classList.remove('active');
    projectIframe.src = '';
}

projectModal.addEventListener('click', (e) => {
    if (e.target === projectModal) closeProjectModal();
});

// ============= EVENT LISTENERS =============
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu-btn') && !e.target.closest('.user-dropdown')) {
            userDropdown.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModal();
            closeProjectModal();
        }
    });
}

// ============= MESSAGE DISPLAY =============
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 3000);
}

// ============= UTILITY / DATA HELPERS =============
function getCurrentUserData() {
    if (currentUser) return db.collection('users').doc(currentUser.uid).get();
    return null;
}

function updateUserData(data) {
    if (currentUser) return db.collection('users').doc(currentUser.uid).update(data);
    return null;
}

function trackActivity(activity, projectName) {
    if (currentUser && typeof db !== 'undefined') {
        db.collection('users').doc(currentUser.uid).collection('activities').add({
            activity: activity,
            project: projectName,
            timestamp: new Date()
        }).catch(err => console.error('Error tracking activity:', err));
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    if (currentUser) {
        updateUserData({ 'preferences.theme': document.body.classList.contains('light-mode') ? 'light' : 'dark' });
    }
}

function checkNotifications() {
    if (currentUser && typeof db !== 'undefined') {
        db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const unreadCount = snapshot.size;
                if (unreadCount > 0) console.log(`You have ${unreadCount} unread notifications`);
            });
    }
}