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
// rolesArray: array di ruolo_id. 1: Admin, 2: Manager, 3: User
function authorizeRole(rolesArray) {
    return (req, res, next) => {
        if (!req.user || !rolesArray.includes(req.user.ruolo_id)) {
            return res.status(403).json({ success: false, message: 'Permessi insufficienti.' });
        }
        next();
    };
}

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

        // 1. Creazione Azienda (Tenant)
        const insertAziendaQuery = 'INSERT INTO aziende (nome_azienda, partita_iva) VALUES (?, ?)';
        const [aziendaResult] = await connection.execute(insertAziendaQuery, [nome_azienda, partita_iva]);
        const tenant_id = aziendaResult.insertId;

        // 2. Recupero id ruolo 'Manager'
        const ruoloQuery = 'SELECT id FROM ruoli WHERE nome_ruolo = ?';
        const [ruoloResult] = await connection.execute(ruoloQuery, ['Manager']);
        if (ruoloResult.length === 0) {
            throw new Error('Ruolo Manager non trovato nel DB.');
        }
        const ruolo_id = ruoloResult[0].id;

        // 3. Creazione primo Utente (Manager)
        const hashedPassword = hashPassword(password);
        const insertUtenteQuery = 'INSERT INTO utenti (tenant_id, ruolo_id, nome, email, password_hash) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(insertUtenteQuery, [tenant_id, ruolo_id, nome_utente, email, hashedPassword]);

        await connection.commit();
        res.json({ success: true, message: 'Azienda e profilo Manager creati con successo' });

    } catch (err) {
        await connection.rollback();
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

        res.json({ success: true, message: 'Login effettuato' });

    } catch (err) {
        next(err);
    }
});


// --- ROUTES PRIVATE ---
// Protezione file statici area riservata
app.use('/private', verifyToken, express.static('private'));

// Applicazione middleware verifyToken per tutte le chiamate API private
app.use('/api', verifyToken);

// Dati Utente Loggato
app.get('/api/auth/me', async (req, res, next) => {
    try {
        const query = `SELECT u.id, u.nome, u.email, r.nome_ruolo, a.nome_azienda 
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

// GET Users (Admin vede tutti, Manager vede solo il proprio tenant)
app.get('/api/users', authorizeRole([1, 2]), async (req, res, next) => {
    try {
        let query = 'SELECT u.id, u.nome, u.email, u.creato_il, r.nome_ruolo, a.nome_azienda FROM utenti u JOIN ruoli r ON u.ruolo_id = r.id LEFT JOIN aziende a ON u.tenant_id = a.id';
        let params = [];

        if (req.user.ruolo_id === 2) {
            query += ' WHERE u.tenant_id = ?';
            params.push(req.user.tenant_id);
        }

        const [utenti] = await pool.promise().execute(query, params);
        res.json({ success: true, data: utenti });
    } catch (err) {
        next(err);
    }
});

// POST Users (Creazione Sub-User)
app.post('/api/users', authorizeRole([1, 2]), async (req, res, next) => {
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
        next(err);
    }
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
        let query = 'SELECT a.id, a.data_inizio, a.stato, u.nome as creato_da_nome FROM audit a JOIN utenti u ON a.creato_da = u.id';
        let params = [];
        if (req.user.ruolo_id !== 1) {
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
        if (auditRows[0].tenant_id !== req.user.tenant_id) return res.status(403).json({ success: false, message: 'Accesso negato all audit' });

        await pool.promise().execute('UPDATE audit SET stato = ? WHERE id = ?', [stato, audit_id]);
        res.json({ success: true, message: 'Audit aggiornato con successo' });
    } catch (err) { next(err); }
});

// POST Report
app.post('/api/report/:audit_id', async (req, res, next) => {
    const audit_id = req.params.audit_id;
    const { punteggio_cyber_security, vulnerabilita_rilevate, rischi_sanzionatori_gdpr } = req.body;
    try {
        const [auditRows] = await pool.promise().execute('SELECT tenant_id, stato FROM audit WHERE id = ?', [audit_id]);
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        if (req.user.ruolo_id !== 1 && auditRows[0].tenant_id !== req.user.tenant_id) {
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
            WHERE r.audit_id = ? ${req.user.ruolo_id !== 1 ? 'AND a.tenant_id = ?' : ''}
        `;
        const params = req.user.ruolo_id !== 1 ? [audit_id, req.user.tenant_id] : [audit_id];
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
