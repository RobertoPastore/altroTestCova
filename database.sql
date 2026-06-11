-- Tabella Aziende (Tenant)
CREATE TABLE aziende (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_azienda VARCHAR(255) NOT NULL,
    partita_iva VARCHAR(50) NOT NULL UNIQUE,
    data_registrazione DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Ruoli (RBAC)
CREATE TABLE ruoli (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_ruolo VARCHAR(50) NOT NULL UNIQUE -- 'Admin', 'Manager', 'User'
);

-- Tabella Utenti
CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    azienda_id INT NULL, -- NULL per l'Admin di sistema globale
    ruolo_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creato_il DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (azienda_id) REFERENCES aziende(id) ON DELETE CASCADE,
    FOREIGN KEY (ruolo_id) REFERENCES ruoli(id)
);

-- Tabella Checklist Framework (Cyber Security & GDPR)
CREATE TABLE checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sezione VARCHAR(100) NOT NULL, -- es. 'GDPR', 'Cyber Security'
    domanda TEXT NOT NULL,
    peso_rischio INT NOT NULL DEFAULT 1
);

-- Tabella Audit (Singola valutazione)
CREATE TABLE audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    azienda_id INT NOT NULL,
    creato_da INT NOT NULL,
    data_inizio DATETIME DEFAULT CURRENT_TIMESTAMP,
    stato VARCHAR(50) DEFAULT 'In corso', -- 'In corso', 'Completato'
    FOREIGN KEY (azienda_id) REFERENCES aziende(id) ON DELETE CASCADE,
    FOREIGN KEY (creato_da) REFERENCES utenti(id)
);

-- Tabella Report Finale
CREATE TABLE report (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_id INT NOT NULL UNIQUE,
    punteggio_cyber_security INT NOT NULL,
    vulnerabilita_rilevate TEXT,
    rischi_sanzionatori_gdpr TEXT,
    data_generazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES audit(id) ON DELETE CASCADE
);

-- Inserimento dei ruoli di default
INSERT INTO ruoli (nome_ruolo) VALUES ('Admin'), ('Manager'), ('User');

-- Inserimento checklist Cyber Security
INSERT INTO checklist (sezione, domanda, peso_rischio) VALUES
('Cyber Security', 'È presente un firewall perimetrale aggiornato e configurato?', 3),
('Cyber Security', 'Tutti i dispositivi aziendali dispongono di una soluzione antivirus/EDR attiva e aggiornata?', 4),
('Cyber Security', 'È attiva una policy di aggiornamento periodico del software e dei sistemi operativi (patch management)?', 3),
('Cyber Security', 'Le password degli utenti rispettano requisiti minimi di complessità e viene imposta la rotazione periodica?', 2),
('Cyber Security', 'È implementata l''autenticazione a più fattori (MFA) per l''accesso ai sistemi critici?', 4),
('Cyber Security', 'Viene eseguito un backup regolare dei dati con procedure di ripristino testate?', 5),
('Cyber Security', 'Esiste una procedura documentata di risposta agli incidenti informatici (Incident Response Plan)?', 3),
('Cyber Security', 'La rete aziendale è segmentata per isolare i sistemi critici da quelli meno sensibili?', 3),
('Cyber Security', 'Viene effettuata periodicamente una valutazione delle vulnerabilità (vulnerability assessment) sull''infrastruttura?', 3),
('Cyber Security', 'Il personale riceve formazione periodica sulla sicurezza informatica e sul phishing?', 2);

-- Inserimento checklist GDPR
INSERT INTO checklist (sezione, domanda, peso_rischio) VALUES
('GDPR', 'Esiste un Registro dei Trattamenti aggiornato ai sensi dell''Art. 30 del GDPR?', 5),
('GDPR', 'È stato nominato un Responsabile della Protezione dei Dati (DPO) ove richiesto?', 4),
('GDPR', 'Viene fornita un''informativa privacy chiara e completa agli interessati (Art. 13-14)?', 4),
('GDPR', 'I dati personali sono protetti con misure di crittografia at-rest e in-transit?', 4),
('GDPR', 'Esistono procedure documentate per la gestione delle richieste di esercizio dei diritti degli interessati (accesso, cancellazione, portabilità)?', 3),
('GDPR', 'È stata effettuata una Valutazione d''Impatto (DPIA) per i trattamenti ad alto rischio?', 4),
('GDPR', 'Esiste una procedura di notifica delle violazioni dei dati personali (Data Breach) entro 72 ore al Garante?', 5),
('GDPR', 'I contratti con i responsabili del trattamento (fornitori terzi) contengono le clausole previste dall''Art. 28?', 3);
