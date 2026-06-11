# Cyber Audit Pro 🛡️

Cyber Audit Pro è una piattaforma SaaS B2B sviluppata per consentire alle aziende di effettuare **Audit di Valutazione dei Rischi Leggeri** in ambito Cyber Security e conformità GDPR.

La piattaforma è costruita con un'architettura **Multi-Tenant**, in cui ogni azienda ha un proprio ambiente isolato logicamente, gestendo gerarchie di utenti con permessi differenti (Admin, Manager, User) tramite logiche RBAC e autenticazione sicura JWT.

## ✨ Funzionalità Principali

* **Multi-Tenancy Isolato:** Database unico ma isolamento logico dei dati. I Manager di un'azienda non possono mai accedere o alterare i dati di un'altra azienda.
* **Role-Based Access Control (RBAC):**
  * **Manager:** Può iscrivere l'azienda, creare utenti per la propria azienda, gestire gli audit e scaricare i report.
  * **User:** Può solo eseguire e compilare gli audit aziendali.
  * **Admin:** Supervisione globale dell'intero sistema.
* **Autenticazione Sicura Stateless:** Implementazione di JSON Web Token (JWT) rilasciati tramite cookie `HttpOnly` per prevenire attacchi XSS e CSRF.
* **Dashboard e UI Premium:** Interfaccia frontend reattiva (Vanilla JS) arricchita con stile *Glassmorphism* moderno, interamente custom senza framework pesanti (no React, no Tailwind).
* **Audit Interattivi:** Compilazione guidata delle checklist (Cyber Security e GDPR) con salvataggio dello stato, algoritmo di calcolo del rischio e visualizzazione formale dei report finali con vulnerabilità e potenziali sanzioni.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL 8.0 (con modulo `mysql2`, connection pooling e transazioni)
* **Frontend:** HTML5 Semantico, CSS3 (Vanilla), JavaScript (Fetch API)
* **Autenticazione:** `jsonwebtoken`, `cookie-parser`, `crypto`
* **Infrastruttura:** Docker, Docker Compose

## 🚀 Guida all'Avvio Rapido (con Docker)

Il progetto è stato containerizzato per offrirti un ambiente di sviluppo "chiavi in mano" (Zero Configuration). 

### Prerequisiti
* [Docker Desktop](https://www.docker.com/products/docker-desktop) in esecuzione.

### Installazione ed Esecuzione

1. Apri un terminale nella cartella root del progetto (`c:\Users\celja\Desktop\webapp`).
2. Avvia i container con Docker Compose:
   ```bash
   docker compose up -d
   ```
3. **Attendi qualche secondo**. Docker scaricherà le immagini, installerà i pacchetti Node (`npm install` eseguito nel container) e il database MySQL creerà automaticamente lo schema iniziale importando il file `database.sql`.
4. Visita la piattaforma dal browser: **[http://localhost:3000](http://localhost:3000)**

*(Per fermare il server, esegui `docker compose down`)*

## 📂 Struttura del Progetto

```text
webapp/
├── private/                 # Area protetta (Autenticazione Richiesta)
│   ├── script/
│   │   └── private_script.js  # Logiche private e chiamate API autorizzate
│   ├── dashboard.html       # Area riservata protetta
│   ├── audit.html           # Modulo interattivo per la checklist
│   └── report.html          # Visualizzazione report generato
├── public/                  # Area pubblica visibile a tutti
│   ├── script/
│   │   └── script.js          # Logiche pubbliche (Registrazione, Login)
│   ├── style/
│   │   └── style.css          # Design System Premium & Glassmorphism
│   ├── index.html           # Landing Page informativa
│   ├── login.html           # Modulo di accesso
│   └── register.html        # Modulo di registrazione aziendale
├── config/                  # Setup del Pool MySQL
├── middlewares/             # Middleware JWT e validazione Ruoli
├── routes/                  # Controller delle rotte API RESTful
├── server.js                # Entry point Backend Node.js
├── database.sql             # Dump Schema DB Iniziale
└── docker-compose.yml       # Orchestrazione container
```

## 🔒 Sicurezza ed Esecuzione (Ispirato alla Doc.)

Durante lo sviluppo sono state rispettate scrupolosamente le istruzioni fornite nei manuali allegati (`Documentazione/`):
* **MySQL Transactions:** Le registrazioni aziendali utilizzano `.beginTransaction()`, `.commit()` e `.rollback()` per evitare anomalie in caso di errori multipli (`auth.js`).
* **Protezione JWT:** Nessun token salvato nel Local Storage. L'uso di cookie `HttpOnly` delega al browser la gestione sicura del token ad ogni richiesta API.
* **Query Parametrizzate:** Tutte le query SQL usano i costrutti `?` per annullare i rischi di SQL Injection.
* **Isolamento Tenant lato Server:** I client non passano mai in chiaro il loro ID aziendale; quest'ultimo viene sempre verificato ed estrapolato al volo dal JWT firmato dal server, impedendo alterazioni malevole.

---
*Progetto architettato e sviluppato da Antigravity per le procedure operative di Cyber Audit Pro.*
