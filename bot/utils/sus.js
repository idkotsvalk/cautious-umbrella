const config = require('../config');

function analyse(member) {
  const user    = member.user;
  const ageDays = (Date.now() - user.createdTimestamp) / 86400000;
  const items   = [];

  if (ageDays < 1)        items.push({ f: 'Account created today',                       p: 5, e: '🔴' });
  else if (ageDays < 7)   items.push({ f: 'Account less than 7 days old',                p: 4, e: '🔴' });
  else if (ageDays < 30)  items.push({ f: 'Account less than 30 days old',               p: 2, e: '🟡' });
  else if (ageDays < 90)  items.push({ f: 'Account less than 90 days old',               p: 1, e: '🟡' });

  if (!user.avatar)       items.push({ f: 'No profile picture (default avatar)',          p: 2, e: '🟡' });

  const u = user.username.toLowerCase();
  if (/\d{4,}/.test(u))          items.push({ f: 'Username has 4+ consecutive numbers',  p: 2, e: '🟡' });
  if (u.length < 4)              items.push({ f: 'Username is very short',                p: 2, e: '🟡' });
  if (/^user\d+$/i.test(u))     items.push({ f: 'Username matches "user+numbers" pattern', p: 3, e: '🔴' });
  if (/_\d{3,}$/.test(u))       items.push({ f: 'Username ends with _numbers',            p: 2, e: '🟡' });

  const flags = user.flags?.toArray() || [];
  if (flags.length === 0) items.push({ f: 'No Discord badges on account',                p: 1, e: '⚪' });

  if (member.joinedTimestamp) {
    const joinedDays = (member.joinedTimestamp - user.createdTimestamp) / 86400000;
    if (joinedDays < 1)  items.push({ f: 'Joined server same day account was created',   p: 3, e: '🔴' });
    else if (joinedDays < 3) items.push({ f: 'Joined server within 3 days of creation',  p: 2, e: '🟡' });
  }

  const score = items.reduce((s, i) => s + i.p, 0);
  let level, emoji;
  if (score <= config.sus.autoApproveMax)      { level = 'clean';     emoji = '✅'; }
  else if (score <= config.sus.flaggedMax)     { level = 'flagged';   emoji = '⚠️'; }
  else                                          { level = 'high_risk'; emoji = '🚨'; }

  return { score, items, level, emoji };
}

function formatBreakdown(items, score) {
  if (!items.length) return '✅ No suspicious factors detected.';
  return [
    ...items.map(i => `${i.e} ${i.f} — **+${i.p}**`),
    '─────────────────────────────',
    `**Total Sus Score: ${score} / 22**`,
  ].join('\n');
}

module.exports = { analyse, formatBreakdown };
