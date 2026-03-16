const {
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const config  = require('../config');
const data    = require('../utils/data');
const sus     = require('../utils/sus');
const roblox  = require('../utils/roblox');
const h       = require('../utils/helpers');
const E       = require('../utils/embeds');

async execute(interaction, client) {
    console.log(`[interaction] ${interaction.type} — ${interaction.user.tag}`);
    try {

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    console.log(`[interaction] ${interaction.user.tag} — ${interaction.commandName || interaction.customId || 'unknown'}`);
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (cmd) await cmd.execute(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'start_app') {
        await handleStart(interaction);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId === 'app_modal') {
        await handleModal(interaction, client);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('note_')) {
        await handleNote(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('app_')) {
        await handleStaffBtn(interaction);
        return;
      }
    } catch (err) {
      console.error('[interaction ERROR]', err.message);
      console.error(err.stack);
      const msg = { content: '❌ Something went wrong.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
      else await interaction.reply(msg).catch(() => {});
    }
  },
};

// ── Start Application ─────────────────────────
async function handleStart(interaction) {
  try {
    console.log(`[handleStart] ${interaction.user.tag}`);
    const userId = interaction.user.id;

    console.log('[handleStart] checking blacklist...');
    const blacklisted = await data.isBlacklisted(userId);
    if (blacklisted) {
      const entry = await data.getBlacklistEntry(userId);
      return interaction.reply({
        embeds: [{ color: 0xE74C3C, title: '🚫  Blacklisted', description: `You are blacklisted.\n**Reason:** ${entry?.reason || 'No reason given'}` }],
        ephemeral: true,
      });
    }

    console.log('[handleStart] checking enlisted...');
    const allDivRoles = Object.values(config.roles.divisions).map(d => d.id);
    const alreadyEnlisted = allDivRoles.some(id => interaction.member.roles.cache.has(id)) || interaction.member.roles.cache.has(config.roles.enlisted);
    if (alreadyEnlisted) {
      return interaction.reply({
        embeds: [{ color: 0xF1C40F, title: '⚠️  Already Enlisted', description: 'You are already a member of this regiment.' }],
        ephemeral: true,
      });
    }

    console.log('[handleStart] showing modal...');
    const modal = new ModalBuilder().setCustomId('app_modal').setTitle('Colberg Grenadiers — Enlistment Form');
    const q1 = new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Username').setPlaceholder('Your exact Roblox username').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q2 = new TextInputBuilder().setCustomId('timezone').setLabel('Your Timezone').setPlaceholder('e.g. EST, UTC+8, GMT+1').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q3 = new TextInputBuilder().setCustomId('division').setLabel('Preferred Division').setPlaceholder('Infantry / Militia / Guard / Navy').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q4 = new TextInputBuilder().setCustomId('activity').setLabel('Activity Level (1–10)').setPlaceholder('How active are you? 1 = rarely, 10 = daily').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2);
    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4),
    );
    await interaction.showModal(modal);
    console.log('[handleStart] modal shown!');
  } catch (e) {
    console.error('[handleStart ERROR]', e.message, e.stack);
    await interaction.reply({ content: '❌ Error: ' + e.message, ephemeral: true }).catch(() => {});
  }
}

  const modal = new ModalBuilder().setCustomId('app_modal').setTitle('Colberg Grenadiers — Enlistment Form');

  const q1 = new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Username').setPlaceholder('Your exact Roblox username').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
  const q2 = new TextInputBuilder().setCustomId('timezone').setLabel('Your Timezone').setPlaceholder('e.g. EST, UTC+8, GMT+1').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
  const q3 = new TextInputBuilder().setCustomId('division').setLabel('Preferred Division').setPlaceholder('Infantry / Militia / Guard / Navy').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
  const q4 = new TextInputBuilder().setCustomId('activity').setLabel('Activity Level (1–10)').setPlaceholder('How active are you? 1 = rarely, 10 = daily').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2);

  modal.addComponents(
    new ActionRowBuilder().addComponents(q1),
    new ActionRowBuilder().addComponents(q2),
    new ActionRowBuilder().addComponents(q3),
    new ActionRowBuilder().addComponents(q4),
  );

  await interaction.showModal(modal);
}

// ── Application Modal Submitted ───────────────
async function handleModal(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const raw = {
    roblox:   interaction.fields.getTextInputValue('roblox').trim(),
    timezone: interaction.fields.getTextInputValue('timezone').trim(),
    division: interaction.fields.getTextInputValue('division').trim().toLowerCase(),
    activity: interaction.fields.getTextInputValue('activity').trim(),
  };

  // Validate division
  const divKey = h.parseDivision(raw.division);
  if (!divKey) {
    return interaction.editReply({
      embeds: [{ color: config.colors.danger, title: '❌  Invalid Division', description: 'Please choose: **Infantry**, **Militia**, **Guard**, or **Navy**.\n\nClick the button again to resubmit.' }],
    });
  }

  // Validate activity
  const activity = h.parseActivity(raw.activity);
  if (!activity) {
    return interaction.editReply({
      embeds: [{ color: config.colors.danger, title: '❌  Invalid Activity', description: 'Activity must be a number between **1** and **10**.\n\nClick the button again to resubmit.' }],
    });
  }

  // Verify Roblox
  await interaction.editReply({ embeds: [{ color: config.colors.info, description: '🔍  Verifying your Roblox account...' }] });
  const robloxData = await roblox.getUser(raw.roblox);
  if (!robloxData) {
    return interaction.editReply({
      embeds: [{ color: config.colors.danger, title: '❌  Roblox Account Not Found', description: `Could not find a Roblox account named **${raw.roblox}**.\n\nCheck your spelling and click the button again.` }],
    });
  }

  // Sus check
  const susResult = sus.analyse(interaction.member);
  const answers   = { roblox: raw.roblox, timezone: raw.timezone, division: divKey, activity: activity.toString() };
  const autoOk    = susResult.level === 'clean';

  // Save app
  const app = await data.createApp({
    userId:       interaction.user.id,
    guildId:      interaction.guildId,
    answers,
    susScore:     susResult.score,
    susBreakdown: susResult.items,
    robloxData,
    status:       autoOk ? 'accepted' : 'pending',
  });

  // Show receipt
  await interaction.editReply({ embeds: [E.receipt(app)] });

  // Log channel
  const logCh = interaction.guild.channels.cache.get(config.channels.applicationLogs);
  let logMsg = null;
  if (logCh) {
    logMsg = await logCh.send({ embeds: [E.logEntry(app, interaction.member)] }).catch(() => null);
    if (logMsg) await logMsg.react('📨').catch(() => {});
  }

  // Auto accept
  if (autoOk) {
    const errors = await h.enlist(interaction.member, divKey, robloxData.username);
    const nick   = h.buildNickname(divKey, robloxData.username);
    await data.setAppStatus(app.id, { status: 'accepted', reviewedBy: client.user.id, reviewNote: 'Auto-approved — clean account' });
    await interaction.user.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
    if (logMsg) await logMsg.react('✅').catch(() => {});
    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) await auditCh.send({ embeds: [E.audit(app, client.user.id, 'accepted', 'Auto-approved')] }).catch(() => {});
    if (errors.length) console.warn('[AutoAccept errors]', errors);
    return;
  }

  // Staff review
  const reviewCh = interaction.guild.channels.cache.get(config.channels.staffReview);
  if (reviewCh) {
    const staffRole = interaction.guild.roles.cache.get(config.roles.staff);
    const ping      = staffRole ? `${staffRole} — New application needs review!` : '📋 New application needs review!';
    const btns = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`app_accept_${app.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`app_deny_${app.id}`).setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`app_interview_${app.id}`).setLabel('Interview').setEmoji('📋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`app_waitlist_${app.id}`).setLabel('Waitlist').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
    );
    const reviewMsg = await reviewCh.send({ content: ping, embeds: [E.staffReview(app, interaction.member)], components: [btns] }).catch(() => null);
    if (reviewMsg) await reviewMsg.react('📨').catch(() => {});
  }
}

// ── Staff Buttons ─────────────────────────────
async function handleStaffBtn(interaction) {
  if (!h.isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ No permission.', ephemeral: true });
  }

  const parts  = interaction.customId.split('_');
  const action = parts[1];
  const appId  = parts.slice(2).join('_');
  const app    = await data.getAppById(appId);

  if (!app)                   return interaction.reply({ content: '❌ Application not found.', ephemeral: true });
  if (app.status !== 'pending') return interaction.reply({ content: `⚠️ Already actioned (${app.status}).`, ephemeral: true });

  const labels = { accept: 'Acceptance Note (optional)', deny: 'Denial Reason (required)', interview: 'Interview Note (optional)', waitlist: 'Waitlist Note (optional)' };

  const modal = new ModalBuilder().setCustomId(`note_${action}_${appId}`).setTitle(`${h.cap(action)} Application`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('note').setLabel(labels[action] || 'Note').setStyle(TextInputStyle.Paragraph).setRequired(action === 'deny').setMaxLength(500)
    )
  );
  await interaction.showModal(modal);
}

// ── Staff Note Modal ──────────────────────────
async function handleNote(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const parts  = interaction.customId.split('_');
  const action = parts[1];
  const appId  = parts.slice(2).join('_');
  const note   = interaction.fields.getTextInputValue('note')?.trim() || null;
  const app    = await data.getAppById(appId);

  if (!app)                     return interaction.editReply({ content: '❌ Not found.' });
  if (app.status !== 'pending') return interaction.editReply({ content: `⚠️ Already actioned (${app.status}).` });

  const statusMap = { accept: 'accepted', deny: 'denied', interview: 'interview', waitlist: 'waitlisted' };
  const newStatus = statusMap[action];
  if (!newStatus) return interaction.editReply({ content: '❌ Unknown action.' });

  await data.setAppStatus(appId, { status: newStatus, reviewedBy: interaction.user.id, reviewNote: note });

  const guild  = interaction.guild;
  const member = await guild.members.fetch(app.userId).catch(() => null);

  if (action === 'accept' && member) {
    const errors = await h.enlist(member, app.answers.division, app.robloxData?.username || app.answers.roblox);
    const nick   = h.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox);
    await member.user.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
    if (errors.length) console.warn('[StaffAccept errors]', errors);
  }

  if (action === 'deny') {
    if (member) await member.user.send({ embeds: [E.denyDM(app, note)] }).catch(() => {});
    const denials = await data.countDenials(app.userId);
    if (denials >= config.autoBlacklistAfter) {
      await data.addBlacklist(app.userId, `Auto-blacklisted after ${denials} denials`, client.user.id);
      await interaction.followUp({ content: `⚠️ <@${app.userId}> was auto-blacklisted after ${denials} denials.`, ephemeral: true }).catch(() => {});
    }
  }

  if (action === 'interview' && member) await member.user.send({ embeds: [E.interviewDM(app)] }).catch(() => {});
  if (action === 'waitlist'  && member) await member.user.send({ embeds: [E.waitlistDM(app, note)] }).catch(() => {});

  // Audit log
  const auditCh = guild.channels.cache.get(config.channels.auditLog);
  if (auditCh) await auditCh.send({ embeds: [E.audit(app, interaction.user.id, newStatus, note)] }).catch(() => {});

  // Update review message
  if (interaction.message) {
    await interaction.message.edit({ components: [] }).catch(() => {});
    const reacts = { accepted: '✅', denied: '❌', waitlisted: '🔁', interview: '📋' };
    await interaction.message.react(reacts[newStatus] || '📌').catch(() => {});
  }

  const msgs = { accepted: '✅ Accepted! Roles and nickname assigned.', denied: '❌ Denied. Applicant notified.', interview: '📋 Interview requested.', waitlisted: '🔁 Waitlisted. Applicant notified.' };
  await interaction.editReply({ content: msgs[newStatus] || 'Done.' });
}
