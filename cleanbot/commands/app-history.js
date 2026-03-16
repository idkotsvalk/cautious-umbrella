const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-history').setDescription('Full application history of a user')
    .addUserOption(o => o.setName('user').setDescription('User to look up').setRequired(true)),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const apps   = data.getAppsByUser(target.id);
    if (!apps.length) return interaction.reply({ content: target.tag + ' has no applications.', ephemeral: true });
    const fields = apps.slice(0, 10).map(a => ({
      name:  a.id + ' - ' + a.status.toUpperCase(),
      value: 'Division: ' + cap(a.answers.division) + '\nRoblox: ' + (a.robloxData?.username || a.answers.roblox) + '\nActivity: ' + a.answers.activity + '/10\nSus: ' + a.susScore + '/22' + (a.reviewNote ? '\nNote: ' + a.reviewNote : ''),
    }));
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Application History - ' + target.tag).addFields(fields).setFooter({ text: apps.length + ' total' }).setTimestamp()], ephemeral: true });
  },
};
