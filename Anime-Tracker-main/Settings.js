
async function onAuthReady(user) {
    document.getElementById('display-name-input').value = user.displayName || '';
    document.getElementById('email-input').value = user.email || '';

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.checked = getStoredTheme() === 'dark';
    darkModeToggle.addEventListener('change', () => {
        const next = darkModeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('canopus-theme', next);
        applyTheme(next);
        db.collection('users').doc(user.uid).set({ preferences: { theme: next } }, { merge: true })
            .catch(err => console.error('Error saving theme preference:', err));
    });

    try {
        const doc = await db.collection('users').doc(user.uid).get();
        const prefs = doc.exists ? doc.data()?.preferences : null;
        if (prefs?.theme && prefs.theme !== getStoredTheme()) {
            localStorage.setItem('canopus-theme', prefs.theme);
            applyTheme(prefs.theme);
            darkModeToggle.checked = prefs.theme === 'dark';
        }
        const notifToggle = document.getElementById('notif-toggle');
        if (prefs && typeof prefs.notifications === 'boolean') notifToggle.checked = prefs.notifications;
        notifToggle.addEventListener('change', () => {
            db.collection('users').doc(user.uid).set({
                preferences: { notifications: notifToggle.checked }
            }, { merge: true }).catch(err => console.error('Error saving notification preference:', err));
            showMessage(notifToggle.checked ? 'Notifications turned on.' : 'Notifications turned off.', 'success');
        });
    } catch (error) {
        console.error('Error loading preferences:', error);
    }

    document.getElementById('profile-form').addEventListener('submit', (e) => handleProfileSave(e, user));
    document.getElementById('reset-password-btn').addEventListener('click', () => handlePasswordReset(user));
    document.getElementById('delete-account-btn').addEventListener('click', () => handleDeleteAccount(user));
}

async function handleProfileSave(e, user) {
    e.preventDefault();
    const nameInput = document.getElementById('display-name-input');
    const name = nameInput.value.trim();
    if (name.length < 2) {
        showMessage('Please enter a display name of at least 2 characters.', 'warning');
        return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        await user.updateProfile({ displayName: name });
        await db.collection('users').doc(user.uid).set({ name }, { merge: true });
        showMessage('Profile updated!', 'success');
    } catch (error) {
        showMessage(friendlyAuthError(error), 'error');
    } finally {
        btn.disabled = false;
    }
}

function handlePasswordReset(user) {
    if (!user.email) return;
    auth.sendPasswordResetEmail(user.email)
        .then(() => showMessage(`Password reset email sent to ${user.email}.`, 'success'))
        .catch(err => showMessage(friendlyAuthError(err), 'error'));
}

async function handleDeleteAccount(user) {
    const confirmed = confirm(
        'This permanently deletes your Canopus account. Your anime list will be removed. This cannot be undone. Continue?'
    );
    if (!confirmed) return;

    const btn = document.getElementById('delete-account-btn');
    btn.disabled = true;
    try {
      
        const listSnapshot = await db.collection('users').doc(user.uid).collection('anime-list').get();
        const batch = db.batch();
        listSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(db.collection('users').doc(user.uid));
        await batch.commit();

        await user.delete();
        showMessage('Your account has been deleted.', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            showMessage('For your security, please log out and log back in, then try deleting again.', 'warning');
        } else {
            showMessage(friendlyAuthError(error), 'error');
        }
    } finally {
        btn.disabled = false;
    }
}