# SAP RBAC & SoD Simulator

A portfolio web app that recreates the core logic of SAP GRC access control:
role design (PFCG-style), user administration (SU01-style), and automated
Segregation of Duties (SoD) conflict detection.

## Stack
- Node.js + Express (backend REST API)
- Vanilla HTML/CSS/JS (frontend — no framework, no build step)
- A simple JSON file as the "database" (`data/store.json`) — no native
  modules to compile, works identically on Windows/Mac/Linux.

## Run it

```
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

The app comes pre-seeded with one user, `TEST_SOD01`, who is deliberately
assigned two conflicting roles (Vendor Maintenance + Payment Posting) so you
immediately see a live SoD violation on the Dashboard.

## Project structure

```
sap-security-simulator/
├── server.js              Express app entry point
├── db.js                  Tiny JSON-file data layer (load/save/log)
├── data/store.json         Auto-created on first run — your "database"
├── routes/
│   ├── users.js           User CRUD + role assignment (SU01)
│   ├── roles.js           Single/Composite role creation (PFCG)
│   ├── authorizations.js  Authorization objects
│   ├── sod.js              The SoD rule engine — the core logic
│   └── audit.js           Audit log reader (SM20)
└── public/
    ├── index.html          Dashboard UI (tabs for each module)
    ├── css/style.css
    └── js/app.js           Frontend logic, talks to the API via fetch()
```

## How the SoD engine works (routes/sod.js)

1. For a user, walk every role assigned to them.
2. If a role is Composite, recurse into its child Single Roles.
3. Collect the full set of authorization codes the user effectively holds.
4. Compare that set against every defined SoD rule (a pair of conflicting
   authorization codes). If a user holds both sides of a rule, it's a
   violation — logged and shown on the Dashboard and SoD tab.

## Extending it
- Add more authorization objects and SoD rules from the UI.
- Add a "risk owner sign-off" workflow for violations.
- Swap `db.js` for a real database (SQLite/Postgres) without touching routes.
