const { col } = require('./db');

// ── Applications ──────────────────────────────
async function createApp(data) {
  const c = await col('applications');
  const app = {
    id: `APP-${Date.now()}`,
    userId:       data.userId,
    guildId:      data.guildId,
    answers:      data.answers,
    susScore:     data.susScore,
    susBreakdown: data.susBreakdown,
    robloxData:   data.robloxData,
    status:       data.status || 'pending',
    reviewedBy:   null,
    reviewNote:   null,
    submittedAt:  new Date().toISOString(),
    reviewedAt:   null,
  };
  await c.insertOne(app);
  await updateStats(app.status, 1);
  return app;
}

async function getAppById(id) {
  const c = await col('applications');
  return c.findOne({ id });
}

async function getAppsByUser(userId) {
  const c = await col('applications');
  return c.find({ userId }).sort({ submittedAt: -1 }).toArray();
}

async function getLatestApp(userId) {
  const apps = await getAppsByUser(userId);
  return apps[0] || null;
}

async function getPendingApps() {
  const c = await col('applications');
  return c.find({ status: 'pending' }).sort({ submittedAt: 1 }).toArray();
}

async function getAllApps() {
  const c = await col('applications');
  return c.find({}).toArray();
}

async function setAppStatus(id, { status, reviewedBy, reviewNote }) {
  const c   = await col('applications');
  const app = await getAppById(id);
  if (!app) return null;
  await c.updateOne({ id }, { $set: { status, reviewedBy, reviewNote, reviewedAt: new Date().toISOString() } });
  await updateStats(app.status, -1);
  await updateStats(status, 1);
  return { ...app, status, reviewedBy, reviewNote };
}

async function countDenials(userId) {
  const c = await col('applications');
  return c.countDocuments({ userId, status: 'denied' });
}

// ── Stats ─────────────────────────────────────
async function updateStats(field, delta) {
  const c = await col('stats');
  await c.updateOne({ _id: 'global' }, { $inc: { total: delta > 0 ? 1 : 0, [field]: delta } }, { upsert: true });
}

async function getStats() {
  const c   = await col('stats');
  const doc = await c.findOne({ _id: 'global' });
  return doc || { total: 0, accepted: 0, denied: 0, pending: 0, waitlisted: 0, interview: 0 };
}

// ── Blacklist ─────────────────────────────────
async function isBlacklisted(userId) {
  const c = await col('blacklist');
  return !!(await c.findOne({ userId }));
}

async function getBlacklistEntry(userId) {
  const c = await col('blacklist');
  return c.findOne({ userId });
}

async function getBlacklist() {
  const c = await col('blacklist');
  return c.find({}).toArray();
}

async function addBlacklist(userId, reason, addedBy) {
  const c = await col('blacklist');
  if (!(await c.findOne({ userId }))) {
    await c.insertOne({ userId, reason, addedBy, addedAt: new Date().toISOString() });
  }
}

async function removeBlacklist(userId) {
  const c = await col('blacklist');
  await c.deleteOne({ userId });
}

module.exports = {
  createApp, getAppById, getAppsByUser, getLatestApp,
  getPendingApps, getAllApps, setAppStatus, countDenials,
  getStats, isBlacklisted, getBlacklistEntry, getBlacklist,
  addBlacklist, removeBlacklist,
};
