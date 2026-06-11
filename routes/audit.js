const express = require('express');
const pool = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/audit/checklist
router.get('/checklist', async (req, res) => {
    try {
        const query = 'SELECT id, sezione, domanda, peso_rischio FROM checklist';
        const [domande] = await pool.promise().execute(query);
        res.json({ success: true, data: domande });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore nel recupero della checklist' });
    }
});

// POST /api/audit
router.post('/', authorizeRole([2, 3]), async (req, res) => {
    try {
        const query = 'INSERT INTO audit (azienda_id, creato_da, stato) VALUES (?, ?, ?)';
        const [result] = await pool.promise().execute(query, [req.user.azienda_id, req.user.userId, 'In corso']);
        res.json({ success: true, message: 'Nuovo audit iniziato', audit_id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Impossibile creare audit' });
    }
});

// GET /api/audit
router.get('/', async (req, res) => {
    try {
        let query = 'SELECT a.id, a.data_inizio, a.stato, u.nome as creato_da_nome FROM audit a JOIN utenti u ON a.creato_da = u.id';
        let params = [];

        if (req.user.ruolo_id !== 1) {
            query += ' WHERE a.azienda_id = ?';
            params.push(req.user.azienda_id);
        }
        
        query += ' ORDER BY a.data_inizio DESC';

        const [audits] = await pool.promise().execute(query, params);
        res.json({ success: true, data: audits });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore recupero storico audit' });
    }
});

// PUT /api/audit/:id
router.put('/:id', authorizeRole([2, 3]), async (req, res) => {
    const audit_id = req.params.id;
    const { stato } = req.body;

    try {
        const checkQuery = 'SELECT azienda_id FROM audit WHERE id = ?';
        const [auditRows] = await pool.promise().execute(checkQuery, [audit_id]);
        
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        if (auditRows[0].azienda_id !== req.user.azienda_id) return res.status(403).json({ success: false, message: 'Accesso negato all audit' });

        const updateQuery = 'UPDATE audit SET stato = ? WHERE id = ?';
        await pool.promise().execute(updateQuery, [stato, audit_id]);
        res.json({ success: true, message: 'Audit aggiornato con successo' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore aggiornamento audit' });
    }
});

module.exports = router;
