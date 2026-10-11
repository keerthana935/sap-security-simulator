const express = require('express');
const router = express.Router();
const { load, save, nextId, logAction } = require('../db');

router.get('/', (req, res) => {
  const data = load();
  res.json(data.users);
});

router.get('/role-map', (req, res) => {
  const data = load();
  res.json(data.userRoles);
});

router.post('/', (req, res) => {
  const data = load();
  const { username, fullName, department, userType } = req.body;

  if (!username || !fullName) {
    return res.status(400).json({ error: 'username and fullName are required' });
  }
  if (data.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: `User ${username} already exists` });
  }

  const user = {
    id: nextId(data),
    username,
    fullName,
    department: department || 'Unassigned',
    userType: userType || 'Dialog'
  };
  data.users.push(user);
  logAction(data, 'USER_CREATED', `User ${username} created (SU01 equivalent)`, req.session.user.username);
  save(data);
  res.status(201).json(user);
});

router.delete('/:id', (req, res) => {
  const data = load();
  const id = parseInt(req.params.id);
  const user = data.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  data.users = data.users.filter(u => u.id !== id);
  data.userRoles = data.userRoles.filter(ur => ur.userId !== id);
  logAction(data, 'USER_DELETED', `User ${user.username} removed (Leaver process)`, req.session.user.username);
  save(data);
  res.json({ success: true });
});

router.post('/:id/roles', (req, res) => {
  const data = load();
  const userId = parseInt(req.params.id);
  const { roleId } = req.body;

  const user = data.users.find(u => u.id === userId);
  const role = data.roles.find(r => r.id === roleId);
  if (!user || !role) return res.status(404).json({ error: 'User or role not found' });

  const already = data.userRoles.some(ur => ur.userId === userId && ur.roleId === roleId);
  if (already) return res.status(400).json({ error: 'Role already assigned' });

  data.userRoles.push({ userId, roleId });
  logAction(data, 'ROLE_ASSIGNED', `Role ${role.name} assigned to ${user.username}`, req.session.user.username);
  save(data);
  res.status(201).json({ success: true });
});

router.delete('/:id/roles/:roleId', (req, res) => {
  const data = load();
  const userId = parseInt(req.params.id);
  const roleId = parseInt(req.params.roleId);
  const user = data.users.find(u => u.id === userId);
  const role = data.roles.find(r => r.id === roleId);

  data.userRoles = data.userRoles.filter(ur => !(ur.userId === userId && ur.roleId === roleId));
  logAction(data, 'ROLE_REMOVED', `Role ${role?.name} removed from ${user?.username}`, req.session.user.username);
  save(data);
  res.json({ success: true });
});

module.exports = router;