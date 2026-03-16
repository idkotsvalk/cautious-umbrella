const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-review').setDescription('List all pending applications'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const pending = data.getPendingApps();
    if (!pending.length) return interaction.reply({ content: 'No pending applications.', ephemeral: true });
    const lines = pending.map((a, i) => (i+1) + '. ' + a.id + ' - <@' + a.userId + '> - ' + cap(a.answers.division) + ' - Sus: ' + a.susScore + '/22');
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.yellow).setTitle('Pending Applications (' + pending.length + ')').setDescription(lines.join('\n'))], ephemeral: true });
  },
};
