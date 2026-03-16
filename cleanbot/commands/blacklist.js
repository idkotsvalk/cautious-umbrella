const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, relTime } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('blacklist').setDescription('Manage the blacklist')
    .addSubcommand(s => s.setName('add').setDescription('Blacklist a user').addUserOption(o => o.setName('user').setRequired(true).setDescription('User')).addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason')))
    .addSubcommand(s => s.setName('remove').setDescription('Remove from blacklist').addUserOption(o => o.setName('user').setRequired(true).setDescription('User')))
    .addSubcommand(s => s.setName('list').setDescription('View all blacklisted users'))
    .addSubcommand(s => s.setName('check').setDescription('Check if user is blacklisted').addUserOption(o => o.setName('user').setRequired(true).setDescription('User'))),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      const t = interaction.options.getUser('user');
      const r = interaction.options.getString('reason');
      data.addBlacklist(t.id, r, interaction.user.id);
      return interaction.reply({ content: t.tag + ' has been blacklisted. Reason: ' + r, ephemeral: true });
    }
    if (sub === 'remove') {
      const t = interaction.options.getUser('user');
      data.removeBlacklist(t.id);
      return interaction.reply({ content: t.tag + ' has been removed from the blacklist.', ephemeral: true });
    }
    if (sub === 'list') {
      const list = data.getBlacklist();
      if (!list.length) return interaction.reply({ content: 'Nobody is blacklisted.', ephemeral: true });
      const lines = list.map((b, i) => (i+1) + '. <@' + b.userId + '> - ' + b.reason + ' - ' + relTime(b.addedAt));
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.red).setTitle('Blacklist (' + list.length + ')').setDescription(lines.join('\n'))], ephemeral: true });
    }
    if (sub === 'check') {
      const t = interaction.options.getUser('user');
      const e = data.getBlacklistEntry(t.id);
      if (!e) return interaction.reply({ content: t.tag + ' is not blacklisted.', ephemeral: true });
      return interaction.reply({ content: t.tag + ' is blacklisted.\nReason: ' + e.reason + '\nAdded by: <@' + e.addedBy + '>\nAdded: ' + relTime(e.addedAt), ephemeral: true });
    }
  },
};
