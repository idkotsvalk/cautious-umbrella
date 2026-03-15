const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, getDivision, ts, tsF, cap } = require('../utils/helpers');
const { ageString } = require('../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder().setName('whois').setDescription('View full profile of an enlisted member')
    .addUserOption(o => o.setName('user').setDescription('Member to look up').setRequired(true)),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: '❌ No permission.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });

    const accepted  = (await data.getAppsByUser(target.id)).find(a => a.status === 'accepted');
    const allApps   = await data.getAppsByUser(target.id);
    const divKey    = getDivision(member);
    const div       = divKey ? config.roles.divisions[divKey] : null;
    const flags     = target.flags?.toArray() || [];
    const ageDays   = Math.floor((Date.now() - target.createdTimestamp) / 86400000);

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`👤  ${member.nickname || target.tag}`)
      .setThumbnail(accepted?.robloxData?.avatarUrl || target.displayAvatarURL())
      .addFields(
        { name: '💬  Discord', value: `**Tag:** ${target.tag}\n**ID:** \`${target.id}\`\n**Age:** ${ageDays} days\n**Created:** ${tsF(target.createdTimestamp)}\n**Joined:** ${member.joinedAt ? tsF(member.joinedTimestamp) : 'Unknown'}\n**Badges:** ${flags.length ? flags.join(', ') : 'None'}` },
        { name: '⚔️  Regiment', value: `**Division:** ${divKey ? cap(divKey) : '❌ Not Enlisted'}\n**Prefix:** ${div ? `\`{${div.prefix}}\`` : '—'}\n**Nickname:** ${member.nickname || '*Not set*'}\n**Enlisted Role:** ${member.roles.cache.has(config.roles.enlisted) ? '✅' : '❌'}` },
        { name: '🎮  Roblox', value: accepted?.robloxData ? `**Username:** ${accepted.robloxData.username}\n**Display:** ${accepted.robloxData.displayName}\n**Age:** ${ageString(accepted.robloxData.created)}` : '*No Roblox on file*' },
        { name: '📋  Applications', value: `**Total:** ${allApps.length}\n**Accepted:** ${allApps.filter(a=>a.status==='accepted').length}\n**Denied:** ${allApps.filter(a=>a.status==='denied').length}${accepted ? `\n**Enlisted Since:** ${ts(accepted.reviewedAt||accepted.submittedAt)}` : ''}` },
      )
      .setFooter({ text: 'Colberg Grenadiers Member Profile' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
