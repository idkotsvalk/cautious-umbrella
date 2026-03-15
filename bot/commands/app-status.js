const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data    = require('../utils/data');
const config  = require('../config');
const { isStaff, ts, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-status').setDescription("Check your or another user's application status")
    .addUserOption(o => o.setName('user').setDescription('(Staff) Check another user')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target && !isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const user   = target || interaction.user;
    const app    = await data.getLatestApp(user.id);
    if (!app) return interaction.reply({ embeds: [{ color: config.colors.info, title: '📋 No Application', description: `${user} has not applied yet.` }], ephemeral: true });

    const colors = { accepted: config.colors.success, denied: config.colors.danger, pending: config.colors.warn, waitlisted: config.colors.warn, interview: config.colors.interview };
    const labels = { accepted: '✅ ACCEPTED', denied: '❌ DENIED', pending: '⏳ UNDER REVIEW', waitlisted: '🔁 WAITLISTED', interview: '📋 INTERVIEW' };

    const embed = new EmbedBuilder()
      .setColor(colors[app.status] || config.colors.accent)
      .setTitle(`📋  Status — ${labels[app.status] || app.status.toUpperCase()}`)
      .setThumbnail(app.robloxData?.avatarUrl || user.displayAvatarURL())
      .addFields(
        { name: 'App ID',    value: `\`${app.id}\``,               inline: true },
        { name: 'Status',    value: labels[app.status],            inline: true },
        { name: 'Submitted', value: ts(app.submittedAt),           inline: true },
        { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox, inline: true },
        { name: 'Division',  value: cap(app.answers.division),     inline: true },
        { name: 'Activity',  value: `${app.answers.activity}/10`,  inline: true },
        ...(app.reviewNote ? [{ name: 'Staff Note', value: app.reviewNote }] : []),
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
