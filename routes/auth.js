const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { load, save, logAction } = require('../db');

function hash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const data = load();
  const account = data.consoleUsers.find(u => u.username === username);

  if (!account || account.passwordHash !== hash(password || '')) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.user = { username: account.username, role: account.role };
  logAction(data, 'LOGIN', `${account.username} logged into the console`, account.username);
  save(data);
  res.json({ username: account.username, role: account.role });
});

router.post('/logout', (req, res) => {
  const user = req.session.user;
  if (user) {
    const data = load();
    logAction(data, 'LOGOUT', `${user.username} logged out`, user.username);
    save(data);
  }
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

module.exports = router;