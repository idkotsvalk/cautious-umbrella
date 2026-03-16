const fs     = require('fs');
const config = require('../config');

const FILE = config.dataFile;

const DEFAULT = {
  applications: [],
  blacklist: [],
  stats: { total: 0, accepted: 0, denied: 0, pending: 0, waitlisted: 0, interview: 0 },
};

function read() {
  try {
    if (!fs.existsSync(FILE)) write(DEFAULT);
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    write(DEFAULT);
    return DEFAULT;
  }
}

function write(d) {
  fs.writeFileSync(FILE, JSON.stringify(d, null, 2));
}

// Applications
function createApp(d) {
  const db  = read();
  const app = {
    id:           'APP-' + Date.now(),
    userId:       d.userId,
    guildId:      d.guildId,
    answers:      d.answers,
    susScore:     d.susScore,
    susBreakdown: d.susBreakdown,
    robloxData:   d.robloxData,
    status:       d.status || 'pending',
    reviewedBy:   null,
    reviewNote:   null,
    submittedAt:  new Date().toISOString(),
    reviewedAt:   null,
  };
  db.applications.push(app);
  db.stats.total++;
  db.stats[app.status] = (db.stats[app.status] || 0) + 1;
  write(db);
  return app;
}

function getAppById(id) {
  return read().applications.find(a => a.id === id) || null;
}

function getAppsByUser(userId) {
  return read().applications.filter(a => a.userId === userId).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

function getLatestApp(userId) {
  return getAppsByUser(userId)[0] || null;
}

function getPendingApps() {
  return read().applications.filter(a => a.status === 'pending').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
}

function getAllApps() {
  return read().applications;
}

function setAppStatus(id, { status, reviewedBy, reviewNote }) {
  const db  = read();
  const app = db.applications.find(a => a.id === id);
  if (!app) return null;
  if (db.stats[app.status] > 0) db.stats[app.status]--;
  app.status     = status;
  app.reviewedBy = reviewedBy || null;
  app.reviewNote = reviewNote || null;
  app.reviewedAt = new Date().toISOString();
  db.stats[status] = (db.stats[status] || 0) + 1;
  write(db);
  return app;
}

function countDenials(userId) {
  return getAppsByUser(userId).filter(a => a.status === 'denied').length;
}

function getStats() {
  return read().stats;
}

// Blacklist
function isBlacklisted(userId) {
  return read().blacklist.some(b => b.userId === userId);
}

function getBlacklistEntry(userId) {
  return read().blacklist.find(b => b.userId === userId) || null;
}

function getBlacklist() {
  return read().blacklist;
}

function addBlacklist(userId, reason, addedBy) {
  const db = read();
  if (!db.blacklist.find(b => b.userId === userId)) {
    db.blacklist.push({ userId, reason, addedBy, addedAt: new Date().toISOString() });
    write(db);
  }
}

function removeBlacklist(userId) {
  const db = read();
  db.blacklist = db.blacklist.filter(b => b.userId !== userId);
  write(db);
}

module.exports = {
  createApp, getAppById, getAppsByUser, getLatestApp,
  getPendingApps, getAllApps, setAppStatus, countDenials,
  getStats, isBlacklisted, getBlacklistEntry, getBlacklist,
  addBlacklist, removeBlacklist,
};
