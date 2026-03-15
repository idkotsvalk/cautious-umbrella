const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, ts } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('blacklist').setDescription('Manage the blacklist')
    .addSubcommand(s => s.setName('add').setDescription('Blacklist a user').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove from blacklist').addUserOption(o => o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s => s.setName('list').setDescription('View all blacklisted users'))
    .addSubcommand(s => s.setName('check').setDescription('Check if user is blacklisted').addUserOption(o => o.setName('user').setDescription('User').setRequired(true))),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const t = interaction.options.getUser('user');
      const r = interaction.options.getString('reason');
      await data.addBlacklist(t.id, r, interaction.user.id);
      return interaction.reply({ embeds: [{ color: config.colors.danger, title: '🚫 Blacklisted', description: `${t} — **${r}**` }], ephemeral: true });
    }
    if (sub === 'remove') {
      const t = interaction.options.getUser('user');
      if (!(await data.isBlacklisted(t.id))) return interaction.reply({ content: `⚠️ ${t} is not blacklisted.`, ephemeral: true });
      await data.removeBlacklist(t.id);
      return interaction.reply({ embeds: [{ color: config.colors.success, title: '✅ Removed', description: `${t} can now apply again.` }], ephemeral: true });
    }
    if (sub === 'list') {
      const list = await data.getBlacklist();
      if (!list.length) return interaction.reply({ content: '✅ Nobody is blacklisted.', ephemeral: true });
      const lines = list.map((b, i) => `**${i+1}.** <@${b.userId}> — ${b.reason} — ${ts(b.addedAt)}`);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.danger).setTitle(`🚫 Blacklist (${list.length})`).setDescription(lines.join('\n'))], ephemeral: true });
    }
    if (sub === 'check') {
      const t = interaction.options.getUser('user');
      const e = await data.getBlacklistEntry(t.id);
      if (!e) return interaction.reply({ content: `✅ ${t} is not blacklisted.`, ephemeral: true });
      return interaction.reply({ embeds: [{ color: config.colors.danger, title: '🚫 Blacklisted', description: `**Reason:** ${e.reason}\n**Added by:** <@${e.addedBy}>\n**Added:** ${ts(e.addedAt)}` }], ephemeral: true });
    }
  },
};
