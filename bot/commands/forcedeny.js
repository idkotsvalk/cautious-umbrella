const { SlashCommandBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const h      = require('../utils/helpers');
const E      = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('forcedeny').setDescription('Manually deny a pending application')
    .addUserOption(o => o.setName('user').setDescription('Applicant').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
  async execute(interaction) {
    if (!h.isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const apps   = (await data.getAppsByUser(target.id)).filter(a => a.status === 'pending');
    if (!apps.length) return interaction.editReply({ content: `⚠️ ${target} has no pending applications.` });
    const app = apps[0];
    await data.setAppStatus(app.id, { status: 'denied', reviewedBy: interaction.user.id, reviewNote: reason });
    await target.send({ embeds: [E.denyDM(app, reason)] }).catch(() => {});
    const denials = await data.countDenials(target.id);
    if (denials >= config.autoBlacklistAfter) {
      await data.addBlacklist(target.id, `Auto-blacklisted after ${denials} denials`, interaction.user.id);
      await interaction.followUp({ content: `⚠️ ${target} was auto-blacklisted.`, ephemeral: true }).catch(() => {});
    }
    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) await auditCh.send({ embeds: [E.audit(app, interaction.user.id, 'denied', reason)] }).catch(() => {});
    await interaction.editReply({ content: `❌ **${target.tag}** force-denied.` });
  },
};
