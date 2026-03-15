const { EmbedBuilder } = require('discord.js');
const config  = require('../config');
const { ts, tsF, cap } = require('./helpers');
const { formatBreakdown } = require('./sus');
const { ageString } = require('./roblox');

function panel() {
  return new EmbedBuilder()
    .setColor(0x2B5EA7)
    .setTitle('🎖️  Colberg Grenadiers — Enlistment Portal')
    .setDescription('Welcome, aspiring Rekrut! Click **Start Application** below to begin your enlistment.')
    .addFields(
      { name: '📋  Requirements', value: '✅ Valid Roblox account\n✅ Active Discord account\n✅ Commitment to training' },
      { name: '⚔️  Divisions', value: '🗡️ Infantry\n🪖 Militia\n🛡️ Guard\n⚓ Navy' },
      { name: '🔄  Process', value: '1. Fill in the form\n2. Account verified automatically\n3. Clean account = auto accepted\n4. Roles and nickname assigned' },
    )
    .setTimestamp();
}

function receipt(app) {
  return new EmbedBuilder()
    .setColor(config.colors.warn)
    .setTitle('📨  Application Submitted!')
    .setDescription("Your application has been received. You'll be DM'd with the result shortly.")
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .addFields(
      { name: 'Application ID',  value: `\`${app.id}\``,                        inline: true },
      { name: 'Status',          value: '⏳  Under Review',                      inline: true },
      { name: 'Submitted',       value: ts(app.submittedAt),                     inline: true },
      { name: 'Roblox Username', value: app.robloxData?.username || app.answers.roblox, inline: true },
      { name: 'Division',        value: cap(app.answers.division),               inline: true },
      { name: 'Activity',        value: `${app.answers.activity} / 10`,          inline: true },
    )
    .setFooter({ text: 'Keep this ID for reference' });
}

function staffReview(app, member) {
  const user    = member.user;
  const ageDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const flags   = user.flags?.toArray() || [];
  const sus     = app.susScore;

  let color;
  if (sus <= config.sus.autoApproveMax)    color = config.colors.success;
  else if (sus <= config.sus.flaggedMax)   color = config.colors.warn;
  else                                      color = config.colors.danger;

  const susLabel = sus <= config.sus.autoApproveMax ? '✅ CLEAN' : sus <= config.sus.flaggedMax ? '⚠️ FLAGGED' : '🚨 HIGH RISK';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`📋  New Application — ${susLabel}`)
    .setDescription(`Application from ${user} requires staff review.`)
    .setThumbnail(app.robloxData?.avatarUrl || user.displayAvatarURL())
    .addFields(
      { name: '━━━  Answers  ━━━',      value: '\u200b' },
      { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox, inline: true },
      { name: 'Division',  value: cap(app.answers.division), inline: true },
      { name: 'Activity',  value: `${app.answers.activity}/10`, inline: true },
      { name: 'Timezone',  value: app.answers.timezone, inline: true },

      { name: '━━━  Roblox Profile  ━━━', value: '\u200b' },
      {
        name: 'Roblox',
        value: app.robloxData
          ? `**Username:** ${app.robloxData.username}\n**Display Name:** ${app.robloxData.displayName}\n**Account Age:** ${ageString(app.robloxData.created)}\n**Created:** ${new Date(app.robloxData.created).toDateString()}`
          : '⚠️ Could not verify',
      },

      { name: '━━━  Discord Profile  ━━━', value: '\u200b' },
      {
        name: 'Discord',
        value: `**Tag:** ${user.tag}\n**ID:** \`${user.id}\`\n**Account Age:** ${ageDays} days\n**Created:** ${tsF(user.createdTimestamp)}\n**Joined Server:** ${member.joinedAt ? tsF(member.joinedTimestamp) : 'Unknown'}\n**Badges:** ${flags.length ? flags.join(', ') : 'None'}\n**Avatar:** ${user.avatar ? 'Custom' : 'Default'}`,
      },

      { name: '━━━  Suspicion Score  ━━━', value: '\u200b' },
      { name: `Sus Score: ${sus}/22 — ${susLabel}`, value: formatBreakdown(app.susBreakdown, sus) },

      { name: 'App ID',    value: `\`${app.id}\``,   inline: true },
      { name: 'Submitted', value: ts(app.submittedAt), inline: true },
    )
    .setFooter({ text: `User ID: ${user.id}` })
    .setTimestamp();
}

function logEntry(app, member) {
  return new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle(`📝  Application — ${app.id}`)
    .setThumbnail(app.robloxData?.avatarUrl || member.user.displayAvatarURL())
    .addFields(
      { name: 'Discord',   value: `${member.user} (\`${member.user.id}\`)`, inline: true },
      { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox, inline: true },
      { name: 'Division',  value: cap(app.answers.division), inline: true },
      { name: 'Activity',  value: `${app.answers.activity}/10`, inline: true },
      { name: 'Sus Score', value: `${app.susScore}/22`, inline: true },
      { name: 'Submitted', value: ts(app.submittedAt), inline: true },
    )
    .setFooter({ text: 'Colberg Grenadiers Logs' })
    .setTimestamp();
}

function audit(app, byId, action, note) {
  const colors = { accepted: config.colors.success, denied: config.colors.danger, waitlisted: config.colors.warn, interview: config.colors.interview };
  const labels = { accepted: '✅ ACCEPTED', denied: '❌ DENIED', waitlisted: '🔁 WAITLISTED', interview: '📋 INTERVIEW' };

  return new EmbedBuilder()
    .setColor(colors[action] || config.colors.accent)
    .setTitle(`🔏  Audit — ${labels[action] || action.toUpperCase()}`)
    .addFields(
      { name: 'App ID',    value: `\`${app.id}\``,           inline: true },
      { name: 'Applicant', value: `<@${app.userId}>`,         inline: true },
      { name: 'Action By', value: `<@${byId}>`,              inline: true },
      { name: 'Roblox',    value: app.robloxData?.username || '—', inline: true },
      { name: 'Division',  value: cap(app.answers.division), inline: true },
      { name: 'Note',      value: note || '*None*',           inline: false },
    )
    .setFooter({ text: 'Colberg Grenadiers Audit Log' })
    .setTimestamp();
}

function acceptDM(app, nickname) {
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('🎖️  Welcome to the Colberg Grenadiers!')
    .setDescription(`Congratulations, **${nickname}**!\n\nYour enlistment application has been **accepted**. You are now a member of the **${cap(app.answers.division)}** division.\n\nHead to <#${config.channels.training}> and request training to be promoted to **Soldat**!`)
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .addFields(
      { name: '🪪  Nickname', value: nickname,                    inline: true },
      { name: '⚔️  Division', value: cap(app.answers.division),  inline: true },
      { name: '📋  App ID',   value: `\`${app.id}\``,             inline: true },
    )
    .setFooter({ text: 'Colberg Grenadiers — Serve with honour' })
    .setTimestamp();
}

function denyDM(app, reason) {
  return new EmbedBuilder()
    .setColor(config.colors.danger)
    .setTitle('❌  Application Denied')
    .setDescription(`Your enlistment application for **Colberg Grenadiers** has been **denied**.\n\n${reason ? `**Reason:** ${reason}\n\n` : ''}You may re-apply at any time.`)
    .addFields({ name: 'App ID', value: `\`${app.id}\``, inline: true })
    .setFooter({ text: 'Colberg Grenadiers Enlistment' })
    .setTimestamp();
}

function interviewDM(app) {
  return new EmbedBuilder()
    .setColor(config.colors.interview)
    .setTitle('📋  Interview Requested')
    .setDescription('Your application has been flagged for an **interview**. A staff member will reach out to you shortly.')
    .addFields({ name: 'App ID', value: `\`${app.id}\``, inline: true })
    .setTimestamp();
}

function waitlistDM(app, note) {
  return new EmbedBuilder()
    .setColor(config.colors.warn)
    .setTitle('🔁  Application Waitlisted')
    .setDescription(`Your application has been placed on the **waitlist**.\n\n${note ? `**Note:** ${note}` : ''}`)
    .addFields({ name: 'App ID', value: `\`${app.id}\``, inline: true })
    .setTimestamp();
}

module.exports = { panel, receipt, staffReview, logEntry, audit, acceptDM, denyDM, interviewDM, waitlistDM };
