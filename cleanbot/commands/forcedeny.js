const { SlashCommandBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const h      = require('../utils/helpers');
const E      = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('forcedeny').setDescription('Force deny a pending application')
    .addUserOption(o => o.setName('user').setRequired(true).setDescription('Applicant'))
    .addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason')),
  async execute(interaction) {
    if (!h.isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const apps   = data.getAppsByUser(target.id).filter(a => a.status === 'pending');
    if (!apps.length) return interaction.editReply({ content: target.tag + ' has no pending applications.' });
    const app = apps[0];
    data.setAppStatus(app.id, { status: 'denied', reviewedBy: interaction.user.id, reviewNote: reason });
    await target.send({ embeds: [E.denyDM(app, reason)] }).catch(() => {});
    const denials = data.countDenials(target.id);
    if (denials >= config.autoBlacklistAfter) {
      data.addBlacklist(target.id, 'Auto blacklisted after ' + denials + ' denials', interaction.user.id);
      await interaction.followUp({ content: target.tag + ' has been auto blacklisted after ' + denials + ' denials.', ephemeral: true }).catch(() => {});
    }
    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) await auditCh.send({ embeds: [E.audit(app, interaction.user.id, 'denied', reason)] }).catch(() => {});
    await interaction.editReply({ content: target.tag + ' has been force denied. Reason: ' + reason });
  },
};
