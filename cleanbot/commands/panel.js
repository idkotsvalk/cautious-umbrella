const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { panel } = require('../utils/embeds');
const { isStaff } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('panel').setDescription('Post the enlistment panel'),
  async execute(interaction) {
    try {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
      const btn = new ButtonBuilder()
        .setCustomId('start_app')
        .setLabel('Start Application')
        .setStyle(ButtonStyle.Primary);
      await interaction.channel.send({
        embeds: [panel()],
        components: [new ActionRowBuilder().addComponents(btn)],
      });
      await interaction.reply({ content: 'Panel posted.', ephemeral: true });
    } catch (e) {
      console.error('panel command error: ' + e.message);
      await interaction.reply({ content: 'Error: ' + e.message, ephemeral: true }).catch(() => {});
    }
  },
};
