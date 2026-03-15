const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const h      = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('discharge').setDescription('Discharge a member — removes all regiment roles and nickname')
    .addUserOption(o => o.setName('user').setDescription('Member to discharge').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),
  async execute(interaction) {
    if (!h.isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.editReply({ content: '❌ Member not found.' });

    const divKey = h.getDivision(member);
    if (!divKey && !member.roles.cache.has(config.roles.enlisted)) return interaction.editReply({ content: `⚠️ ${target} does not appear to be enlisted.` });

    const errors = await h.discharge(member);

    await target.send({ embeds: [new EmbedBuilder().setColor(config.colors.danger).setTitle(`🔴  Discharged from Colberg Grenadiers`).setDescription(`You have been **discharged**.\n\n**Reason:** ${reason}\n\nAll regiment roles and your nickname have been removed.`).setTimestamp()] }).catch(() => {});

    const auditCh = interaction.guild.channels.cache.get(config.channels.auditLog);
    if (auditCh) {
      await auditCh.send({ embeds: [new EmbedBuilder().setColor(config.colors.danger).setTitle('🔴  Audit — DISCHARGED').addFields(
        { name: 'Member',        value: `${target} (\`${target.id}\`)`,          inline: true },
        { name: 'Discharged By', value: `${interaction.user}`,                   inline: true },
        { name: 'Was Division',  value: divKey ? h.cap(divKey) : 'Unknown',      inline: true },
        { name: 'Reason',        value: reason },
      ).setTimestamp()] }).catch(() => {});
    }

    if (errors.length) console.warn('[Discharge]', errors);
    await interaction.editReply({ content: `✅ **${target.tag}** has been discharged.` });
  },
};
