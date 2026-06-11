# Cyber Audit Pro 🛡️

Cyber Audit Pro è una piattaforma SaaS B2B sviluppata per consentire alle aziende di effettuare **Audit di Valutazione dei Rischi** in ambito Cyber Security e conformità GDPR.

La piattaforma è costruita con un'architettura **Multi-Tenant Monolitica**, in cui ogni azienda ha un proprio ambiente isolato logicamente, gestendo gerarchie di utenti con permessi differenti (Manager, User) tramite logiche RBAC e autenticazione sicura JWT.

## ✨ Funzionalità Principali

* **Multi-Tenancy Isolato:** Database unico ma isolamento logico dei dati. I Manager di un'azienda non possono mai accedere o alterare i dati di un'altra azienda.
* **Role-Based Access Control (RBAC):**
  * **Manager:** Può iscrivere l'azienda, creare utenti per la propria azienda, gestire gli audit e scaricare i report.
  * **User:** Può unicamente eseguire e compilare gli audit aziendali.
* **Autenticazione Sicura Stateless:** Implementazione di JSON Web Token (JWT) rilasciati tramite cookie `HttpOnly` per prevenire attacchi XSS e CSRF.
* **Design System "Scheduflow":** Interfaccia frontend premium, reattiva e pulita in puro Vanilla JS e CSS. Modalità **Dark Theme rigorosa** con accenti arancioni, layout a Sidebar fissa laterale e schede "Glassmorphism" sospese per massimizzare l'esperienza utente.
* **Audit Interattivi:** Compilazione guidata delle checklist (Cyber Security e GDPR) con salvataggio dello stato, algoritmo di calcolo del rischio e visualizzazione formale dei report finali con vulnerabilità e potenziali sanzioni.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js (Architettura Monolitica Singolo-File)
* **Database:** MySQL 8.0 (modulo `mysql2`, connection pooling, transazioni ACID)
* **Frontend:** HTML5 Semantico, CSS3 (Vanilla), JavaScript (Fetch API)
* **Infrastruttura:** Docker, Docker Compose

## 🚀 Guida all'Avvio Rapido (con Docker)

Il progetto è containerizzato per offrirti un ambiente di sviluppo "chiavi in mano" (Zero Configuration). 

1. Avvia i container con Docker Compose:
   ```bash
   docker compose up -d --build
   ```
2. **Attendi qualche secondo**. Docker installerà le dipendenze Node e MySQL creerà automaticamente lo schema iniziale importando il file `utenti.sql`.
3. Visita la piattaforma dal browser: **[http://localhost:3000](http://localhost:3000)**

*(Per resettare il database e cancellare i dati: `docker compose down -v`)*

## 📂 Struttura del Progetto

L'applicativo rispetta rigorosamente le regole del **Master Brief Architetturale**.

```text
webapp/
├── private/                 # Area protetta (Autenticazione Richiesta)
│   ├── script/
│   │   └── private_script.js # Logiche private (Fetch API con credentials 'include')
│   ├── dashboard.html       # Plancia di comando (Sidebar + Statistiche)
│   ├── audit.html           # Modulo interattivo per la checklist
│   └── report.html          # Visualizzazione report generato
├── public/                  # Area pubblica
│   ├── script/
│   │   └── script.js        # Logiche pubbliche (Registrazione, Login)
│   ├── style/
│   │   └── style.css        # Design System (Dark Theme, Sidebar, Utilities)
│   ├── index.html           # Landing Page informativa
│   ├── come-funziona.html   # Guida passo-passo visiva al sistema
│   ├── login.html           # Modulo di accesso
│   └── register.html        # Modulo di registrazione aziendale (Transazionale)
├── server.js                # Backend Monolitico (Imports, Middleware, Routes)
├── utenti.sql               # Dump Schema DB (Aziende, Utenti, Audit)
├── gemini.md                # Master Brief (Regole architetturali tassative)
└── docker-compose.yml       # Orchestrazione container App + DB
```

## 🔒 Sicurezza ed Esecuzione

Durante il refactoring sono state applicate rigorose misure di sicurezza:
* **Disciplina nel Backend (`server.js`):** Tutto il codice di routing, middleware e connessione DB è raggruppato in un unico file blindato e rigidamente diviso a blocchi visivi.
* **Middleware Interni:** Un middleware `verifyToken` dedicato intercetta il JWT dal cookie `HttpOnly` per le rotte `/api/private/*` e il recupero delle pagine in `/private/`. Le pagine protette non sono servite in statico.
* **Transazioni SQL (ACID):** Quando viene registrata un'azienda e il suo primo Manager, si usa `connection.beginTransaction()`. Se fallisce un insert, tutto viene annullato con `rollback()` per mantenere l'integrità.
* **Integrità DB (`utenti.sql`):** Implementazione obbligata di Foreign Keys con `ON DELETE CASCADE`. Eliminando un'azienda spariscono anche i suoi utenti e relativi audit.
* **Query Parametrizzate:** Si usano ovunque i placeholder `?` (`mysql2`) per blindare il sistema contro le SQL Injection.

---
*Progetto architettato per le procedure operative B2B di Cyber Audit Pro.*
