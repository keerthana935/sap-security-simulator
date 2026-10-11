// db.js
// A tiny file-based "database". No native modules, no setup — just reads/writes
// data/store.json. Good enough for a portfolio project; swap for real DB later.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'store.json');

function defaultData() {
  return {
    nextId: 100,
    consoleUsers: [
      { username: 'admin', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'Security Admin' }
    ],
    users: [
      { id: 1, username: 'TEST_SOD01', fullName: 'Test SoD User', department: 'Procurement', userType: 'Dialog' }
    ],
    authorizations: [
      { id: 1, code: 'Z_VENDOR_MAINT', description: 'Maintain Vendor Master Data (create/change vendors)' },
      { id: 2, code: 'Z_AP_PAYMENT', description: 'Post Vendor Payments (F110 payment run)' },
      { id: 3, code: 'Z_PO_CREATE', description: 'Create Purchase Orders' },
      { id: 4, code: 'Z_GR_POST', description: 'Post Goods Receipt' }
    ],
    roles: [
      { id: 1, name: 'Z_VENDOR_MAINT_ROLE', type: 'single', description: 'Single role: vendor master maintenance', authIds: [1] },
      { id: 2, name: 'Z_AP_PAYMENT_ROLE', type: 'single', description: 'Single role: AP payment posting', authIds: [2] },
      { id: 3, name: 'Z_PROCUREMENT_COMPOSITE', type: 'composite', description: 'Composite role for Procurement Clerk position', childRoleIds: [1] }
    ],
    userRoles: [
      { userId: 1, roleId: 1 },
      { userId: 1, roleId: 2 }
    ],
    sodRules: [
      { id: 1, authId1: 1, authId2: 2, riskLevel: 'High', description: 'Vendor Master Maintenance vs. Payment Posting — a user who can both create/change vendors AND post payments could create a fake vendor and pay themselves.' }
    ],
    auditLog: []
  };
}

function load() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const data = defaultData();
    save(data);
    return data;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function nextId(data) {
  const id = data.nextId;
  data.nextId += 1;
  return id;
}

function logAction(data, action, details, performedBy) {
  data.auditLog.unshift({
    id: data.auditLog.length + 1,
    timestamp: new Date().toISOString(),
    action,
    details,
    performedBy: performedBy || 'system'
  });
}

module.exports = { load, save, nextId, logAction, DATA_FILE };