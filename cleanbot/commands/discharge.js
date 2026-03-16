const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const h      = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('discharge').setDescription('Discharge a member from the regiment')
    .addUserOption(o => o.setName('user').setRequired(true).setDescription('Member to discharge'))
    .addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason for discharge')),
  async execute(interaction) {
    if (!h.isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.editReply({ content: 'Member not found in this server.' });
    const divKey = h.getDivision(member);
    if (!divKey && !member.roles.cache.has(config.roles.enlisted)) {
      return interaction.editReply({ content: target.tag + ' does not appear to be enlisted.' });
    }
    await h.discharge(member);
    await target.send('You have been discharged from ' + config.serverName + '.\nReason: ' + reason).catch(() => {});
    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) {
      await auditCh.send({ embeds: [new EmbedBuilder().setColor(config.colors.red)
        .setTitle('Audit Log - DISCHARGED')
        .addFields(
          { name: 'Member',        value: target.tag + ' (' + target.id + ')', inline: true },
          { name: 'Discharged By', value: interaction.user.tag,                inline: true },
          { name: 'Was Division',  value: divKey ? h.cap(divKey) : 'Unknown',  inline: true },
          { name: 'Reason',        value: reason },
        ).setTimestamp()] }).catch(() => {});
    }
    await interaction.editReply({ content: target.tag + ' has been discharged.' });
  },
};
