const express = require('express');
const router = express.Router();
const { load, save, nextId, logAction } = require('../db');

router.get('/', (req, res) => {
  const data = load();
  res.json(data.roles);
});

router.post('/', (req, res) => {
  const data = load();
  const { name, type, description, authIds, childRoleIds } = req.body;

  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  if (data.roles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: `Role ${name} already exists` });
  }

  const role = {
    id: nextId(data),
    name,
    type,
    description: description || '',
    authIds: type === 'single' ? (authIds || []) : [],
    childRoleIds: type === 'composite' ? (childRoleIds || []) : []
  };
  data.roles.push(role);
  logAction(data, 'ROLE_CREATED', `${type === 'single' ? 'Single' : 'Composite'} role ${name} created (PFCG)`, req.session.user.username);
  save(data);
  res.status(201).json(role);
});

module.exports = router;