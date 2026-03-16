const config = require('../config');

const DIVISIONS = ['infantry', 'militia', 'guard', 'navy'];

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseDivision(input) {
  const l = input.trim().toLowerCase();
  return DIVISIONS.includes(l) ? l : null;
}

function parseActivity(input) {
  const n = parseInt(input.trim(), 10);
  return (!isNaN(n) && n >= 1 && n <= 10) ? n : null;
}

function buildNickname(divKey, robloxName) {
  const div = config.roles.divisions[divKey];
  return '{' + div.prefix + '} ' + cap(robloxName);
}

function relTime(iso) {
  const sec = Math.floor(new Date(iso).getTime() / 1000);
  return '<t:' + sec + ':R>';
}

function fullTime(iso) {
  const sec = Math.floor(new Date(iso).getTime() / 1000);
  return '<t:' + sec + ':F>';
}

function isStaff(member) {
  return member.roles.cache.has(config.roles.staff) || member.permissions.has('Administrator');
}

function getDivision(member) {
  for (const [k, d] of Object.entries(config.roles.divisions)) {
    if (member.roles.cache.has(d.id)) return k;
  }
  return null;
}

async function enlist(member, divKey, robloxName) {
  const errors = [];
  const div    = config.roles.divisions[divKey];
  try {
    const enlistedRole = member.guild.roles.cache.get(config.roles.enlisted);
    const divRole      = member.guild.roles.cache.get(div.id);
    if (enlistedRole) await member.roles.add(enlistedRole).catch(e => errors.push(e.message));
    if (divRole)      await member.roles.add(divRole).catch(e => errors.push(e.message));
  } catch (e) { errors.push(e.message); }
  try {
    await member.setNickname(buildNickname(divKey, robloxName));
  } catch (e) { errors.push(e.message); }
  return errors;
}

async function discharge(member) {
  const errors = [];
  for (const d of Object.values(config.roles.divisions)) {
    if (member.roles.cache.has(d.id)) {
      const r = member.guild.roles.cache.get(d.id);
      if (r) await member.roles.remove(r).catch(e => errors.push(e.message));
    }
  }
  const enlistedRole = member.guild.roles.cache.get(config.roles.enlisted);
  if (enlistedRole && member.roles.cache.has(config.roles.enlisted)) {
    await member.roles.remove(enlistedRole).catch(e => errors.push(e.message));
  }
  await member.setNickname(null).catch(e => errors.push(e.message));
  return errors;
}

module.exports = {
  cap, parseDivision, parseActivity, buildNickname,
  relTime, fullTime, isStaff, getDivision, enlist, discharge, DIVISIONS,
};
