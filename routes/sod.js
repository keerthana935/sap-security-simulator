const express = require('express');
const router = express.Router();
const { load, save, nextId, logAction } = require('../db');

function getEffectiveAuthIds(data, userId) {
  const roleIds = data.userRoles.filter(ur => ur.userId === userId).map(ur => ur.roleId);
  const authIdSet = new Set();

  function collectFromRole(roleId) {
    const role = data.roles.find(r => r.id === roleId);
    if (!role) return;
    if (role.type === 'single') {
      role.authIds.forEach(a => authIdSet.add(a));
    } else if (role.type === 'composite') {
      (role.childRoleIds || []).forEach(childId => collectFromRole(childId));
    }
  }

  roleIds.forEach(collectFromRole);
  return authIdSet;
}

router.get('/rules', (req, res) => {
  const data = load();
  res.json(data.sodRules);
});

router.post('/rules', (req, res) => {
  const data = load();
  const { authId1, authId2, riskLevel, description } = req.body;
  if (!authId1 || !authId2) return res.status(400).json({ error: 'authId1 and authId2 are required' });

  const rule = {
    id: nextId(data),
    authId1, authId2,
    riskLevel: riskLevel || 'Medium',
    description: description || ''
  };
  data.sodRules.push(rule);
  logAction(data, 'SOD_RULE_CREATED', `SoD rule created between auth ${authId1} and ${authId2}`, req.session.user.username);
  save(data);
  res.status(201).json(rule);
});

router.get('/violations', (req, res) => {
  const data = load();
  const violations = [];

  data.users.forEach(user => {
    const effectiveAuths = getEffectiveAuthIds(data, user.id);
    data.sodRules.forEach(rule => {
      if (effectiveAuths.has(rule.authId1) && effectiveAuths.has(rule.authId2)) {
        const auth1 = data.authorizations.find(a => a.id === rule.authId1);
        const auth2 = data.authorizations.find(a => a.id === rule.authId2);
        violations.push({
          userId: user.id,
          username: user.username,
          ruleId: rule.id,
          riskLevel: rule.riskLevel,
          auth1: auth1?.code,
          auth2: auth2?.code,
          description: rule.description
        });
      }
    });
  });

  res.json(violations);
});

module.exports = router;