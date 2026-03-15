const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('roster').setDescription('View all enlisted members by division'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    const emojis = { infantry: '🗡️', militia: '🪖', guard: '🛡️', navy: '⚓' };
    const fields = [];
    let total = 0;
    for (const [key, div] of Object.entries(config.roles.divisions)) {
      const role = interaction.guild.roles.cache.get(div.id);
      if (!role) continue;
      total += role.members.size;
      const list = role.members.size
        ? role.members.map(m => `> ${m}${m.nickname ? ` (${m.nickname})` : ''}`).join('\n')
        : '*No members*';
      fields.push({ name: `${emojis[key]||'⚔️'}  ${key.charAt(0).toUpperCase()+key.slice(1)} — ${role.members.size}`, value: list.length > 1000 ? list.slice(0,997)+'...' : list });
    }
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.colors.accent).setTitle('🎖️  Active Roster').setDescription(`**Total Enlisted: ${total}**`).addFields(fields).setFooter({ text: 'Colberg Grenadiers Roster' }).setTimestamp()] });
  },
};
