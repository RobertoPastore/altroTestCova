const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticateToken);

// POST /api/report/:audit_id
router.post('/:audit_id', async (req, res) => {
    const audit_id = req.params.audit_id;
    const { punteggio_cyber_security, vulnerabilita_rilevate, rischi_sanzionatori_gdpr } = req.body;

    try {
        const checkQuery = 'SELECT azienda_id, stato FROM audit WHERE id = ?';
        const [auditRows] = await pool.promise().execute(checkQuery, [audit_id]);
        
        if (auditRows.length === 0) return res.status(404).json({ success: false, message: 'Audit non trovato' });
        if (req.user.ruolo_id !== 1 && auditRows[0].azienda_id !== req.user.azienda_id) {
            return res.status(403).json({ success: false, message: 'Accesso negato' });
        }

        const insertQuery = 'INSERT INTO report (audit_id, punteggio_cyber_security, vulnerabilita_rilevate, rischi_sanzionatori_gdpr) VALUES (?, ?, ?, ?)';
        await pool.promise().execute(insertQuery, [audit_id, punteggio_cyber_security, JSON.stringify(vulnerabilita_rilevate), JSON.stringify(rischi_sanzionatori_gdpr)]);
        
        res.json({ success: true, message: 'Report generato con successo' });
    } catch (err) {
        console.error("Errore report:", err);
        res.status(500).json({ success: false, message: 'Errore durante la generazione del report (possibile duplicato)' });
    }
});

// GET /api/report/:audit_id
router.get('/:audit_id', async (req, res) => {
    const audit_id = req.params.audit_id;

    try {
        const query = `
            SELECT r.* FROM report r
            JOIN audit a ON r.audit_id = a.id
            WHERE r.audit_id = ? ${req.user.ruolo_id !== 1 ? 'AND a.azienda_id = ?' : ''}
        `;
        const params = req.user.ruolo_id !== 1 ? [audit_id, req.user.azienda_id] : [audit_id];
        
        const [reportRows] = await pool.promise().execute(query, params);
        if (reportRows.length === 0) return res.status(404).json({ success: false, message: 'Report non trovato o non accessibile' });

        res.json({ success: true, data: reportRows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore recupero report' });
    }
});

module.exports = router;
