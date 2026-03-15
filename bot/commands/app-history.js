const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, ts, cap } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('app-history').setDescription('View full application history of a user')
    .addUserOption(o => o.setName('user').setDescription('User to look up').setRequired(true)),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const apps   = await data.getAppsByUser(target.id);
    if (!apps.length) return interaction.reply({ embeds: [{ color: config.colors.info, title: 'No Applications', description: `${target} has never applied.` }], ephemeral: true });
    const e = { accepted:'✅', denied:'❌', pending:'⏳', waitlisted:'🔁', interview:'📋' };
    const fields = apps.slice(0, 10).map(a => ({
      name: `${e[a.status]||'❓'} ${a.id} — ${cap(a.answers.division)}`,
      value: [`**Status:** ${a.status.toUpperCase()}`, `**Roblox:** ${a.robloxData?.username||a.answers.roblox}`, `**Activity:** ${a.answers.activity}/10`, `**Sus:** ${a.susScore}/22`, `**Submitted:** ${ts(a.submittedAt)}`, a.reviewNote ? `**Note:** ${a.reviewNote}` : ''].filter(Boolean).join('\n'),
    }));
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.accent).setTitle(`📋  History — ${target.tag}`).setThumbnail(target.displayAvatarURL()).addFields(fields).setFooter({ text: `${apps.length} total` }).setTimestamp()], ephemeral: true });
  },
};
