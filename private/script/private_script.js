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
            window.userRole = u.ruolo_id;
            const userNameEl = document.getElementById('userName');
            if (userNameEl) userNameEl.textContent = u.nome;
            const companyNameEl = document.getElementById('companyName');
            if (companyNameEl) companyNameEl.textContent = u.nome_azienda || '';
            const userRoleBadgeEl = document.getElementById('userRoleBadge');
            if (userRoleBadgeEl) userRoleBadgeEl.textContent = u.nome_ruolo;
            const welcomeMessageEl = document.getElementById('welcomeMessage');
            if (welcomeMessageEl) welcomeMessageEl.textContent =
                `Ciao ${u.nome.split(' ')[0]}, ecco la situazione della tua azienda.`;
        }

        // Fetch audit
        const auditRes = await fetch('/api/audit', { credentials: 'include' });
        const auditData = await auditRes.json();
        const tbody = document.querySelector('#auditTable tbody');
        tbody.innerHTML = '';

        if (auditData.success && auditData.data.length > 0) {
            const auditEmptyState = document.getElementById('auditEmptyState');
            if (auditEmptyState) auditEmptyState.classList.add('hidden');

            let completed = 0, inProgress = 0;
            auditData.data.forEach(a => {
                if (a.stato === 'Completato') completed++;
                else inProgress++;

                const date = new Date(a.data_inizio).toLocaleDateString('it-IT');
                const statusBadge = a.stato === 'Completato'
                    ? '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#4ae176]/20 text-[#4ae176]">Completato</span>'
                    : '<span class="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-error-container text-on-error-container">In Corso</span>';
                
                let action = a.stato === 'Completato'
                    ? `<a href="/private/report.html?id=${a.id}" class="font-label-md text-label-md text-primary-container hover:text-primary transition-colors flex items-center justify-end gap-1">Report <span class="material-symbols-outlined text-sm">arrow_forward</span></a>`
                    : '';
                
                if (a.stato === 'In corso' && window.userRole !== 3) {
                    action += `<a href="/private/audit.html?id=${a.id}" class="font-label-md text-label-md text-secondary hover:text-white transition-colors flex items-center justify-end gap-1">Riprendi <span class="material-symbols-outlined text-sm">play_arrow</span></a>`;
                }
                
                if (window.userRole === 1 || window.userRole === 2 || window.userRole === 4 || (window.userRole === 3 && a.stato === 'In corso')) {
                    action += `<button onclick="deleteAudit(${a.id})" class="ml-4 font-label-md text-label-md text-error hover:text-error-container transition-colors flex items-center justify-end gap-1" title="Elimina Audit"><span class="material-symbols-outlined text-sm">delete</span></button>`;
                }

                tbody.innerHTML += `<tr class="hover:bg-white/5 transition-colors group">
                    <td class="py-3 px-4 font-mono-data text-mono-data text-on-surface-variant text-sm border-l-2 border-transparent group-hover:border-primary-container">#${a.id}<br><span class="text-xs opacity-70">${date}</span></td>
                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface">${a.creato_da_nome}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 flex justify-end">${action}</td>
                </tr>`;
            });

            const statTotalAudit = document.getElementById('statTotalAudit');
            if (statTotalAudit) statTotalAudit.textContent = auditData.data.length;
            const statCompleted = document.getElementById('statCompleted');
            if (statCompleted) statCompleted.textContent = completed;
            const statInProgress = document.getElementById('statInProgress');
            if (statInProgress) statInProgress.textContent = inProgress;
        } else {
            const auditEmptyState = document.getElementById('auditEmptyState');
            if (auditEmptyState) auditEmptyState.classList.remove('hidden');
        }

        // Fetch utenti (solo Manager/Admin)
        // Gestione Utenti disponibile per tutti (Role 3 limitato in scrittura)
        if (window.userRole === 1 || window.userRole === 2 || window.userRole === 3 || window.userRole === 4) {
            const userRes = await fetch('/api/users', { credentials: 'include' });
            if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.success) {
                    const usersSection = document.getElementById('usersSection');
                    if (usersSection) {
                        usersSection.classList.remove('hidden');
                        const tabUsers = document.getElementById('tab-users');
                        if (tabUsers) tabUsers.classList.remove('hidden');
                        const mobTabUsers = document.getElementById('mob-tab-users');
                        if (mobTabUsers) mobTabUsers.style.display = 'flex';
                        
                        const createUserForm = document.getElementById('createUserForm');
                        const addUserTitle = document.getElementById('addUserTitle'); // Aggiungeremo questo ID all'H4
                        if (window.userRole === 3) {
                            if (createUserForm) createUserForm.classList.add('hidden');
                            if (addUserTitle) addUserTitle.classList.add('hidden');
                        }
                    }
                    const statUsers = document.getElementById('statUsers');
                    if (statUsers) statUsers.textContent = userData.data.length;
                    const uBody = document.querySelector('#usersTable tbody');
                    if (uBody) {
                        uBody.innerHTML = '';
                        userData.data.forEach(u => {
                            let roleBadge;
                            if (u.nome_ruolo === 'Il Dio Supremo') {
                                roleBadge = '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-purple-500/20 text-purple-400">Il Dio Supremo</span>';
                            } else if (u.nome_ruolo === 'Manager') {
                                roleBadge = '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-primary-container/20 text-primary">Manager</span>';
                            } else {
                                roleBadge = '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-surface-variant text-on-surface-variant">User</span>';
                            }
                            
                            let actions = '';
                            if (window.userRole !== 3) {
                                if (u.nome === 'Andrea Cova' || u.nome_ruolo === 'Il Dio Supremo') {
                                    actions = '<td class="py-3 px-4"></td>';
                                } else {
                                    actions = `
                                        <td class="py-3 px-4">
                                            <div class="flex justify-end gap-2">
                                                <button onclick="changeRole(${u.id}, '${u.nome_ruolo}')" class="font-label-md text-label-md text-primary hover:text-primary-container transition-colors" title="Cambia Ruolo">
                                                    <span class="material-symbols-outlined text-sm">autorenew</span>
                                                </button>
                                                <button onclick="deleteUser(${u.id})" class="font-label-md text-label-md text-error hover:text-error-container transition-colors" title="Elimina Utente">
                                                    <span class="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    `;
                                }
                            } else {
                                actions = '<td class="py-3 px-4"></td>';
                            }

                            const pIva = u.partita_iva ? (u.partita_iva.length > 10 ? u.partita_iva.substring(0, 10) + 'xxx...' : u.partita_iva) : '-';
                            uBody.innerHTML += `
                                <tr class="hover:bg-white/5 transition-colors">
                                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface">${u.nome}</td>
                                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">${u.email}</td>
                                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">${u.nome_azienda || '-'}</td>
                                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">${pIva}</td>
                                    <td class="py-3 px-4 font-body-sm text-body-sm text-on-surface-variant">${roleBadge}</td>
                                    ${actions}
                                </tr>
                            `;
                        });
                    }
                }
            } else {
                const usersSection = document.getElementById('usersSection');
                if (usersSection) usersSection.classList.add('hidden');
                const statUsers = document.getElementById('statUsers');
                if (statUsers) statUsers.parentElement.parentElement.classList.add('hidden');
            }
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
                if (window.userRole === 3) {
                    alert('Richiesta di nuovo audit accolta con successo');
                    initDashboard();
                } else {
                    window.location.href = `/private/audit.html?id=${result.audit_id}`;
                }
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
    if (!auditId) { goToDashboard(); return; }
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
                    <div class="glass-panel p-8 rounded-xl flex flex-col md:flex-row gap-8 items-start transition-all hover:border-outline-variant/30 mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-sm mb-sm">
                                <span class="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-label-sm text-label-sm">Q${index+1}</span>
                                <h4 class="font-headline-md text-headline-md text-on-surface">Domanda di Sicurezza</h4>
                            </div>
                            <p class="font-body-md text-body-md text-on-surface-variant mb-md">${q.domanda}</p>
                        </div>
                        <div class="w-full md:w-auto flex flex-col gap-sm shrink-0 custom-radio">
                            <input id="q${q.id}-yes" name="q_${q.id}" type="radio" value="yes" required/>
                            <label for="q${q.id}-yes">Yes, fully implemented</label>
                            
                            <input id="q${q.id}-partial" name="q_${q.id}" type="radio" value="partial"/>
                            <label for="q${q.id}-partial">No, partially implemented</label>
                            
                            <input id="q${q.id}-no" name="q_${q.id}" type="radio" value="no"/>
                            <label for="q${q.id}-no">No, absent</label>

                            <input id="q${q.id}-na" name="q_${q.id}" type="radio" value="na"/>
                            <label for="q${q.id}-na">Not Applicable</label>
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
    if (!auditId) { goToDashboard(); return; }

    try {
        const res = await fetch(`/api/report/${auditId}`, { credentials: 'include' });
        if (!res.ok) { goToDashboard(); return; }

        const result = await res.json();
        if (result.success) {
            document.getElementById('reportLoader').classList.add('hidden');
            document.getElementById('reportContent').classList.remove('hidden');
            document.getElementById('reportContent').classList.add('flex', 'flex-col');

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
                circle.classList.add('border-[#4ae176]', 'shadow-[0_0_30px_rgba(74,225,118,0.3)]');
                scoreValue.classList.add('text-[#4ae176]');
                msg.textContent = 'Livello di sicurezza ottimale. L\'infrastruttura è solida e allineata alle best practice.';
                msg.classList.add('text-[#4ae176]');
            } else if (report.punteggio_cyber_security >= 50) {
                circle.classList.add('border-[#ff6600]', 'shadow-[0_0_30px_rgba(255,102,0,0.3)]');
                scoreValue.classList.add('text-[#ff6600]');
                msg.textContent = 'Livello medio. Necessari miglioramenti e interventi di mitigazione sui punti evidenziati.';
                msg.classList.add('text-[#ff6600]');
            } else {
                circle.classList.add('border-[#ff4444]', 'shadow-[0_0_30px_rgba(255,68,68,0.3)]');
                scoreValue.classList.add('text-[#ff4444]');
                msg.textContent = 'Criticità elevata! Intervento immediato richiesto per proteggere i sistemi.';
                msg.classList.add('text-[#ff4444]');
            }

            const vulnList = document.getElementById('vulnList');
            const vulnArr = JSON.parse(report.vulnerabilita_rilevate);
            vulnList.innerHTML = '';
            vulnArr.forEach((v, idx) => {
                const isNone = v.includes('Nessuna');
                const badge = isNone 
                    ? `<span class="bg-[#4ae176]/20 px-sm py-xs rounded-full text-[#4ae176] font-label-sm text-label-sm border border-[#4ae176]/30">OK</span>`
                    : `<span class="bg-[#ff4444]/20 px-sm py-xs rounded-full text-[#ff4444] font-label-sm text-label-sm border border-[#ff4444]/30">RILEVATA</span>`;
                       
                vulnList.innerHTML += `
                <div class="bg-surface-container-low p-md rounded-2xl border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-sm">
                    <div class="flex items-center gap-sm">
                        ${badge}
                        <h4 class="font-label-md text-label-md text-on-surface">Vulnerabilità #${idx + 1}</h4>
                    </div>
                    <p class="text-on-surface-variant text-sm font-body-md pl-1">${v}</p>
                </div>`;
            });

            const gdprList = document.getElementById('gdprList');
            const gdprArr = JSON.parse(report.rischi_sanzionatori_gdpr);
            gdprList.innerHTML = '';
            gdprArr.forEach(g => {
                const isCompliance = g.includes('Compliance GDPR rispettata');
                const badge = isCompliance 
                    ? `<span class="bg-[#4ae176]/20 px-sm py-xs rounded-full text-[#4ae176] font-label-sm text-label-sm border border-[#4ae176]/30">Conformità</span>`
                    : `<span class="bg-[#ff4444]/20 px-sm py-xs rounded-full text-[#ff4444] font-label-sm text-label-sm border border-[#ff4444]/30">Rischio</span>`;
                
                gdprList.innerHTML += `
                <div class="bg-surface-container-low p-md rounded-2xl border border-white/5 hover:border-white/20 transition-colors flex flex-col gap-sm">
                    <div class="flex items-center gap-sm">
                        ${badge}
                        <h4 class="font-label-md text-label-md text-on-surface">${isCompliance ? 'Valutazione OK' : 'Violazione Potenziale'}</h4>
                    </div>
                    <p class="text-on-surface-variant text-sm font-body-md pl-1">${g}</p>
                </div>`;
            });
        }
    } catch (e) {
        console.error('Errore caricamento report:', e);
    }
}

// ---- Utility Globali ----
async function goToDashboard(e) {
    if (e) e.preventDefault();
    try {
        const profileRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            if (profile.success) {
                const role = profile.data.ruolo_id;
                if (role === 1 || role === 2 || role === 3) {
                    window.location.href = '/private/dashboard_manager.html';
                }
                return;
            }
        }
    } catch (err) {}
    window.location.href = '/login.html';
}

async function deleteAudit(id) {
    if (!confirm('Sei sicuro di voler eliminare questo audit?')) return;
    try {
        const res = await fetch(`/api/audit/${id}`, { method: 'DELETE', credentials: 'include' });
        const result = await res.json();
        if (result.success) {
            alert('Audit eliminato con successo.');
            initDashboard();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert("Errore di connessione durante l'eliminazione.");
    }
}

// ---- Gestione Tab ----
window.switchView = function(viewName) {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewUsers = document.getElementById('view-users');
    const viewDocumenti = document.getElementById('view-documenti');
    
    const tabDashboard = document.getElementById('tab-dashboard');
    const tabUsers = document.getElementById('tab-users');
    const tabDocumenti = document.getElementById('tab-documenti');
    
    if (!viewDashboard || !viewUsers || !viewDocumenti) return;

    // Nascondi tutti
    viewDashboard.classList.add('hidden');
    viewUsers.classList.add('hidden');
    viewDocumenti.classList.add('hidden');
    
    // Resetta classi tab
    [tabDashboard, tabUsers, tabDocumenti].forEach(t => {
        if (!t) return;
        t.classList.remove('bg-primary/10', 'text-primary', 'border-primary');
        t.classList.add('text-on-surface-variant', 'border-transparent');
    });

    if (viewName === 'dashboard') {
        viewDashboard.classList.remove('hidden');
        if (tabDashboard) {
            tabDashboard.classList.add('bg-primary/10', 'text-primary', 'border-primary');
            tabDashboard.classList.remove('text-on-surface-variant', 'border-transparent');
        }
    } else if (viewName === 'users') {
        viewUsers.classList.remove('hidden');
        if (tabUsers) {
            tabUsers.classList.add('bg-primary/10', 'text-primary', 'border-primary');
            tabUsers.classList.remove('text-on-surface-variant', 'border-transparent');
        }
    } else if (viewName === 'documenti') {
        viewDocumenti.classList.remove('hidden');
        if (tabDocumenti) {
            tabDocumenti.classList.add('bg-primary/10', 'text-primary', 'border-primary');
            tabDocumenti.classList.remove('text-on-surface-variant', 'border-transparent');
        }
        renderDocumenti();
    }
};

window.renderDocumenti = function() {
    // Audit data è caricato in initDashboard(), lo peschiamo se necessario rifacendo fetch oppure lo si salva globale.
    // Facciamo prima a fare una fetch dedicata
    fetch('/api/audit', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('documentiContainer');
            if (!container) return;
            container.innerHTML = '';
            
            if (!data.success || data.data.length === 0) {
                container.innerHTML = '<p class="text-on-surface-variant">Nessun documento trovato.</p>';
                return;
            }
            
            const completati = data.data.filter(a => a.stato === 'Completato');
            if (completati.length === 0) {
                container.innerHTML = '<p class="text-on-surface-variant">Nessun audit completato al momento.</p>';
                return;
            }

            if (window.userRole === 3) {
                // Semplice lista
                completati.forEach(a => {
                    const date = new Date(a.data_inizio).toLocaleDateString('it-IT');
                    container.innerHTML += `
                        <div class="flex items-center justify-between p-4 bg-surface-container/50 border border-white/5 rounded">
                            <div class="flex flex-col">
                                <span class="font-label-md text-on-surface">Audit #${a.id}</span>
                                <span class="font-label-sm text-on-surface-variant text-xs">${date} - ${a.creato_da_nome}</span>
                            </div>
                            <a href="/private/report.html?id=${a.id}" class="text-primary hover:text-primary-container font-bold text-sm">Vedi Report</a>
                        </div>
                    `;
                });
            } else {
                // Manager: Raggruppa per azienda
                const gruppi = {};
                completati.forEach(a => {
                    const azienda = a.nome_azienda || 'Azienda Sconosciuta';
                    if (!gruppi[azienda]) gruppi[azienda] = [];
                    gruppi[azienda].push(a);
                });
                
                Object.keys(gruppi).forEach(azienda => {
                    const htmlAudits = gruppi[azienda].map(a => `
                        <div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0 pl-6">
                            <span class="text-sm text-on-surface-variant">Audit #${a.id} - ${new Date(a.data_inizio).toLocaleDateString('it-IT')}</span>
                            <a href="/private/report.html?id=${a.id}" class="text-[#4ae176] hover:opacity-70 text-xs uppercase font-bold">Apri</a>
                        </div>
                    `).join('');
                    
                    container.innerHTML += `
                        <details class="bg-surface-container border border-white/5 rounded mb-2 overflow-hidden group">
                            <summary class="p-4 cursor-pointer font-label-md text-on-surface flex items-center gap-2 group-open:bg-surface-container-high transition-colors">
                                <span class="material-symbols-outlined text-primary group-open:text-on-surface">folder</span>
                                ${azienda} (${gruppi[azienda].length})
                            </summary>
                            <div class="p-4 bg-surface-container/30">
                                ${htmlAudits}
                            </div>
                        </details>
                    `;
                });
            }
        });
};

// ---- Gestione Audit ----
window.deleteAudit = async function(id) {
    if (!confirm('Sei sicuro di voler eliminare questo audit?')) return;
    try {
        const res = await fetch(`/api/audit/${id}`, { method: 'DELETE', credentials: 'include' });
        const result = await res.json();
        if (result.success) {
            alert('Audit eliminato.');
            initDashboard();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert('Errore di connessione.');
    }
};

// ---- Gestione Utenti ----
window.deleteUser = async function(id) {
    if (!confirm('Sei sicuro di voler eliminare questo utente dal tuo team?')) return;
    try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
        const result = await res.json();
        if (result.success) {
            alert('Utente eliminato.');
            initDashboard();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert('Errore di connessione.');
    }
};

window.changeRole = async function(id, currentRole) {
    const newRole = currentRole === 'Manager' ? 'User' : 'Manager';
    if (!confirm(`Vuoi cambiare il ruolo di questo utente a ${newRole}?`)) return;
    try {
        const res = await fetch(`/api/users/${id}/role`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nuovo_ruolo: newRole })
        });
        const result = await res.json();
        if (result.success) {
            alert('Ruolo aggiornato.');
            initDashboard();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert('Errore di connessione.');
    }
};
