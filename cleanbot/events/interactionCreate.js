const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const config = require('../config');
const data   = require('../utils/data');
const sus    = require('../utils/sus');
const roblox = require('../utils/roblox');
const h      = require('../utils/helpers');
const E      = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
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
      console.error('Interaction error: ' + err.message);
      console.error(err.stack);
      const msg = { content: 'An error occurred. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  },
};

async function handleStart(interaction) {
  try {
    const userId = interaction.user.id;

    if (data.isBlacklisted(userId)) {
      const entry = data.getBlacklistEntry(userId);
      return interaction.reply({
        embeds: [{
          color: config.colors.red,
          title: 'Blacklisted',
          description: 'You are blacklisted from applying to ' + config.serverName + '.\nReason: ' + (entry?.reason || 'No reason given'),
        }],
        ephemeral: true,
      });
    }

    const divRoleIds      = Object.values(config.roles.divisions).map(d => d.id);
    const alreadyEnlisted = divRoleIds.some(id => interaction.member.roles.cache.has(id)) ||
                            interaction.member.roles.cache.has(config.roles.enlisted);
    if (alreadyEnlisted) {
      return interaction.reply({
        embeds: [{
          color: config.colors.yellow,
          title: 'Already Enlisted',
          description: 'You are already a member of this regiment. Contact staff if you want to change divisions.',
        }],
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('app_modal')
      .setTitle(config.serverName + ' Application');

    const q1 = new TextInputBuilder()
      .setCustomId('roblox')
      .setLabel('Roblox Username')
      .setPlaceholder('Your exact Roblox username')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const q2 = new TextInputBuilder()
      .setCustomId('timezone')
      .setLabel('Timezone')
      .setPlaceholder('e.g. EST, UTC+8, GMT+1')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const q3 = new TextInputBuilder()
      .setCustomId('division')
      .setLabel('Preferred Division')
      .setPlaceholder('Infantry, Militia, Guard, or Navy')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const q4 = new TextInputBuilder()
      .setCustomId('activity')
      .setLabel('Activity Level (1 to 10)')
      .setPlaceholder('How active are you? Enter a number from 1 to 10')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(2);

    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4),
    );

    await interaction.showModal(modal);
  } catch (e) {
    console.error('handleStart error: ' + e.message);
    await interaction.reply({ content: 'Error: ' + e.message, ephemeral: true }).catch(() => {});
  }
}

async function handleModal(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const raw = {
      roblox:   interaction.fields.getTextInputValue('roblox').trim(),
      timezone: interaction.fields.getTextInputValue('timezone').trim(),
      division: interaction.fields.getTextInputValue('division').trim().toLowerCase(),
      activity: interaction.fields.getTextInputValue('activity').trim(),
    };

    const divKey = h.parseDivision(raw.division);
    if (!divKey) {
      return interaction.editReply({
        embeds: [{
          color: config.colors.red,
          title: 'Invalid Division',
          description: 'Please enter one of the following: Infantry, Militia, Guard, Navy.\n\nClick the button again to resubmit.',
        }],
      });
    }

    const activity = h.parseActivity(raw.activity);
    if (!activity) {
      return interaction.editReply({
        embeds: [{
          color: config.colors.red,
          title: 'Invalid Activity Score',
          description: 'Activity must be a number between 1 and 10.\n\nClick the button again to resubmit.',
        }],
      });
    }

    await interaction.editReply({
      embeds: [{ color: config.colors.blue, description: 'Verifying your Roblox account...' }],
    });

    const robloxData = await roblox.getUser(raw.roblox);
    if (!robloxData) {
      return interaction.editReply({
        embeds: [{
          color: config.colors.red,
          title: 'Roblox Account Not Found',
          description: 'Could not find a Roblox account with the username ' + raw.roblox + '.\n\nCheck your spelling and click the button again.',
        }],
      });
    }

    const susResult = sus.analyse(interaction.member);
    const answers   = {
      roblox:   raw.roblox,
      timezone: raw.timezone,
      division: divKey,
      activity: activity.toString(),
    };
    const autoOk = susResult.level === 'clean';

    const app = data.createApp({
      userId:       interaction.user.id,
      guildId:      interaction.guildId,
      answers,
      susScore:     susResult.score,
      susBreakdown: susResult.items,
      robloxData,
      status:       autoOk ? 'accepted' : 'pending',
    });

    await interaction.editReply({ embeds: [E.receipt(app)] });

    const logCh = interaction.guild.channels.cache.get(config.channels.applicationLogs);
    if (logCh) {
      await logCh.send({ embeds: [E.logEntry(app, interaction.member)] }).catch(() => {});
    }

    if (autoOk) {
      const errors = await h.enlist(interaction.member, divKey, robloxData.username);
      const nick   = h.buildNickname(divKey, robloxData.username);
      data.setAppStatus(app.id, { status: 'accepted', reviewedBy: client.user.id, reviewNote: 'Auto approved - clean account' });
      await interaction.user.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
      const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
      if (auditCh) await auditCh.send({ embeds: [E.audit(app, client.user.id, 'accepted', 'Auto approved')] }).catch(() => {});
      if (errors.length) console.warn('Enlist errors: ' + errors.join(', '));
      return;
    }

    const reviewCh = interaction.guild.channels.cache.get(config.channels.staffReview);
    if (reviewCh) {
      const staffRole = interaction.guild.roles.cache.get(config.roles.staff);
      const ping      = staffRole ? staffRole.toString() + ' - New application needs review.' : 'New application needs review.';
      const btns      = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('app_accept_' + app.id).setLabel('Accept').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('app_deny_' + app.id).setLabel('Deny').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('app_interview_' + app.id).setLabel('Interview').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('app_waitlist_' + app.id).setLabel('Waitlist').setStyle(ButtonStyle.Secondary),
      );
      await reviewCh.send({ content: ping, embeds: [E.staffReview(app, interaction.member)], components: [btns] }).catch(() => {});
    }
  } catch (e) {
    console.error('handleModal error: ' + e.message);
    await interaction.editReply({ content: 'Error processing your application: ' + e.message }).catch(() => {});
  }
}

async function handleStaffBtn(interaction) {
  if (!h.isStaff(interaction.member)) {
    return interaction.reply({ content: 'You do not have permission to do this.', ephemeral: true });
  }

  const parts  = interaction.customId.split('_');
  const action = parts[1];
  const appId  = parts.slice(2).join('_');
  const app    = data.getAppById(appId);

  if (!app) {
    return interaction.reply({ content: 'Application not found.', ephemeral: true });
  }
  if (app.status !== 'pending') {
    return interaction.reply({ content: 'This application has already been actioned: ' + app.status, ephemeral: true });
  }

  const labels = {
    accept:    'Acceptance note (optional)',
    deny:      'Denial reason (required)',
    interview: 'Interview note (optional)',
    waitlist:  'Waitlist note (optional)',
  };

  const modal = new ModalBuilder()
    .setCustomId('note_' + action + '_' + appId)
    .setTitle(h.cap(action) + ' Application');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('note')
        .setLabel(labels[action] || 'Note')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(action === 'deny')
        .setMaxLength(500)
    )
  );

  await interaction.showModal(modal);
}

async function handleNote(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const parts     = interaction.customId.split('_');
    const action    = parts[1];
    const appId     = parts.slice(2).join('_');
    const note      = interaction.fields.getTextInputValue('note')?.trim() || null;
    const app       = data.getAppById(appId);

    if (!app) return interaction.editReply({ content: 'Application not found.' });
    if (app.status !== 'pending') return interaction.editReply({ content: 'Already actioned: ' + app.status });

    const statusMap = { accept: 'accepted', deny: 'denied', interview: 'interview', waitlist: 'waitlisted' };
    const newStatus = statusMap[action];
    if (!newStatus) return interaction.editReply({ content: 'Unknown action.' });

    data.setAppStatus(appId, { status: newStatus, reviewedBy: interaction.user.id, reviewNote: note });

    const guild  = interaction.guild;
    const member = await guild.members.fetch(app.userId).catch(() => null);

    if (action === 'accept' && member) {
      const errors = await h.enlist(member, app.answers.division, app.robloxData?.username || app.answers.roblox);
      const nick   = h.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox);
      await member.user.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
      if (errors.length) console.warn('Accept errors: ' + errors.join(', '));
    }

    if (action === 'deny') {
      if (member) await member.user.send({ embeds: [E.denyDM(app, note)] }).catch(() => {});
      const denials = data.countDenials(app.userId);
      if (denials >= config.autoBlacklistAfter) {
        data.addBlacklist(app.userId, 'Auto blacklisted after ' + denials + ' denials', client.user.id);
        await interaction.followUp({ content: '<@' + app.userId + '> has been auto blacklisted after ' + denials + ' denials.', ephemeral: true }).catch(() => {});
      }
    }

    if (action === 'interview' && member) await member.user.send({ embeds: [E.interviewDM(app)] }).catch(() => {});
    if (action === 'waitlist'  && member) await member.user.send({ embeds: [E.waitlistDM(app, note)] }).catch(() => {});

    const auditCh = guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) await auditCh.send({ embeds: [E.audit(app, interaction.user.id, newStatus, note)] }).catch(() => {});

    if (interaction.message) {
      await interaction.message.edit({ components: [] }).catch(() => {});
    }

    const msgs = {
      accepted:   'Application accepted. Roles and nickname assigned.',
      denied:     'Application denied. Applicant notified.',
      interview:  'Interview requested. Applicant notified.',
      waitlisted: 'Application waitlisted. Applicant notified.',
    };
    await interaction.editReply({ content: msgs[newStatus] || 'Done.' });
  } catch (e) {
    console.error('handleNote error: ' + e.message);
    await interaction.editReply({ content: 'Error: ' + e.message }).catch(() => {});
  }
}
