const express = require('express');
const session = require('express-session');
const path = require('path');

const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const authorizationsRouter = require('./routes/authorizations');
const sodRouter = require('./routes/sod');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: 'sap-sod-simulator-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

app.use('/api/auth', authRouter);

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
app.use('/api/users', requireLogin, usersRouter);
app.use('/api/roles', requireLogin, rolesRouter);
app.use('/api/authorizations', requireLogin, authorizationsRouter);
app.use('/api/sod', requireLogin, sodRouter);
app.use('/api/audit', requireLogin, auditRouter);

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`SAP RBAC & SoD Simulator running at http://localhost:${PORT}`);
});