const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Importazione rotte e middleware
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/report');
const { authenticateToken } = require('./middlewares/auth');

// Middleware globali
app.use(express.json());
app.use(cookieParser());

// File pubblici — serviti a tutti senza autenticazione
app.use(express.static('public'));

// File privati — serviti SOLO dopo verifica JWT
// Il middleware authenticateToken protegge l'intera cartella /private
app.use('/private', authenticateToken, express.static('private'));

// Registrazione rotte API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/report', reportRoutes);

// Endpoint di test
app.get('/api/ping', (req, res) => {
    res.json({ success: true, message: 'Server backend operativo' });
});

// Gestione errori 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint non trovato' });
});

// Avvio server
app.listen(port, () => {
    console.log(`Server attivo su http://localhost:${port}`);
});
