const express = require('express');
const router = express.Router();
const { load, save, nextId, logAction } = require('../db');

router.get('/', (req, res) => {
  const data = load();
  res.json(data.authorizations);
});

router.post('/', (req, res) => {
  const data = load();
  const { code, description } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });

  const auth = { id: nextId(data), code, description: description || '' };
  data.authorizations.push(auth);
  logAction(data, 'AUTH_CREATED', `Authorization object ${code} created`, req.session.user.username);
  save(data);
  res.status(201).json(auth);
});

module.exports = router;