// ================================================
// CYBER AUDIT PRO — Script Privato (Area Riservata)
// Gestisce: Dashboard, Audit, Report, Logout
// Questo file è servito SOLO a utenti autenticati via JWT
// ================================================

function showAlert(elementId, message, isSuccess = true) {
    const alertEl = document.getElementById(elementId);
    if (!alertEl) return;
    alertEl.textContent = message;
    
    // Rimuoviamo classi di successo/errore preesistenti
    alertEl.classList.remove('bg-error-container/20', 'border-error-container/50', 'text-error-container');
    alertEl.classList.remove('bg-tertiary/20', 'border-tertiary/50', 'text-tertiary');
    
    // Aggiungiamo le classi corrette
    if (isSuccess) {
        alertEl.classList.add('bg-tertiary/20', 'border-tertiary/50', 'text-tertiary');
    } else {
        alertEl.classList.add('bg-error-container/20', 'border-error-container/50', 'text-error-container');
    }
    
    alertEl.classList.remove('hidden');
    if (isSuccess) setTimeout(() => alertEl.classList.add('hidden'), 5000);
}

// ---- Logout ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/login.html';
    });
}

// ---- Dashboard ----
async function initDashboard() {
    try {
        // Fetch profilo utente
        const profileRes = await fetch('/api/auth/me', { credentials: 'include' });
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
        const auditRes = await fetch('/api/audit', { credentials: 'include' });
        const auditData = await auditRes.json();
        const tbody = document.querySelector('#auditTable tbody');
        tbody.innerHTML = '';

        if (auditData.success && auditData.data.length > 0) {
            document.getElementById('auditEmptyState').classList.add('hidden');

            let completed = 0, inProgress = 0;
            auditData.data.forEach(a => {
                if (a.stato === 'Completato') completed++;
                else inProgress++;

                const date = new Date(a.data_inizio).toLocaleDateString('it-IT');
                const statusBadge = a.stato === 'Completato'
                    ? '<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-tertiary/20 text-tertiary">Completato</span>'
                    : '<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-error-container text-on-error-container">In Corso</span>';
                const action = a.stato === 'Completato'
                    ? `<a href="/private/report.html?id=${a.id}" class="font-label-md text-label-md text-primary-container hover:text-primary transition-colors flex items-center justify-end gap-1">Report <span class="material-symbols-outlined text-sm">arrow_forward</span></a>`
                    : `<a href="/private/audit.html?id=${a.id}" class="font-label-md text-label-md text-secondary hover:text-white transition-colors flex items-center justify-end gap-1">Riprendi <span class="material-symbols-outlined text-sm">play_arrow</span></a>`;

                tbody.innerHTML += `<tr class="hover:bg-white/5 transition-colors group">
                    <td class="py-3 px-4 font-mono-data text-mono-data text-on-surface-variant text-sm border-l-2 border-transparent group-hover:border-primary-container">#${a.id}<br><span class="text-xs opacity-70">${date}</span></td>
                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface">${a.creato_da_nome}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-right">${action}</td>
                </tr>`;
            });

            document.getElementById('statTotalAudit').textContent = auditData.data.length;
            document.getElementById('statCompleted').textContent = completed;
            document.getElementById('statInProgress').textContent = inProgress;
        } else {
            document.getElementById('auditEmptyState').classList.remove('hidden');
        }

        // Fetch utenti (solo Manager/Admin)
        const userRes = await fetch('/api/users', { credentials: 'include' });
        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.success) {
                document.getElementById('usersSection').classList.remove('hidden');
                document.getElementById('statUsers').textContent = userData.data.length;
                const uBody = document.querySelector('#usersTable tbody');
                uBody.innerHTML = '';
                userData.data.forEach(u => {
                    const roleBadge = u.nome_ruolo === 'Manager'
                        ? '<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-primary-container/20 text-primary">Manager</span>'
                        : '<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-surface-variant text-on-surface-variant">User</span>';
                    uBody.innerHTML += `<tr class="hover:bg-white/5 transition-colors">
                        <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface">${u.nome}</td>
                        <td class="py-3 px-4 font-mono-data text-mono-data text-on-surface-variant text-sm">${u.email}</td>
                        <td class="py-3 px-4">${roleBadge}</td>
                    </tr>`;
                });
            }
        } else {
            document.getElementById('usersSection').classList.add('hidden');
            document.getElementById('statUsers').parentElement.parentElement.classList.add('hidden');
        }
    } catch (err) {
        console.error('Errore caricamento dashboard:', err);
    }

    // Nuovo Audit
    document.getElementById('newAuditBtn').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/audit', { method: 'POST', credentials: 'include' });
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
                    credentials: 'include',
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
        const res = await fetch('/api/audit/checklist', { credentials: 'include' });
        if (!res.ok) { window.location.href = '/login.html'; return; }
        const result = await res.json();

        if (result.success) {
            checklistQuestions = result.data;
            const container = document.getElementById('checklistContainer');
            container.innerHTML = '';

            if (checklistQuestions.length === 0) {
                container.innerHTML = `
                <div class="text-center py-10">
                    <div class="w-16 h-16 rounded-full bg-surface-variant/30 flex items-center justify-center text-on-surface-variant mx-auto mb-4">
                        <span class="material-symbols-outlined text-3xl">warning</span>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant">La checklist è vuota.</p>
                </div>`;
                return;
            }

            let currentSection = '';
            checklistQuestions.forEach((q, index) => {
                if (q.sezione !== currentSection) {
                    currentSection = q.sezione;
                    const icon = currentSection === 'Cyber Security' ? 'security' : 'gavel';
                    container.innerHTML += `
                    <div class="mt-8 mb-4">
                        <h3 class="font-headline-md text-headline-md text-inverse-surface flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">${icon}</span> ${currentSection}
                        </h3>
                    </div>`;
                }

                container.innerHTML += `
                    <div class="glass-panel p-6 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-6 relative bg-surface-container-high/40 border border-white/5">
                        <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-primary-container"></div>
                        <div class="flex-1 pl-2">
                            <h4 class="font-body-lg text-body-lg text-on-surface mb-1">
                                <span class="text-primary font-bold mr-2">${index + 1}.</span>${q.domanda}
                            </h4>
                        </div>
                        <div class="flex flex-wrap gap-2 md:gap-3 custom-radio shrink-0">
                            <div>
                                <input id="q${q.id}-yes" name="q_${q.id}" type="radio" value="yes" required/>
                                <label class="radio-yes" for="q${q.id}-yes">Sì</label>
                            </div>
                            <div>
                                <input id="q${q.id}-partial" name="q_${q.id}" type="radio" value="partial"/>
                                <label class="radio-partial" for="q${q.id}-partial">Parziale</label>
                            </div>
                            <div>
                                <input id="q${q.id}-no" name="q_${q.id}" type="radio" value="no"/>
                                <label class="radio-no" for="q${q.id}-no">No</label>
                            </div>
                            <div>
                                <input id="q${q.id}-na" name="q_${q.id}" type="radio" value="na"/>
                                <label class="radio-na" for="q${q.id}-na">N/A</label>
                            </div>
                        </div>
                    </div>`;
            });
        }
    } catch (e) {
        document.getElementById('checklistContainer').innerHTML =
            '<div class="text-center py-10"><div class="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center text-error mx-auto mb-4"><span class="material-symbols-outlined text-3xl">error</span></div><p class="font-body-sm text-body-sm text-error">Errore nel caricamento della checklist.</p></div>';
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
                credentials: 'include',
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
                credentials: 'include',
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
        const res = await fetch(`/api/report/${auditId}`, { credentials: 'include' });
        if (!res.ok) { window.location.href = '/private/dashboard.html'; return; }

        const result = await res.json();
        if (result.success) {
            document.getElementById('reportLoader').classList.add('hidden');
            document.getElementById('reportContent').classList.remove('hidden');
            document.getElementById('reportContent').classList.add('flex');

            const report = result.data;
            document.getElementById('reportAuditId').textContent = report.audit_id;
            document.getElementById('reportDate').textContent = new Date(report.data_generazione).toLocaleString('it-IT');

            const scoreValue = document.getElementById('scoreValue');
            const circle = document.getElementById('scoreCircle');
            const msg = document.getElementById('scoreMessage');
            scoreValue.textContent = report.punteggio_cyber_security;

            circle.className = 'w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.5)]';
            msg.className = 'font-body-lg text-body-lg max-w-2xl leading-relaxed';
            
            if (report.punteggio_cyber_security >= 80) {
                circle.classList.add('border-tertiary', 'shadow-tertiary/20');
                scoreValue.classList.add('text-tertiary');
                msg.textContent = 'Livello di sicurezza ottimale. L\'infrastruttura è solida e allineata alle best practice.';
                msg.classList.add('text-tertiary');
            } else if (report.punteggio_cyber_security >= 50) {
                circle.classList.add('border-primary-container', 'shadow-primary-container/20');
                scoreValue.classList.add('text-primary-container');
                msg.textContent = 'Livello medio. Necessari miglioramenti e interventi di mitigazione sui punti evidenziati.';
                msg.classList.add('text-primary-container');
            } else {
                circle.classList.add('border-error', 'shadow-error/20');
                scoreValue.classList.add('text-error');
                msg.textContent = 'Criticità elevata! Intervento immediato richiesto per proteggere i sistemi.';
                msg.classList.add('text-error');
            }

            const vulnList = document.getElementById('vulnList');
            const vulnArr = JSON.parse(report.vulnerabilita_rilevate);
            vulnList.innerHTML = '';
            vulnArr.forEach((v, idx) => {
                const isNone = v.includes('Nessuna');
                const badge = isNone 
                    ? `<div class="flex items-center gap-2 bg-tertiary/20 px-2 py-1 rounded w-max border border-tertiary/30">
                           <span class="w-2 h-2 bg-tertiary rounded-full"></span>
                           <span class="font-mono-data text-[12px] text-tertiary">OK</span>
                       </div>`
                    : `<div class="flex items-center gap-2 bg-error-container/20 px-2 py-1 rounded w-max border border-error-container/30">
                           <span class="w-2 h-2 bg-error rounded-full shadow-[0_0_8px_rgba(255,180,171,0.8)]"></span>
                           <span class="font-mono-data text-[12px] text-error">RILEVATA</span>
                       </div>`;
                       
                vulnList.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors group">
                    <td class="p-4 font-mono-data text-mono-data text-inverse-surface">${idx + 1}</td>
                    <td class="p-4 max-w-md text-on-surface-variant group-hover:text-on-surface transition-colors">${v}</td>
                    <td class="p-4">${badge}</td>
                </tr>`;
            });

            const gdprList = document.getElementById('gdprList');
            const gdprArr = JSON.parse(report.rischi_sanzionatori_gdpr);
            gdprList.innerHTML = '';
            gdprArr.forEach(g => {
                const isCompliance = g.includes('Compliance GDPR rispettata');
                const badgeColor = isCompliance ? 'text-tertiary' : 'text-primary';
                const borderColor = isCompliance ? 'border-tertiary/20' : 'border-primary/20';
                const leftLineColor = isCompliance ? 'bg-tertiary' : 'bg-primary';
                const icon = isCompliance ? 'check_circle' : 'warning';
                
                gdprList.innerHTML += `
                <div class="bg-[#1e130d]/80 backdrop-blur-[12px] border-t border-l ${borderColor} rounded p-6 relative overflow-hidden">
                    <div class="absolute left-0 top-0 bottom-0 w-[3px] ${leftLineColor}"></div>
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-headline-md text-[18px] ${badgeColor}">${isCompliance ? 'Conformità' : 'Rischio Identificato'}</h4>
                        <span class="material-symbols-outlined ${badgeColor}">${icon}</span>
                    </div>
                    <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">${g}</p>
                    ${isCompliance ? '' : `
                    <div class="flex items-center gap-2 font-mono-data text-[12px] text-error-container bg-error/10 px-3 py-1 rounded inline-flex">
                        <span class="material-symbols-outlined" style="font-size: 14px;">gavel</span>
                        Violazione Potenziale
                    </div>`}
                </div>`;
            });
        }
    } catch (e) {
        console.error('Errore caricamento report:', e);
    }
}
