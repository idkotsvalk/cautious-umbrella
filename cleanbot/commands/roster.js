const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { isStaff, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('roster').setDescription('View all enlisted members by division'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    await interaction.deferReply();
    await interaction.guild.members.fetch();
    const fields = [];
    let total = 0;
    for (const [key, div] of Object.entries(config.roles.divisions)) {
      const role = interaction.guild.roles.cache.get(div.id);
      if (!role) continue;
      total += role.members.size;
      const list = role.members.size
        ? role.members.map(m => m.user.tag + (m.nickname ? ' (' + m.nickname + ')' : '')).join('\n').slice(0, 1000)
        : 'No members enrolled';
      fields.push({ name: cap(key) + ' - ' + role.members.size + ' members', value: list });
    }
    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(config.colors.blue)
      .setTitle(config.serverName + ' Roster')
      .setDescription('Total enlisted: ' + total)
      .addFields(fields)
      .setTimestamp()] });
  },
};
