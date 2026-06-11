const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mia_chiave_super_segreta';

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        // Se la richiesta è per una pagina HTML privata, redirect al login
        if (req.accepts('html')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ success: false, message: 'Accesso negato. Autenticazione richiesta.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload; // payload contiene: userId, ruolo_id, azienda_id, nome
        next();
    } catch (err) {
        if (req.accepts('html')) {
            return res.redirect('/login.html');
        }
        return res.status(403).json({ success: false, message: 'Token non valido o scaduto.' });
    }
}

// rolesArray: array di ruolo_id. 1: Admin, 2: Manager, 3: User
function authorizeRole(rolesArray) {
    return (req, res, next) => {
        if (!req.user || !rolesArray.includes(req.user.ruolo_id)) {
            return res.status(403).json({ success: false, message: 'Permessi insufficienti.' });
        }
        next();
    };
}

module.exports = { authenticateToken, authorizeRole, JWT_SECRET };
