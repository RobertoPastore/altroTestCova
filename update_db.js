const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'audit_db',
    waitForConnections: true,
    connectionLimit: 10
});

async function run() {
    try {
        const [ruoli] = await pool.promise().execute('SELECT id, nome_ruolo FROM ruoli WHERE nome_ruolo = ?', ['Il Dio Supremo']);
        let nuovoRuoloId;
        if (ruoli.length === 0) {
            const [result] = await pool.promise().execute('INSERT INTO ruoli (nome_ruolo) VALUES (?)', ['Il Dio Supremo']);
            nuovoRuoloId = result.insertId;
            console.log('Ruolo Il Dio Supremo aggiunto con ID:', nuovoRuoloId);
        } else {
            nuovoRuoloId = ruoli[0].id;
            console.log('Ruolo Il Dio Supremo esistente con ID:', nuovoRuoloId);
        }

        const [updateRes] = await pool.promise().execute('UPDATE utenti SET ruolo_id = ? WHERE nome = ?', [nuovoRuoloId, 'Andrea Cova']);
        console.log('Andrea Cova aggiornato a Il Dio Supremo', updateRes.affectedRows);
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
run();
