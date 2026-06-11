// ================================================
// CYBER AUDIT PRO — Script Pubblico
// Gestisce: Subscribe (register.html) e Login (login.html)
// ================================================

function showAlert(elementId, message, isSuccess = true) {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.style.display = 'block';
    alertEl.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
    if (isSuccess) setTimeout(() => alertEl.style.display = 'none', 5000);
}

// ---- Subscribe (register.html) ----
const subscribeForm = document.getElementById('subscribeForm');
if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loader = document.getElementById('subscribeLoader');
        if (loader) loader.style.display = 'inline-block';

        const data = {
            nome_azienda: document.getElementById('nome_azienda').value.trim(),
            partita_iva: document.getElementById('partita_iva').value.trim(),
            nome_utente: document.getElementById('nome_utente').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const res = await fetch('/api/auth/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                showAlert('subscribeAlert', 'Account creato con successo! Reindirizzamento...', true);
                setTimeout(() => window.location.href = '/login.html', 1500);
            } else {
                showAlert('subscribeAlert', result.message, false);
            }
        } catch (err) {
            showAlert('subscribeAlert', 'Errore di connessione al server.', false);
        } finally {
            if (loader) loader.style.display = 'none';
        }
    });
}

// ---- Login (login.html) ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loader = document.getElementById('loginLoader');
        if (loader) loader.style.display = 'inline-block';

        const data = {
            email: document.getElementById('loginEmail').value.trim(),
            password: document.getElementById('loginPassword').value
        };

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                // Dopo il login, redirect alla dashboard (area privata)
                window.location.href = '/private/dashboard.html';
            } else {
                showAlert('loginAlert', result.message, false);
            }
        } catch (err) {
            showAlert('loginAlert', 'Errore di connessione al server.', false);
        } finally {
            if (loader) loader.style.display = 'none';
        }
    });
}
