const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-stats').setDescription('View application statistics'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const stats = data.getStats();
    const all   = data.getAllApps();
    const divCounts = {};
    for (const k of Object.keys(config.roles.divisions)) divCounts[k] = 0;
    for (const a of all) { if (a.status === 'accepted' && divCounts[a.answers.division] !== undefined) divCounts[a.answers.division]++; }
    const rate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) + '%' : 'N/A';
    const divLines = Object.entries(divCounts).map(([k, c]) => cap(k) + ': ' + c).join('\n');
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.blue).setTitle('Application Statistics')
      .addFields(
        { name: 'Total',        value: String(stats.total || 0),      inline: true },
        { name: 'Accepted',     value: String(stats.accepted || 0),   inline: true },
        { name: 'Denied',       value: String(stats.denied || 0),     inline: true },
        { name: 'Pending',      value: String(stats.pending || 0),    inline: true },
        { name: 'Waitlisted',   value: String(stats.waitlisted || 0), inline: true },
        { name: 'Interview',    value: String(stats.interview || 0),  inline: true },
        { name: 'Accept Rate',  value: rate,                          inline: true },
        { name: 'By Division',  value: divLines || 'None' },
      ).setTimestamp()], ephemeral: true });
  },
};
