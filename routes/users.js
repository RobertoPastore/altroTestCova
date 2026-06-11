const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const router = express.Router();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Tutte le rotte utenti richiedono JWT
router.use(authenticateToken);

// GET /api/users
// Admin vede tutti, Manager vede solo quelli della sua azienda
router.get('/', authorizeRole([1, 2]), async (req, res) => {
    try {
        let query = 'SELECT u.id, u.nome, u.email, u.creato_il, r.nome_ruolo, a.nome_azienda FROM utenti u JOIN ruoli r ON u.ruolo_id = r.id LEFT JOIN aziende a ON u.azienda_id = a.id';
        let params = [];

        if (req.user.ruolo_id === 2) {
            query += ' WHERE u.azienda_id = ?';
            params.push(req.user.azienda_id);
        }

        const [utenti] = await pool.promise().execute(query, params);
        res.json({ success: true, data: utenti });
    } catch (err) {
        console.error("Errore fetch users:", err);
        res.status(500).json({ success: false, message: 'Errore nel recupero degli utenti' });
    }
});

// POST /api/users
// Creazione sub-utente per l'azienda corrente
router.post('/', authorizeRole([1, 2]), async (req, res) => {
    const { nome, email, password, ruolo_assegnato } = req.body;

    if (!nome || !email || !password || !ruolo_assegnato) {
        return res.status(400).json({ success: false, message: 'Dati mancanti per la creazione utente' });
    }

    try {
        const targetAziendaId = req.user.ruolo_id === 2 ? req.user.azienda_id : req.body.azienda_id;

        if (!targetAziendaId) {
            return res.status(400).json({ success: false, message: 'azienda_id non definita' });
        }

        if (ruolo_assegnato === 'Admin' && req.user.ruolo_id !== 1) {
            return res.status(403).json({ success: false, message: 'Un Manager non può creare utenti Admin' });
        }

        const ruoloQuery = 'SELECT id FROM ruoli WHERE nome_ruolo = ?';
        const [ruoloResult] = await pool.promise().execute(ruoloQuery, [ruolo_assegnato]);
        if (ruoloResult.length === 0) {
            return res.status(400).json({ success: false, message: 'Ruolo non valido' });
        }
        const targetRuoloId = ruoloResult[0].id;

        const hashedPassword = hashPassword(password);
        const insertUtenteQuery = 'INSERT INTO utenti (azienda_id, ruolo_id, nome, email, password_hash) VALUES (?, ?, ?, ?, ?)';
        await pool.promise().execute(insertUtenteQuery, [targetAziendaId, targetRuoloId, nome, email, hashedPassword]);

        res.json({ success: true, message: `Utente ${ruolo_assegnato} creato con successo` });
    } catch (err) {
        console.error("Errore creazione utente:", err);
        res.status(500).json({ success: false, message: "Errore interno. L'email potrebbe essere già in uso." });
    }
});

module.exports = router;
