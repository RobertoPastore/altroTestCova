// --- IMPORTS ---
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mia_chiave_super_segreta';

// Configurazione base Express
app.use(express.json());
app.use(cookieParser());

// Utility Hashing
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// --- DB CONNECTION ---
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'audit_db',
    waitForConnections: true,
    connectionLimit: 10
});

// Init Roles DB
(async function initRoles() {
    try {
        const [ruoli] = await pool.promise().execute('SELECT id FROM ruoli WHERE nome_ruolo = "Il Dio Supremo"');
        let dioSupremoId;
        if (ruoli.length === 0) {
            const [res] = await pool.promise().execute('INSERT INTO ruoli (nome_ruolo) VALUES ("Il Dio Supremo")');
            dioSupremoId = res.insertId;
        } else {
            dioSupremoId = ruoli[0].id;
        }
        await pool.promise().execute('UPDATE utenti SET ruolo_id = ? WHERE nome = "Andrea Cova"', [dioSupremoId]);
        console.log("Ruolo Il Dio Supremo configurato correttamente per Andrea Cova (ID:", dioSupremoId, ")");
    } catch (e) {
        console.error("Errore Init Roles DB:", e);
    }
})();

// Endpoint manuale per forzare l'aggiornamento se il demone non lo prende
app.get('/api/fix-role', async (req, res) => {
    try {
        const [ruoli] = await pool.promise().execute('SELECT id FROM ruoli WHERE nome_ruolo = "Il Dio Supremo"');
        let dioId = ruoli.length ? ruoli[0].id : (await pool.promise().execute('INSERT INTO ruoli (nome_ruolo) VALUES ("Il Dio Supremo")'))[0].insertId;
        await pool.promise().execute('UPDATE utenti SET ruolo_id = ? WHERE nome = "Andrea Cova"', [dioId]);
        res.send("<h1>Fatto! Database aggiornato. Torna alla dashboard e ricarica (ed esci/rientra dal login).</h1>");
    } catch(e) {
        res.send("Errore: " + e.message);
    }
});

// --- MIDDLEWARES ---
// Middleware di Autenticazione (Verifica JWT)
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ success: false, message: 'Accesso negato. Autenticazione richiesta.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // Payload contiene: userId, ruolo_id, tenant_id, nome
        req.user = payload;
        next();
    } catch (err) {
        if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
            return res.redirect('/login.html');
        }
        return res.status(403).json({ success: false, message: 'Token non valido o scaduto.' });
    }
}

// Middleware di Autorizzazione (Verifica Ruolo)
// rolesArray: array di ruolo_id. 1: Admin, 2: Manager, 3: User, 4: Il Dio Supremo
function authorizeRole(rolesArray) {
    return (req, res, next) => {
        if (!req.user || !rolesArray.includes(req.user.ruolo_id)) {
            if (req.accepts('html') && !req.xhr && !req.path.startsWith('/api/')) {
                return res.status(403).send('<h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">Accesso Negato: Permessi Insufficienti</h1><p style="text-align:center;"><a href="/private/dashboard_user.html">Torna alla Dashboard</a></p>');
            }
            return res.status(403).json({ success: false, message: 'Permessi insufficienti.' });
        }
        next();
    };
}

const verifyManager = authorizeRole([1, 2, 4]);

// --- ROUTES PUBBLICHE ---
// File pubblici (landing, login, script auth)
app.use(express.static('public'));

// Iscrizione Azienda e Manager
app.post('/api/auth/subscribe', async (req, res, next) => {
    const { nome_azienda, partita_iva, nome_utente, email, password } = req.body;
    
    if (!nome_azienda || !partita_iva || !nome_utente || !email || !password) {
        return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
    }

    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Controllo / Creazione Azienda (Tenant)
        const checkAziendaQuery = 'SELECT id FROM aziende WHERE partita_iva = ?';
        const [existingAzienda] = await connection.execute(checkAziendaQuery, [partita_iva]);
        
        let tenant_id;
        if (existingAzienda.length > 0) {
            tenant_id = existingAzienda[0].id;
        } else {
            const insertAziendaQuery = 'INSERT INTO aziende (nome_azienda, partita_iva) VALUES (?, ?)';
            const [aziendaResult] = await connection.execute(insertAziendaQuery, [nome_azienda, partita_iva]);
            tenant_id = aziendaResult.insertId;
        }

        // 2. Recupero id ruolo 'User' (Tutti i nuovi profili sono operativi standard)
        const ruoloQuery = 'SELECT id FROM ruoli WHERE nome_ruolo = ?';
        const [ruoloResult] = await connection.execute(ruoloQuery, ['User']);
        if (ruoloResult.length === 0) {
            throw new Error('Ruolo User non trovato nel DB.');
        }
        const ruolo_id = ruoloResult[0].id;

        // 3. Creazione primo Utente (User)
        const hashedPassword = hashPassword(password);
        const insertUtenteQuery = 'INSERT INTO utenti (tenant_id, ruolo_id, nome, email, password_hash) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(insertUtenteQuery, [tenant_id, ruolo_id, nome_utente, email, hashedPassword]);

        await connection.commit();
        res.json({ success: true, message: 'Azienda e profilo creati con successo' });

    } catch (err) {
        await connection.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage && err.sqlMessage.includes('aziende.partita_iva')) {
                return res.status(400).json({ success: false, message: 'La Partita IVA inserita è già registrata.' });
            }
            if (err.sqlMessage && err.sqlMessage.includes('utenti.email')) {
                return res.status(400).json({ success: false, message: "L'indirizzo email è già in uso." });
            }
            return res.status(400).json({ success: false, message: 'I dati inseriti sono già presenti a sistema.' });
        }
        next(err); // Passa all'error handler globale
    } finally {
        connection.release();
    }
});

// Login
app.post('/api/auth/login', async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e password richiesti' });
    }

    try {
        const hashedPassword = hashPassword(password);
        const query = 'SELECT id, tenant_id, ruolo_id, nome FROM utenti WHERE email = ? AND password_hash = ?';
        const [righe] = await pool.promise().execute(query, [email, hashedPassword]);

        if (righe.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenziali non valide' });
        }

        const user = righe[0];
        
        // Payload JWT
        const payload = {
            userId: user.id,
            ruolo_id: user.ruolo_id,
            tenant_id: user.tenant_id,
            nome: user.nome
        };

        const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });

        // HttpOnly cookie per sicurezza
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 28800000, // 8h
            sameSite: 'Strict'
        });

        let redirectUrl = '/private/dashboard_manager.html';
        if (user.ruolo_id === 1 || user.ruolo_id === 2 || user.ruolo_id === 3 || user.ruolo_id === 4) {
            redirectUrl = '/private/dashboard_manager.html';
        }

        res.json({ success: true, message: 'Login effettuato', redirectUrl });

    } catch (err) {
        next(err);
    }
});


// --- ROUTES PRIVATE ---
// Protezione esplicita per le viste HTML tramite ruoli prima del serve dei static
app.get('/private/dashboard_manager.html', verifyToken, authorizeRole([1, 2, 3, 4]), (req, res, next) => next());
app.get('/private/dashboard_user.html', verifyToken, authorizeRole([1, 2, 3, 4]), (req, res, next) => next());

// Protezione file statici area riservata
app.use('/private', verifyToken, express.static('private'));

// Applicazione middleware verifyToken per tutte le chiamate API private
app.use('/api', verifyToken);

// Dati Utente Loggato
app.get('/api/auth/me', async (req, res, next) => {
    try {
        const query = `SELECT u.id, u.ruolo_id, u.nome, u.email, r.nome_ruolo, a.nome_azienda 
                        FROM utenti u 
                        JOIN ruoli r ON u.ruolo_id = r.id 
                        LEFT JOIN aziende a ON u.tenant_id = a.id 
                        WHERE u.id = ?`;
        const [rows] = await pool.promise().execute(query, [req.user.userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utente non trovato' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout effettuato' });
});

// GET Users (Admin e Manager vedono tutti, User vede solo il proprio tenant)
app.get('/api/users', async (req, res, next) => {
    try {
        let query = 'SELECT u.id, u.nome, u.email, u.creato_il, r.nome_ruolo, a.nome_azienda, a.partita_iva FROM utenti u JOIN ruoli r ON u.ruolo_id = r.id LEFT JOIN aziende a ON u.tenant_id = a.id';
        let params = [];

        // Ruolo 3 (User) vede solo la propria azienda
        if (req.user.ruolo_id === 3) {
            query += ' WHERE u.tenant_id = ?';
            params.push(req.user.tenant_id);
        }
        // Admin (1) e Manager (2) vedono tutti (nessun WHERE applicato)

        query += ' ORDER BY a.nome_azienda ASC, u.nome ASC';

        const [utenti] = await pool.promise().execute(query, params);
        res.json({ success: true, data: utenti });
    } catch (err) {
        next(err);
    }
});

// POST Users (Creazione Sub-User)
app.post('/api/users', verifyManager, async (req, res, next) => {
    const { nome, email, password, ruolo_assegnato } = req.body;
    if (!nome || !email || !password || !ruolo_assegnato) {
        return res.status(400).json({ success: false, message: 'Dati mancanti per la creazione utente' });
    }

    try {
        const targetTenantId = req.user.ruolo_id === 2 ? req.user.tenant_id : req.body.tenant_id;
        if (!targetTenantId) return res.status(400).json({ success: false, message: 'tenant_id non definito' });
        
        if (ruolo_assegnato === 'Admin' && req.user.ruolo_id !== 1) {
            return res.status(403).json({ success: false, message: 'Un Manager non può creare Admin' });
        }

        const [ruoloResult] = await pool.promise().execute('SELECT id FROM ruoli WHERE nome_ruolo = ?', [ruolo_assegnato]);
        if (ruoloResult.length === 0) return res.status(400).json({ success: false, message: 'Ruolo non valido' });
        
        const targetRuoloId = ruoloResult[0].id;
        const hashedPassword = hashPassword(password);
        const insertQuery = 'INSERT INTO utenti (tenant_id, ruolo_id, nome, email, password_hash) VALUES (?, ?, ?, ?, ?)';
        await pool.promise().execute(insertQuery, [targetTenantId, targetRuoloId, nome, email, hashedPassword]);

        res.json({ success: true, message: `Utente ${ruolo_assegnato} creato` });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage && err.sqlMessage.includes('utenti.email')) {
            return res.status(400).json({ success: false, message: "L'indirizzo email è già in uso da un altro utente." });
        }
        next(err);
    }
});

// DELETE User (Manager elimina sub-user)
app.delete('/api/users/:id', verifyManager, async (req, res, next) => {
    const user_id = req.params.id;
    if (parseInt(user_id) === req.user.userId) {
        return res.status(400).json({ success: false, message: 'Non puoi eliminare il tuo stesso account da qui.' });
    }
    try {
        const [userRows] = await pool.promise().execute('SELECT tenant_id FROM utenti WHERE id = ?', [user_id]);
        if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Utente non trovato' });
        
        const targetTenantId = (req.user.ruolo_id === 1 || req.user.ruolo_id === 2 || req.user.ruolo_id === 4) ? userRows[0].tenant_id : userRows[0].tenant_id;
        // Non blocchiamo più il Manager sul suo tenant_id, lo trattiamo come Admin Globale
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2 && req.user.ruolo_id !== 4 && userRows[0].tenant_id !== targetTenantId) return res.status(403).json({ success: false, message: "Accesso negato all'utente" });


        await pool.promise().execute('DELETE FROM utenti WHERE id = ?', [user_id]);
        res.json({ success: true, message: 'Utente eliminato con successo' });
    } catch (err) { next(err); }
});

// PUT User Role (Manager promuove/declassa sub-user)
app.put('/api/users/:id/role', verifyManager, async (req, res, next) => {
    const user_id = req.params.id;
    const { nuovo_ruolo } = req.body;
    
    if (parseInt(user_id) === req.user.userId) {
        return res.status(400).json({ success: false, message: 'Non puoi modificare il tuo ruolo da qui.' });
    }
    if (nuovo_ruolo !== 'Manager' && nuovo_ruolo !== 'User') {
        return res.status(400).json({ success: false, message: 'Ruolo non valido' });
    }
    
    try {
        const [userRows] = await pool.promise().execute('SELECT tenant_id FROM utenti WHERE id = ?', [user_id]);
        if (userRows.length === 0) return res.status(404).json({ success: false, message: 'Utente non trovato' });
        
        const targetTenantId = (req.user.ruolo_id === 1 || req.user.ruolo_id === 2 || req.user.ruolo_id === 4) ? userRows[0].tenant_id : userRows[0].tenant_id;
        // Nessun blocco tenant per Manager, Admin e Dio Supremo
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2 && userRows[0].tenant_id !== targetTenantId) return res.status(403).json({ success: false, message: "Accesso negato all'utente" });

        const [ruoloResult] = await pool.promise().execute('SELECT id FROM ruoli WHERE nome_ruolo = ?', [nuovo_ruolo]);
        const ruolo_id = ruoloResult[0].id;

        await pool.promise().execute('UPDATE utenti SET ruolo_id = ? WHERE id = ?', [ruolo_id, user_id]);
        res.json({ success: true, message: 'Ruolo aggiornato con successo' });
    } catch (err) { next(err); }
});

// GET Checklist
app.get('/api/audit/checklist', async (req, res, next) => {
    try {
        const [domande] = await pool.promise().execute('SELECT id, sezione, domanda, peso_rischio FROM checklist');
        res.json({ success: true, data: domande });
    } catch (err) { next(err); }
});

// POST Audit
app.post('/api/audit', authorizeRole([2, 3]), async (req, res, next) => {
    try {
        const query = 'INSERT INTO audit (tenant_id, creato_da, stato) VALUES (?, ?, ?)';
        const [result] = await pool.promise().execute(query, [req.user.tenant_id, req.user.userId, 'In corso']);
        res.json({ success: true, message: 'Nuovo audit iniziato', audit_id: result.insertId });
    } catch (err) { next(err); }
});

// GET Audit List
app.get('/api/audit', async (req, res, next) => {
    try {
        let query = 'SELECT a.id, a.data_inizio, a.stato, u.nome as creato_da_nome, az.nome_azienda FROM audit a JOIN utenti u ON a.creato_da = u.id JOIN aziende az ON a.tenant_id = az.id';
        let params = [];
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2) {
            query += ' WHERE a.tenant_id = ?';
            params.push(req.user.tenant_id);
        }
        query += ' ORDER BY a.data_inizio DESC';
        const [audits] = await pool.promise().execute(query, params);
        res.json({ success: true, data: audits });
    } catch (err) { next(err); }
});

// PUT Audit
app.put('/api/audit/:id', authorizeRole([2, 3]), async (req, res, next) => {
    const audit_id = req.params.id;
    const { stato } = req.body;
    try {
        const [auditRows] = await pool.promise().execute('SELECT tenant_id FROM audit WHERE id = ?', [audit_id]);
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        
        // Se l'utente non è né Admin (1) né Manager (2) ed è in un tenant diverso, blocchiamo
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2 && auditRows[0].tenant_id !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Accesso negato all audit' });
        }

        await pool.promise().execute('UPDATE audit SET stato = ? WHERE id = ?', [stato, audit_id]);
        res.json({ success: true, message: 'Audit aggiornato con successo' });
    } catch (err) { next(err); }
});

// DELETE Audit
app.delete('/api/audit/:id', async (req, res, next) => {
    const audit_id = req.params.id;
    try {
        const [auditRows] = await pool.promise().execute('SELECT tenant_id, stato FROM audit WHERE id = ?', [audit_id]);
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2) {
            // Regole per User (3)
            if (auditRows[0].tenant_id !== req.user.tenant_id) return res.status(403).json({ success: false, message: 'Accesso negato all audit' });
            if (auditRows[0].stato !== 'In corso') return res.status(403).json({ success: false, message: 'Non puoi eliminare un audit già completato' });
        }

        await pool.promise().execute('DELETE FROM audit WHERE id = ?', [audit_id]);
        res.json({ success: true, message: 'Audit eliminato con successo' });
    } catch (err) { next(err); }
});

// POST Report
app.post('/api/report/:audit_id', async (req, res, next) => {
    const audit_id = req.params.audit_id;
    const { punteggio_cyber_security, vulnerabilita_rilevate, rischi_sanzionatori_gdpr } = req.body;
    try {
        const [auditRows] = await pool.promise().execute('SELECT tenant_id, stato FROM audit WHERE id = ?', [audit_id]);
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        if (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2 && auditRows[0].tenant_id !== req.user.tenant_id) {
            return res.status(403).json({ success: false, message: 'Accesso negato' });
        }

        const insertQuery = 'INSERT INTO report (audit_id, punteggio_cyber_security, vulnerabilita_rilevate, rischi_sanzionatori_gdpr) VALUES (?, ?, ?, ?)';
        await pool.promise().execute(insertQuery, [audit_id, punteggio_cyber_security, JSON.stringify(vulnerabilita_rilevate), JSON.stringify(rischi_sanzionatori_gdpr)]);
        res.json({ success: true, message: 'Report generato con successo' });
    } catch (err) { next(err); }
});

// GET Report
app.get('/api/report/:audit_id', async (req, res, next) => {
    const audit_id = req.params.audit_id;
    try {
        const query = `
            SELECT r.* FROM report r
            JOIN audit a ON r.audit_id = a.id
            WHERE r.audit_id = ? ${(req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2) ? 'AND a.tenant_id = ?' : ''}
        `;
        const params = (req.user.ruolo_id !== 1 && req.user.ruolo_id !== 2) ? [audit_id, req.user.tenant_id] : [audit_id];
        const [reportRows] = await pool.promise().execute(query, params);
        if (reportRows.length === 0) return res.status(404).json({ success: false, message: 'Report non trovato o non accessibile' });

        res.json({ success: true, data: reportRows[0] });
    } catch (err) { next(err); }
});


// --- ERROR HANDLING GLOBALE ---
app.use((err, req, res, next) => {
    console.error('*** Errore Globale ***', err);
    res.status(500).json({ success: false, message: 'Si è verificato un errore interno al server.' });
});

// Gestione rotte non trovate (404)
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint API non trovato' });
});

// Avvio Server
app.listen(port, () => {
    console.log(`Server attivo su http://localhost:${port}`);
});
