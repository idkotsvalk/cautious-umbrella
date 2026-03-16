const { SlashCommandBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const h      = require('../utils/helpers');
const E      = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('forceaccept').setDescription('Force accept a pending application')
    .addUserOption(o => o.setName('user').setRequired(true).setDescription('Applicant'))
    .addStringOption(o => o.setName('note').setDescription('Optional note')),
  async execute(interaction) {
    if (!h.isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const note   = interaction.options.getString('note') || null;
    const apps   = data.getAppsByUser(target.id).filter(a => a.status === 'pending');
    if (!apps.length) return interaction.editReply({ content: target.tag + ' has no pending applications.' });
    const app    = apps[0];
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    data.setAppStatus(app.id, { status: 'accepted', reviewedBy: interaction.user.id, reviewNote: note || 'Force accepted' });
    if (member) {
      await h.enlist(member, app.answers.division, app.robloxData?.username || app.answers.roblox);
      const nick = h.buildNickname(app.answers.division, app.robloxData?.username || app.answers.roblox);
      await target.send({ embeds: [E.acceptDM(app, nick)] }).catch(() => {});
    }
    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) await auditCh.send({ embeds: [E.audit(app, interaction.user.id, 'accepted', note || 'Force accepted')] }).catch(() => {});
    await interaction.editReply({ content: target.tag + ' has been force accepted.' });
  },
};
