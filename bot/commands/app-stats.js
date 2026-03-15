const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-stats').setDescription('View application statistics'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const stats = await data.getStats();
    const all   = await data.getAllApps();
    const divCounts = {};
    for (const k of Object.keys(config.roles.divisions)) divCounts[k] = 0;
    for (const a of all) { if (a.status === 'accepted' && divCounts[a.answers.division] !== undefined) divCounts[a.answers.division]++; }
    const rate = stats.total > 0 ? `${Math.round((stats.accepted / stats.total) * 100)}%` : 'N/A';
    const divLines = Object.entries(divCounts).map(([k, c]) => `> **${k.charAt(0).toUpperCase()+k.slice(1)}:** ${c}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('📊  Application Statistics')
      .addFields(
        { name: '📥 Total',     value: `${stats.total}`,         inline: true },
        { name: '✅ Accepted',  value: `${stats.accepted||0}`,   inline: true },
        { name: '❌ Denied',    value: `${stats.denied||0}`,     inline: true },
        { name: '⏳ Pending',   value: `${stats.pending||0}`,    inline: true },
        { name: '🔁 Waitlist',  value: `${stats.waitlisted||0}`, inline: true },
        { name: '📋 Interview', value: `${stats.interview||0}`,  inline: true },
        { name: '📈 Accept Rate', value: rate,                   inline: true },
        { name: '⚔️ By Division', value: divLines || 'None' },
      ).setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
