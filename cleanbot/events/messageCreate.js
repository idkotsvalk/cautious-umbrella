const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config');
const data   = require('../utils/data');
const h      = require('../utils/helpers');
const E      = require('../utils/embeds');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args    = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const member  = message.member;

    try {
      if (command === 'panel') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const btn = new ButtonBuilder()
          .setCustomId('start_app')
          .setLabel('Start Application')
          .setStyle(ButtonStyle.Primary);
        await message.channel.send({
          embeds: [E.panel()],
          components: [new ActionRowBuilder().addComponents(btn)],
        });
        await message.delete().catch(() => {});
      }

      else if (command === 'app-review') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const pending = data.getPendingApps();
        if (!pending.length) return message.reply('No pending applications.');
        const lines = pending.map((a, i) => (i + 1) + '. ' + a.id + ' - <@' + a.userId + '> - ' + h.cap(a.answers.division) + ' - Sus: ' + a.susScore + '/22');
        await message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.yellow).setTitle('Pending Applications (' + pending.length + ')').setDescription(lines.join('\n'))] });
      }

      else if (command === 'app-stats') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const stats = data.getStats();
        await message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Application Statistics')
          .addFields(
            { name: 'Total',     value: String(stats.total || 0),      inline: true },
            { name: 'Accepted',  value: String(stats.accepted || 0),   inline: true },
            { name: 'Denied',    value: String(stats.denied || 0),     inline: true },
            { name: 'Pending',   value: String(stats.pending || 0),    inline: true },
            { name: 'Waitlist',  value: String(stats.waitlisted || 0), inline: true },
            { name: 'Interview', value: String(stats.interview || 0),  inline: true },
          )] });
      }

      else if (command === 'blacklist') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const sub     = args[0];
        const mention = message.mentions.users.first();

        if (sub === 'list') {
          const list = data.getBlacklist();
          if (!list.length) return message.reply('Nobody is blacklisted.');
          const lines = list.map((b, i) => (i + 1) + '. <@' + b.userId + '> - ' + b.reason);
          return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.red).setTitle('Blacklist (' + list.length + ')').setDescription(lines.join('\n'))] });
        }
        if (!mention) return message.reply('Please mention a user. Example: !blacklist add @user reason');
        if (sub === 'add') {
          const reason = args.slice(2).join(' ');
          if (!reason) return message.reply('Please provide a reason. Example: !blacklist add @user reason here');
          data.addBlacklist(mention.id, reason, message.author.id);
          return message.reply(mention.tag + ' has been blacklisted. Reason: ' + reason);
        }
        if (sub === 'remove') {
          data.removeBlacklist(mention.id);
          return message.reply(mention.tag + ' has been removed from the blacklist.');
        }
        if (sub === 'check') {
          const entry = data.getBlacklistEntry(mention.id);
          if (!entry) return message.reply(mention.tag + ' is not blacklisted.');
          return message.reply(mention.tag + ' is blacklisted. Reason: ' + entry.reason);
        }
      }

      else if (command === 'forceaccept') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const mention = message.mentions.users.first();
        if (!mention) return message.reply('Mention a user. Example: !forceaccept @user');
        const apps = data.getAppsByUser(mention.id).filter(a => a.status === 'pending');
        if (!apps.length) return message.reply(mention.tag + ' has no pending applications.');
        const app    = apps[0];
        const target = await message.guild.members.fetch(mention.id).catch(() => null);
        data.setAppStatus(app.id, { status: 'accepted', reviewedBy: message.author.id, reviewNote: 'Force accepted' });
        if (target) {
          await h.enlist(target, app.answers.division, app.robloxData?.username || app.answers.roblox);
          const nick = h.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox);
          await mention.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
        }
        const auditCh = message.guild.channels.cache.get(config.channels.auditLog);
        if (auditCh) await auditCh.send({ embeds: [E.audit(app, message.author.id, 'accepted', 'Force accepted')] }).catch(() => {});
        return message.reply(mention.tag + ' has been force accepted.');
      }

      else if (command === 'forcedeny') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const mention = message.mentions.users.first();
        if (!mention) return message.reply('Mention a user. Example: !forcedeny @user reason');
        const reason = args.slice(2).join(' ') || 'No reason given';
        const apps   = data.getAppsByUser(mention.id).filter(a => a.status === 'pending');
        if (!apps.length) return message.reply(mention.tag + ' has no pending applications.');
        const app = apps[0];
        data.setAppStatus(app.id, { status: 'denied', reviewedBy: message.author.id, reviewNote: reason });
        await mention.send({ embeds: [E.denyDM(app, reason)] }).catch(() => {});
        const auditCh = message.guild.channels.cache.get(config.channels.auditLog);
        if (auditCh) await auditCh.send({ embeds: [E.audit(app, message.author.id, 'denied', reason)] }).catch(() => {});
        return message.reply(mention.tag + ' has been force denied. Reason: ' + reason);
      }

      else if (command === 'discharge') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const mention = message.mentions.users.first();
        if (!mention) return message.reply('Mention a user. Example: !discharge @user reason');
        const reason = args.slice(2).join(' ') || 'No reason given';
        const target = await message.guild.members.fetch(mention.id).catch(() => null);
        if (!target) return message.reply('Member not found.');
        await h.discharge(target);
        await mention.send('You have been discharged from ' + config.serverName + '. Reason: ' + reason).catch(() => {});
        const auditCh = message.guild.channels.cache.get(config.channels.auditLog);
        if (auditCh) {
          await auditCh.send({ embeds: [new EmbedBuilder().setColor(config.colors.red).setTitle('Audit Log - DISCHARGED')
            .addFields(
              { name: 'Member',        value: mention.tag + ' (' + mention.id + ')', inline: true },
              { name: 'Discharged By', value: message.author.tag,                    inline: true },
              { name: 'Reason',        value: reason },
            ).setTimestamp()] }).catch(() => {});
        }
        return message.reply(mention.tag + ' has been discharged.');
      }

      else if (command === 'roster') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        await message.guild.members.fetch();
        const fields = [];
        let total = 0;
        for (const [key, div] of Object.entries(config.roles.divisions)) {
          const role = message.guild.roles.cache.get(div.id);
          if (!role) continue;
          total += role.members.size;
          const list = role.members.size
            ? role.members.map(m => m.user.tag + (m.nickname ? ' (' + m.nickname + ')' : '')).join('\n').slice(0, 1000)
            : 'No members';
          fields.push({ name: h.cap(key) + ' - ' + role.members.size + ' members', value: list });
        }
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Roster - ' + total + ' enlisted').addFields(fields).setTimestamp()] });
      }

      else if (command === 'app-history') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const mention = message.mentions.users.first();
        if (!mention) return message.reply('Mention a user. Example: !app-history @user');
        const apps = data.getAppsByUser(mention.id);
        if (!apps.length) return message.reply(mention.tag + ' has no applications.');
        const lines = apps.slice(0, 10).map((a, i) =>
          (i + 1) + '. ' + a.id + ' - ' + a.status.toUpperCase() + ' - ' + h.cap(a.answers.division) + ' - Sus: ' + a.susScore + '/22'
        );
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Application History - ' + mention.tag).setDescription(lines.join('\n')).setFooter({ text: apps.length + ' total applications' })] });
      }

      else if (command === 'app-status') {
        if (!h.isStaff(member)) return message.reply('No permission.');
        const mention = message.mentions.users.first() || message.author;
        const app     = data.getLatestApp(mention.id);
        if (!app) return message.reply(mention.tag + ' has no applications.');
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Application Status - ' + app.status.toUpperCase())
          .addFields(
            { name: 'App ID',    value: app.id,                                            inline: true },
            { name: 'Status',    value: app.status.toUpperCase(),                          inline: true },
            { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox,   inline: true },
            { name: 'Division',  value: h.cap(app.answers.division),                      inline: true },
            { name: 'Activity',  value: app.answers.activity + '/10',                     inline: true },
            { name: 'Sus Score', value: app.susScore + '/22',                             inline: true },
            ...(app.reviewNote ? [{ name: 'Staff Note', value: app.reviewNote }] : []),
          )] });
      }

      else if (command === 'help') {
        return message.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Staff Commands')
          .setDescription([
            '!panel - Post the enlistment panel',
            '!app-review - List pending applications',
            '!app-stats - Application statistics',
            '!app-status @user - Check application status',
            '!app-history @user - Full application history',
            '!blacklist list - View blacklist',
            '!blacklist add @user reason - Blacklist a user',
            '!blacklist remove @user - Remove from blacklist',
            '!blacklist check @user - Check if blacklisted',
            '!forceaccept @user - Force accept application',
            '!forcedeny @user reason - Force deny application',
            '!discharge @user reason - Discharge a member',
            '!roster - View all enlisted members',
          ].join('\n'))] });
      }

    } catch (e) {
      console.error('Message command error [' + command + ']: ' + e.message);
      await message.reply('Error: ' + e.message).catch(() => {});
    }
  },
};
