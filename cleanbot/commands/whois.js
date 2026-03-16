const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const data   = require('../utils/data');
const config = require('../config');
const { isStaff, getDivision, cap, relTime, fullTime } = require('../utils/helpers');
const { ageString } = require('../utils/roblox');

module.exports = {
  data: new SlashCommandBuilder().setName('whois').setDescription('View full profile of an enlisted member')
    .addUserOption(o => o.setName('user').setRequired(true).setDescription('Member to look up')),
  async execute(interaction) {
    if (!isStaff(interaction.member)) return interaction.reply({ content: 'No permission.', ephemeral: true });
    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
    const accepted = data.getAppsByUser(target.id).find(a => a.status === 'accepted');
    const allApps  = data.getAppsByUser(target.id);
    const divKey   = getDivision(member);
    const div      = divKey ? config.roles.divisions[divKey] : null;
    const flags    = target.flags?.toArray() || [];
    const ageDays  = Math.floor((Date.now() - target.createdTimestamp) / 86400000);
    await interaction.reply({ embeds: [new EmbedBuilder()
      .setColor(config.colors.blue)
      .setTitle('Member Profile - ' + (member.nickname || target.tag))
      .setThumbnail(accepted?.robloxData?.avatarUrl || target.displayAvatarURL())
      .addFields(
        { name: 'Discord', value: 'Tag: ' + target.tag + '\nID: ' + target.id + '\nAccount Age: ' + ageDays + ' days\nCreated: ' + fullTime(target.createdTimestamp) + '\nJoined: ' + (member.joinedAt ? fullTime(member.joinedTimestamp) : 'Unknown') + '\nBadges: ' + (flags.length ? flags.join(', ') : 'None') },
        { name: 'Regiment Status', value: 'Division: ' + (divKey ? cap(divKey) : 'Not Enlisted') + '\nPrefix: ' + (div ? '{' + div.prefix + '}' : 'N/A') + '\nNickname: ' + (member.nickname || 'Not set') + '\nEnlisted Role: ' + (member.roles.cache.has(config.roles.enlisted) ? 'Yes' : 'No') },
        { name: 'Roblox', value: accepted?.robloxData ? 'Username: ' + accepted.robloxData.username + '\nDisplay Name: ' + accepted.robloxData.displayName + '\nAccount Age: ' + ageString(accepted.robloxData.created) : 'No Roblox account on file' },
        { name: 'Application History', value: 'Total: ' + allApps.length + '\nAccepted: ' + allApps.filter(a => a.status === 'accepted').length + '\nDenied: ' + allApps.filter(a => a.status === 'denied').length + (accepted ? '\nEnlisted Since: ' + relTime(accepted.reviewedAt || accepted.submittedAt) : '') },
      )
      .setFooter({ text: config.serverName + ' Member Profile' })
      .setTimestamp()], ephemeral: true });
  },
};
