# Fase 4: QA, Collaudo e Rilascio

Questo documento formalizza i test automatizzati previsti, le procedure di collaudo utente (UAT) e le linee guida per la messa in produzione della piattaforma **Cyber Audit Pro**.

## 1. Stesura Formale dei Test Automatizzati (E2E & Integration)

I test automatizzati sono focalizzati sulla sicurezza (JWT) e sull'isolamento dei tenant (Multi-Tenancy).

### Scenari di Test di Sicurezza & Auth (Jest + Supertest)
*   **[TEST-AUTH-01]** Verifica Registrazione: Invia payload corretto a `/api/auth/subscribe`. Verifica status `200` e creazione del Manager nel database tramite Transaction.
*   **[TEST-AUTH-02]** Verifica Transaction Rollback: Invia payload a `/api/auth/subscribe` con `ruolo_id` inesistente per forzare il fallimento dello step 3. Verifica status `500` e accertati che nessuna azienda orfana venga creata.
*   **[TEST-AUTH-03]** Login Valido: Invia payload a `/api/auth/login`. Verifica status `200` e controlla la presenza dell'header `Set-Cookie` contenente il token con flag `HttpOnly`.
*   **[TEST-AUTH-04]** Accesso Non Autorizzato: Invia richiesta GET a `/api/audit` senza cookie. Verifica status `401` o redirect.

### Scenari di Test Multi-Tenant (RBAC & Isolamento)
*   **[TEST-MT-01]** Lettura Utenti Limitata: Login come Manager dell'Azienda A. Esegui GET `/api/users`. Verifica che tutti gli utenti ritornati appartengano all'Azienda A.
*   **[TEST-MT-02]** Violazione Confini Audit: Login come User dell'Azienda A. Tenta la PUT `/api/audit/{id_azienda_B}`. Verifica status `403 Accesso negato`.
*   **[TEST-MT-03]** Creazione Sub-Utente Privilegiata: Login come Manager. Esegui POST `/api/users` tentando di assegnare ruolo `Admin`. Verifica status `403`.

## 2. Documento di Collaudo Formale (UAT)

Il collaudo utente (User Acceptance Testing) richiede che un tester umano esegua il seguente flusso operativo per certificare la UX e il flow aziendale:

### Scenario End-to-End: Il viaggio del Cliente
1.  **Visita Landing Page:** Navigare su `http://localhost:3000/`. Verificare responsività (mobile/desktop) e leggibilità dei gradienti.
2.  **Sottoscrizione:** Compilare il modulo "Iscrivi la tua Azienda".
3.  **Accesso Manager:** Effettuare il login con le credenziali appena create.
4.  **Gestione Dashboard:** Verificare la presenza del badge "Manager". Aggiungere un nuovo utente assegnandogli il ruolo "User (Operativo)".
5.  **Switch Sessione:** Effettuare il logout e accedere come lo User appena creato. Verificare che il badge indichi "User" e che il pannello "Aggiungi Utente" sia nascosto o inaccessibile.
6.  **Esecuzione Audit:** Cliccare su "Nuovo Audit". Compilare parzialmente la modulistica, cliccare su "Salva Bozza". Rientrare tramite il tasto "Riprendi".
7.  **Conclusione:** Compilare tutte le voci inserendo dei "No, non presente" per forzare delle vulnerabilità. Cliccare su "Concludi e Genera Report".
8.  **Verifica Report:** Verificare che il cerchio del punteggio sia colorato di rosso/arancione, e leggere le vulnerabilità e i rischi sanzionatori GDPR.

## 3. Linee Guida per il Rilascio in Produzione

Prima di spostare l'applicativo dal container locale Docker al Cloud (es. AWS, Azure, Heroku), applicare i seguenti vincoli di sicurezza:

### A. Sicurezza dei Token (JWT e Cookie)
*   **HTTPS Obbligatorio:** Il backend deve trovarsi dietro un Load Balancer / Reverse Proxy (Nginx) configurato con SSL/TLS.
*   **Flag Secure:** Impostare esplicitamente in `app.js` la variabile `NODE_ENV=production` affinché i cookie JWT vengano serviti con `secure: true`.

### B. Variabili D'Ambiente (Configurazione)
Nel file `docker-compose.yml` di produzione o nella console cloud:
*   Sostituire la stringa hardcoded in `JWT_SECRET` con una chiave crittografica complessa generata offline a 256bit.
*   Cambiare i parametri `MYSQL_ROOT_PASSWORD`, assicurandosi di non pubblicare mai il file SQL o l'env su GitHub.

### C. Ottimizzazione Backend
*   **PM2/PM2-Docker:** Sostituire `nodemon` e `node` con `pm2-runtime` per bilanciare il carico su tutti i core della CPU e riavviare l'app in caso di crash.
*   **Helmet.js e CORS:** Integrare la libreria `helmet` in Express.js per securizzare le intestazioni HTTP e configurare rigide policy CORS (Cross-Origin Resource Sharing).
*   **Log Puliti:** Assicurarsi che nei blocchi `catch` globali non vengano ritornati `err.stack` verso il client, evitando così *Information Disclosure*.
