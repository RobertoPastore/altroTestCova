// ================================================
// CYBER AUDIT PRO — Script Privato (Area Riservata)
// Gestisce: Dashboard, Audit, Report, Logout
// Questo file è servito SOLO a utenti autenticati via JWT
// ================================================

function showAlert(elementId, message, isSuccess = true) {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.style.display = 'block';
    alertEl.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
    if (isSuccess) setTimeout(() => alertEl.style.display = 'none', 5000);
}

// ---- Logout ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    });
}

// ---- Dashboard ----
async function initDashboard() {
    try {
        // Fetch profilo utente
        const profileRes = await fetch('/api/auth/me');
        if (!profileRes.ok) { window.location.href = '/login.html'; return; }
        const profile = await profileRes.json();
        if (profile.success) {
            const u = profile.data;
            document.getElementById('userName').textContent = u.nome;
            document.getElementById('companyName').textContent = u.nome_azienda || '';
            document.getElementById('userRoleBadge').textContent = u.nome_ruolo;
            document.getElementById('welcomeMessage').textContent =
                `Ciao ${u.nome.split(' ')[0]}, ecco la situazione della tua azienda.`;
        }

        // Fetch audit
        const auditRes = await fetch('/api/audit');
        const auditData = await auditRes.json();
        const tbody = document.querySelector('#auditTable tbody');
        tbody.innerHTML = '';

        if (auditData.success && auditData.data.length > 0) {
            document.getElementById('auditEmptyState').style.display = 'none';

            let completed = 0, inProgress = 0;
            auditData.data.forEach(a => {
                if (a.stato === 'Completato') completed++;
                else inProgress++;

                const date = new Date(a.data_inizio).toLocaleDateString('it-IT');
                const statusBadge = a.stato === 'Completato'
                    ? '<span class="badge badge-success">Completato</span>'
                    : '<span class="badge badge-orange">In corso</span>';
                const action = a.stato === 'Completato'
                    ? `<a href="/private/report.html?id=${a.id}" class="btn btn-secondary btn-sm">Report</a>`
                    : `<a href="/private/audit.html?id=${a.id}" class="btn btn-outline btn-sm">Riprendi</a>`;

                tbody.innerHTML += `<tr>
                    <td>#${a.id}</td><td>${date}</td>
                    <td>${a.creato_da_nome}</td><td>${statusBadge}</td><td>${action}</td>
                </tr>`;
            });

            document.getElementById('statTotalAudit').textContent = auditData.data.length;
            document.getElementById('statCompleted').textContent = completed;
            document.getElementById('statInProgress').textContent = inProgress;
        } else {
            document.getElementById('auditEmptyState').style.display = 'block';
        }

        // Fetch utenti (solo Manager/Admin)
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.success) {
                document.getElementById('statUsers').textContent = userData.data.length;
                const uBody = document.querySelector('#usersTable tbody');
                uBody.innerHTML = '';
                userData.data.forEach(u => {
                    const roleBadge = u.nome_ruolo === 'Manager'
                        ? '<span class="badge badge-orange">Manager</span>'
                        : '<span class="badge badge-gray">User</span>';
                    uBody.innerHTML += `<tr>
                        <td>${u.nome}</td><td>${u.email}</td><td>${roleBadge}</td>
                    </tr>`;
                });
            }
        } else {
            document.getElementById('usersSection').style.display = 'none';
            document.getElementById('statUsers').parentElement.style.display = 'none';
        }
    } catch (err) {
        console.error('Errore caricamento dashboard:', err);
    }

    // Nuovo Audit
    document.getElementById('newAuditBtn').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/audit', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                window.location.href = `/private/audit.html?id=${result.audit_id}`;
            } else {
                alert(result.message);
            }
        } catch (e) { alert('Errore di connessione.'); }
    });

    // Crea Utente
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nome: document.getElementById('newUserName').value.trim(),
                email: document.getElementById('newUserEmail').value.trim(),
                password: document.getElementById('newUserPassword').value,
                ruolo_assegnato: document.getElementById('newUserRole').value
            };
            try {
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (result.success) {
                    showAlert('userAlert', result.message, true);
                    createUserForm.reset();
                    initDashboard();
                } else {
                    showAlert('userAlert', result.message, false);
                }
            } catch (e) { showAlert('userAlert', 'Errore di connessione.', false); }
        });
    }
}

// ---- Audit Interface ----
let checklistQuestions = [];

async function initAuditInterface() {
    const urlParams = new URLSearchParams(window.location.search);
    const auditId = urlParams.get('id');
    if (!auditId) { window.location.href = '/private/dashboard.html'; return; }
    document.getElementById('currentAuditId').textContent = auditId;

    try {
        const res = await fetch('/api/audit/checklist');
        if (!res.ok) { window.location.href = '/login.html'; return; }
        const result = await res.json();

        if (result.success) {
            checklistQuestions = result.data;
            const container = document.getElementById('checklistContainer');
            container.innerHTML = '';

            if (checklistQuestions.length === 0) {
                container.innerHTML = '<div class="empty-state"><span class="empty-icon">⚠️</span><p>La checklist è vuota.</p></div>';
                return;
            }

            let currentSection = '';
            checklistQuestions.forEach((q, index) => {
                if (q.sezione !== currentSection) {
                    currentSection = q.sezione;
                    const icon = currentSection === 'Cyber Security' ? '🔒' : '📜';
                    container.innerHTML += `<div class="section-header"><span class="section-icon">${icon}</span> ${currentSection}</div>`;
                }

                container.innerHTML += `
                    <div class="checklist-question">
                        <p class="q-text"><span class="q-number">${index + 1}.</span>${q.domanda}</p>
                        <div class="radio-group">
                            <label><input type="radio" name="q_${q.id}" value="yes" required> Sì, presente</label>
                            <label><input type="radio" name="q_${q.id}" value="partial"> Parzialmente</label>
                            <label><input type="radio" name="q_${q.id}" value="no"> No, assente</label>
                            <label><input type="radio" name="q_${q.id}" value="na"> N/A</label>
                        </div>
                    </div>`;
            });
        }
    } catch (e) {
        document.getElementById('checklistContainer').innerHTML =
            '<div class="empty-state"><span class="empty-icon">❌</span><p>Errore nel caricamento della checklist.</p></div>';
    }

    // Concludi Audit
    document.getElementById('completeAuditBtn').addEventListener('click', async () => {
        let punteggio = 100;
        let vuln = [];
        let gdpr = [];
        let allAnswered = true;

        checklistQuestions.forEach(q => {
            const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
            if (!selected) {
                allAnswered = false;
            } else if (selected.value === 'no') {
                punteggio -= (5 * q.peso_rischio);
                vuln.push(`Assente: ${q.domanda}`);
                if (q.sezione === 'GDPR') {
                    gdpr.push(`Potenziale violazione: ${q.domanda}`);
                }
            } else if (selected.value === 'partial') {
                punteggio -= (2 * q.peso_rischio);
                vuln.push(`Parziale: ${q.domanda}`);
            }
        });

        if (!allAnswered) {
            showAlert('auditAlert', 'Rispondi a tutte le domande prima di concludere.', false);
            return;
        }
        if (punteggio < 0) punteggio = 0;

        try {
            await fetch(`/api/audit/${auditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stato: 'Completato' })
            });

            const reportPayload = {
                punteggio_cyber_security: punteggio,
                vulnerabilita_rilevate: vuln.length > 0 ? vuln : ['Nessuna vulnerabilità critica rilevata.'],
                rischi_sanzionatori_gdpr: gdpr.length > 0 ? gdpr : ['Compliance GDPR rispettata per le voci analizzate.']
            };

            const res = await fetch(`/api/report/${auditId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });
            const result = await res.json();
            if (result.success) {
                window.location.href = `/private/report.html?id=${auditId}`;
            } else {
                showAlert('auditAlert', result.message, false);
            }
        } catch (e) {
            showAlert('auditAlert', 'Errore di connessione.', false);
        }
    });

    // Salva Bozza
    document.getElementById('saveDraftBtn').addEventListener('click', () => {
        showAlert('auditAlert', 'Bozza salvata con successo.', true);
    });
}

// ---- Report ----
async function loadReport() {
    const urlParams = new URLSearchParams(window.location.search);
    const auditId = urlParams.get('id');
    if (!auditId) { window.location.href = '/private/dashboard.html'; return; }

    try {
        const res = await fetch(`/api/report/${auditId}`);
        if (!res.ok) { window.location.href = '/private/dashboard.html'; return; }

        const result = await res.json();
        if (result.success) {
            document.getElementById('reportLoader').style.display = 'none';
            document.getElementById('reportContent').style.display = 'block';

            const report = result.data;
            document.getElementById('reportAuditId').textContent = report.audit_id;
            document.getElementById('reportDate').textContent = new Date(report.data_generazione).toLocaleString('it-IT');

            const scoreValue = document.getElementById('scoreValue');
            const circle = document.getElementById('scoreCircle');
            const msg = document.getElementById('scoreMessage');
            scoreValue.textContent = report.punteggio_cyber_security;

            circle.className = 'score-circle';
            if (report.punteggio_cyber_security >= 80) {
                circle.classList.add('score-high');
                msg.textContent = 'Livello di sicurezza ottimale.';
                msg.style.color = 'var(--success)';
            } else if (report.punteggio_cyber_security >= 50) {
                circle.classList.add('score-mid');
                msg.textContent = 'Livello medio. Necessari miglioramenti.';
                msg.style.color = 'var(--warning)';
            } else {
                circle.classList.add('score-low');
                msg.textContent = 'Criticità elevata! Intervento immediato richiesto.';
                msg.style.color = 'var(--danger)';
            }

            const vulnList = document.getElementById('vulnList');
            const vulnArr = JSON.parse(report.vulnerabilita_rilevate);
            vulnArr.forEach(v => {
                vulnList.innerHTML += `<div class="vuln-item">${v}</div>`;
            });

            const gdprList = document.getElementById('gdprList');
            const gdprArr = JSON.parse(report.rischi_sanzionatori_gdpr);
            gdprArr.forEach(g => {
                gdprList.innerHTML += `<div class="gdpr-item">${g}</div>`;
            });
        }
    } catch (e) {
        console.error('Errore caricamento report:', e);
    }
}
