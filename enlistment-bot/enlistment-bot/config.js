// ════════════════════════════════════════════════
//   config.js — Fill in your IDs before starting
// ════════════════════════════════════════════════
require('dotenv').config();

module.exports = {
  // ── Credentials ───────────────────────────────
  token: process.env.BOT_TOKEN?.trim(),
  clientId: process.env.CLIENT_ID,
  guildId:  process.env.GUILD_ID,

  // ── Server Branding ───────────────────────────
  serverName:  'Colberg Grenadiers',
  serverEmoji: '🎖️',

  // ── Embed Colors ──────────────────────────────
  colors: {
    accent:    0x2B5EA7,
    success:   0x2ECC71,
    danger:    0xE74C3C,
    warn:      0xF1C40F,
    interview: 0x9B59B6,
    info:      0x3498DB,
  },

  // ── Channel IDs ───────────────────────────────
  channels: {
    applicationLogs: '1424344616500465684',  // Every app logged here
    staffReview:     '1424344616500465684',       // Sus apps sent here
    auditLog:        '1426567171571585116',          // Who accepted/denied
    training:        '1314617304595693640',            // Mentioned in acceptance DM
  },

  // ── Role IDs ──────────────────────────────────
  roles: {
    enlisted:  '1424320589178601472',  // Base role every accepted member gets
    staffRole: '1350321582467321996',        // Required to use staff commands

    divisions: {
      infantry: { id: '1424697278588784670', prefix: 'II.' },
      militia:  { id: '1452712467690946691', prefix: 'ML'  },
      guard:    { id: '1482263357032759411', prefix: 'GK'  },
      navy:     { id: '1446495249970233547', prefix: 'NV'  },
    },
  },

  // ── Sus Thresholds ────────────────────────────
  sus: {
    autoApproveMax: 2,  // 0–2  → auto approve
    flaggedMax:     4,  // 3–4  → staff review (flagged)
                        // 5+   → staff review (high risk)
  },

  // ── Auto-blacklist after N denials ────────────
  autoBlacklistAfter: 3,

  // ── Reactions ─────────────────────────────────
  reactions: {
    submitted: '📨',
    accepted:  '✅',
    denied:    '❌',
    waitlist:  '🔁',
    interview: '📋',
  },

  // On Render free tier, /tmp persists during the session but resets on redeploy.
  // For permanent storage, set up a Render Disk (paid) or use an external DB.
  dataPath: process.env.RENDER ? '/tmp/applications.json' : './data/applications.json',
};
