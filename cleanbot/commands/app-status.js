const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-status').setDescription('Check application status')
    .addUserOption(o => o.setName('user').setDescription('User to check')),
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target && !isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const user = target || interaction.user;
    const app  = data.getLatestApp(user.id);
    if (!app) return interaction.reply({ content: user.tag + ' has no applications.', ephemeral: true });
    const colors = { accepted: config.colors.green, denied: config.colors.red, pending: config.colors.yellow, waitlisted: config.colors.yellow, interview: config.colors.purple };
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(colors[app.status] || config.colors.blue).setTitle('Application Status - ' + app.status.toUpperCase())
      .setThumbnail(app.robloxData?.avatarUrl || user.displayAvatarURL())
      .addFields(
        { name: 'App ID',   value: app.id,                                           inline: true },
        { name: 'Status',   value: app.status.toUpperCase(),                         inline: true },
        { name: 'Roblox',   value: app.robloxData?.username || app.answers.roblox,  inline: true },
        { name: 'Division', value: cap(app.answers.division),                        inline: true },
        { name: 'Activity', value: app.answers.activity + '/10',                     inline: true },
        ...(app.reviewNote ? [{ name: 'Staff Note', value: app.reviewNote }] : []),
      ).setTimestamp()], ephemeral: true });
  },
};
