const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middlewares/auth');

const router = express.Router();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/subscribe
// Iscrizione azienda e creazione utente Manager (Transaction)
router.post('/subscribe', async (req, res) => {
    const { nome_azienda, partita_iva, nome_utente, email, password } = req.body;
    
    if (!nome_azienda || !partita_iva || !nome_utente || !email || !password) {
        return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori' });
    }

    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Creazione Azienda
        const insertAziendaQuery = 'INSERT INTO aziende (nome_azienda, partita_iva) VALUES (?, ?)';
        const [aziendaResult] = await connection.execute(insertAziendaQuery, [nome_azienda, partita_iva]);
        const azienda_id = aziendaResult.insertId;

        // 2. Recupero id ruolo 'Manager'
        const ruoloQuery = 'SELECT id FROM ruoli WHERE nome_ruolo = ?';
        const [ruoloResult] = await connection.execute(ruoloQuery, ['Manager']);
        if (ruoloResult.length === 0) {
            throw new Error('Ruolo Manager non trovato nel DB. Verifica database.sql');
        }
        const ruolo_id = ruoloResult[0].id;

        // 3. Creazione primo Utente (Manager)
        const hashedPassword = hashPassword(password);
        const insertUtenteQuery = 'INSERT INTO utenti (azienda_id, ruolo_id, nome, email, password_hash) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(insertUtenteQuery, [azienda_id, ruolo_id, nome_utente, email, hashedPassword]);

        await connection.commit();
        return res.json({ success: true, message: 'Azienda e profilo Manager creati con successo' });

    } catch (err) {
        await connection.rollback();
        console.error("Errore subscribe:", err);
        return res.status(500).json({ success: false, message: "Errore interno durante l'iscrizione" });
    } finally {
        connection.release();
    }
});

// POST /api/auth/login
// Login utente
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e password richiesti' });
    }

    try {
        const hashedPassword = hashPassword(password);
        const query = 'SELECT id, azienda_id, ruolo_id, nome FROM utenti WHERE email = ? AND password_hash = ?';
        const [righe] = await pool.promise().execute(query, [email, hashedPassword]);

        if (righe.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenziali non valide' });
        }

        const user = righe[0];
        
        // Payload JWT
        const payload = {
            userId: user.id,
            ruolo_id: user.ruolo_id,
            azienda_id: user.azienda_id,
            nome: user.nome
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: '1h'
        });

        // Setta HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000, // 1h
            sameSite: 'Strict'
        });

        return res.json({ success: true, message: 'Login effettuato' });

    } catch (err) {
        console.error("Errore login:", err);
        return res.status(500).json({ success: false, message: 'Errore interno al server' });
    }
});

// GET /api/auth/me
// Restituisce i dati dell'utente loggato (dal JWT + DB lookup per nome_ruolo e nome_azienda)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const query = `SELECT u.id, u.nome, u.email, r.nome_ruolo, a.nome_azienda 
                        FROM utenti u 
                        JOIN ruoli r ON u.ruolo_id = r.id 
                        LEFT JOIN aziende a ON u.azienda_id = a.id 
                        WHERE u.id = ?`;
        const [rows] = await pool.promise().execute(query, [req.user.userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Utente non trovato' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore interno' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Logout effettuato con successo' });
});

module.exports = router;
