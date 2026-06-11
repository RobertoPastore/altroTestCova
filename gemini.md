# REGOLE ARCHITETTURALI TASSATIVE (Master Brief)

## 1. Disciplina nel Backend (server.js)
- **Isolamento a Blocchi:** Dividere rigidamente il file `server.js` in sezioni visive tramite commenti (es. `// --- IMPORTS ---`, `// --- DB CONNECTION ---`, `// --- MIDDLEWARES ---`, `// --- ROUTES PUBBLICHE ---`, `// --- ROUTES PRIVATE ---`).
- **Middleware Interni:** Scrivere le funzioni di controllo all'inizio del file. Implementare un middleware `verifyToken(req, res, next)` che legge il JWT dal cookie HttpOnly, ne valida la firma ed estrae `tenant_id` e ruolo, passandoli all'oggetto `req` per le rotte successive.
- **Sicurezza Transazionale:** Quando si registra un'azienda e il suo primo manager, usare esplicitamente `connection.beginTransaction()` all'interno della singola rotta in `server.js`. Usare sempre i placeholder `?` di `mysql2` per tutte le query.
- **Gestione Errori e Debug:** Inserire un blocco di Error Handling globale alla fine del file Express per intercettare le eccezioni non gestite (incluse le transazioni SQL) ed evitare il crash dell'applicativo.

## 2. Strutturazione del Database (utenti.sql)
- Il file di dump deve contenere l'intera logica per il Multi-Tenancy e i ruoli (verrà rinominato da `database.sql` a `utenti.sql`).
- **Foreign Keys Obbligatorie:** Le tabelle devono essere blindate. Ogni utente deve avere un `tenant_id` non nullo collegato alla tabella delle aziende.
- **Integrità dei Dati:** Includere i vincoli `ON DELETE CASCADE` (es. se si elimina un'azienda, si eliminano a cascata i suoi utenti e i relativi audit).

## 3. Gestione e Flusso del Frontend (Separazione Pubblico/Privato)
- **`public/script/script.js` (Area Auth):** Si occupa solo delle chiamate API (fetch) verso le rotte pubbliche (es. `/api/login`). Non deve MAI memorizzare nulla nel localStorage; l'autenticazione è gestita via cookie dal backend.
- **Accesso a `private/restricted.html`:** Questa pagina NON deve essere servita come file statico pubblico. In `server.js`, la rotta che la restituisce deve passare dal middleware `verifyToken`. Se il cookie manca o è invalido, risponde con un redirect (HTTP 302) a `index.html`.
- **`private/script/private_script.js` (Area Operativa):** Vanilla JS puro. In ogni richiesta fetch verso il backend per dati riservati, includere tassativamente `{ credentials: 'include' }` per far viaggiare il cookie JWT.
