const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, ts, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-review').setDescription('List all pending applications'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const pending = await data.getPendingApps();
    if (!pending.length) return interaction.reply({ embeds: [{ color: config.colors.success, title: '✅ No Pending Apps', description: 'No applications waiting for review.' }], ephemeral: true });
    const lines = pending.map((a, i) => `**${i+1}.** \`${a.id}\` — <@${a.userId}> — **${cap(a.answers.division)}** — Sus: ${a.susScore}/22 — ${ts(a.submittedAt)}`);
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warn).setTitle(`📋  Pending (${pending.length})`).setDescription(lines.join('\n')).setTimestamp()], ephemeral: true });
  },
};
