const config = require('../config');

function analyse(member) {
  const user    = member.user;
  const ageDays = (Date.now() - user.createdTimestamp) / 86400000;
  const items   = [];

  if (ageDays < 1)       items.push({ f: 'Account created today',                    p: 5 });
  else if (ageDays < 7)  items.push({ f: 'Account less than 7 days old',             p: 4 });
  else if (ageDays < 30) items.push({ f: 'Account less than 30 days old',            p: 2 });
  else if (ageDays < 90) items.push({ f: 'Account less than 90 days old',            p: 1 });

  if (!user.avatar)      items.push({ f: 'No profile picture',                       p: 2 });

  const u = user.username.toLowerCase();
  if (/\d{4,}/.test(u))         items.push({ f: '4 or more consecutive numbers in username', p: 2 });
  if (u.length < 4)             items.push({ f: 'Username is very short',                    p: 2 });
  if (/^user\d+$/i.test(u))    items.push({ f: 'Username matches user+numbers pattern',      p: 3 });
  if (/_\d{3,}$/.test(u))      items.push({ f: 'Username ends with underscore and numbers',  p: 2 });

  const flags = user.flags?.toArray() || [];
  if (flags.length === 0) items.push({ f: 'No Discord badges on account', p: 1 });

  if (member.joinedTimestamp) {
    const joinedDays = (member.joinedTimestamp - user.createdTimestamp) / 86400000;
    if (joinedDays < 1)       items.push({ f: 'Joined server same day account was created',      p: 3 });
    else if (joinedDays < 3)  items.push({ f: 'Joined server within 3 days of account creation', p: 2 });
  }

  const score = items.reduce((s, i) => s + i.p, 0);

  let level;
  if (score <= config.sus.autoApproveMax)     level = 'clean';
  else if (score <= config.sus.flaggedMax)    level = 'flagged';
  else                                         level = 'high_risk';

  return { score, items, level };
}

function formatBreakdown(items, score) {
  if (!items.length) return 'No suspicious factors detected.';
  const lines = items.map(i => `- ${i.f} (+${i.p})`);
  lines.push('');
  lines.push(`Total Sus Score: ${score} / 22`);
  return lines.join('\n');
}

module.exports = { analyse, formatBreakdown };
