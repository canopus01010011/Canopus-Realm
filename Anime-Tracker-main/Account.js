let currentUser = null;
let activeMessages = [];

const authModal = document.getElementById('auth-modal');
const userMenuPlaceholder = document.getElementById('user-menu-placeholder');
const userDropdown = document.getElementById('user-dropdown');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const signedOutView = document.getElementById('signed-out-view');
const signedInView = document.getElementById('signed-in-view');

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getStoredTheme());
    setupChrome();
    if (typeof auth === 'undefined') {
        console.warn('Firebase auth is not configured.');
        updateUIForAuth();
        showSignedOutView();
        return;
    }
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateUIForAuth();
        if (user) {
            showSignedInView();
            if (typeof onAuthReady === 'function') onAuthReady(user);
        } else {
            showSignedOutView();
        }
    });
});

function showSignedInView() {
    if (signedInView) signedInView.style.display = 'block';
    if (signedOutView) signedOutView.style.display = 'none';
}

function showSignedOutView() {
    if (signedInView) signedInView.style.display = 'none';
    if (signedOutView) signedOutView.style.display = 'block';
}

function updateUIForAuth() {
    if (!userMenuPlaceholder) return;
    if (currentUser) {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button"><i class="fas fa-user-circle"></i></button>`;
        const nameEl = document.getElementById('username-display');
        const emailEl = document.getElementById('useremail-display');
        if (nameEl) nameEl.textContent = currentUser.displayName || 'Otaku';
        if (emailEl) emailEl.textContent = currentUser.email || '';
        document.getElementById('user-menu-btn').addEventListener('click', toggleUserDropdown);
    } else {
        userMenuPlaceholder.innerHTML = `<button class="user-menu-btn" id="user-menu-btn" type="button">Login</button>`;
        document.getElementById('user-menu-btn').addEventListener('click', openAuthModal);
        if (userDropdown) userDropdown.classList.remove('active');
    }
}

function setupChrome() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40));
    if (hamburger) hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').classList.remove('active'));
    });
    document.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
        if (!e.target.closest('#user-menu-btn') && !e.target.closest('.user-dropdown')) {
            if (userDropdown) userDropdown.classList.remove('active');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAuthModal();
    });

    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.auth-tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.add('active');
            e.currentTarget.classList.add('active');
        });
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

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    const signedOutLoginBtn = document.getElementById('signed-out-login-btn');
    if (signedOutLoginBtn) signedOutLoginBtn.addEventListener('click', openAuthModal);

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}

function openAuthModal() { authModal.classList.add('active'); }
function closeAuthModal() { authModal.classList.remove('active'); }

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
            name, email,
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

function toggleUserDropdown() { userDropdown.classList.toggle('active'); }

function logout() {
    auth.signOut().then(() => {
        showMessage('Logged out successfully!', 'success');
        if (userDropdown) userDropdown.classList.remove('active');
        window.location.href = 'index.html';
    }).catch(error => showMessage(friendlyAuthError(error), 'error'));
}

function getStoredTheme() {
    return localStorage.getItem('canopus-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === 'light' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) darkModeToggle.checked = theme === 'dark';
}

function toggleTheme() {
    const next = getStoredTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('canopus-theme', next);
    applyTheme(next);
    if (currentUser && typeof db !== 'undefined') {
        db.collection('users').doc(currentUser.uid).set({ preferences: { theme: next } }, { merge: true })
            .catch(err => console.error('Error saving theme preference:', err));
    }
}

function showMessage(message, type = 'success') {
    if (activeMessages.length >= 3) activeMessages.shift().remove();
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.textContent = message;
    el.style.top = `${100 + activeMessages.length * 64}px`;
    document.body.appendChild(el);
    activeMessages.push(el);
    setTimeout(() => {
        el.remove();
        activeMessages = activeMessages.filter(m => m !== el);
        activeMessages.forEach((m, i) => { m.style.top = `${100 + i * 64}px`; });
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}