const express = require('express');
const router = express.Router();
const { load } = require('../db');

// GET /api/audit - list audit log entries (SM20 equivalent)
router.get('/', (req, res) => {
  const data = load();
  res.json(data.auditLog);
});

module.exports = router;
