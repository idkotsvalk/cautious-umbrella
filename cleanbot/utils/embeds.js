const { EmbedBuilder } = require('discord.js');
const config  = require('../config');
const { relTime, fullTime, cap } = require('./helpers');
const { formatBreakdown } = require('./sus');
const { ageString } = require('./roblox');

function panel() {
  return new EmbedBuilder()
    .setColor(config.colors.blue)
    .setTitle(config.serverName + ' - Rekrut Enlistment')
    .setDescription(
      'Welcome to the official enlistment portal for ' + config.serverName + '.\n' +
      'Click the Start Application button below to begin.'
    )
    .addFields(
      {
        name: 'Requirements',
        value: [
          'Valid Roblox account',
          'Active Discord account',
          'Commitment to training and events',
          'Respect for chain of command',
        ].join('\n'),
      },
      {
        name: 'Available Divisions',
        value: 'Infantry\nMilitia\nGuard\nNavy',
      },
      {
        name: 'Process',
        value: [
          '1. Fill in the application form',
          '2. Roblox account is verified automatically',
          '3. Account screening runs instantly',
          '4. Clean account gets auto accepted',
          '5. Flagged account goes to staff review',
          '6. If accepted, roles and nickname are assigned automatically',
        ].join('\n'),
      }
    )
    .setFooter({ text: config.serverName + ' Enlistment System' })
    .setTimestamp();
}

function receipt(app) {
  return new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setTitle('Application Submitted')
    .setDescription('Your application has been received. You will be DM\'d with the result shortly.')
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .addFields(
      { name: 'Application ID',  value: app.id,                                            inline: true },
      { name: 'Status',          value: 'Under Review',                                    inline: true },
      { name: 'Submitted',       value: relTime(app.submittedAt),                          inline: true },
      { name: 'Roblox Username', value: app.robloxData?.username || app.answers.roblox,   inline: true },
      { name: 'Division',        value: cap(app.answers.division),                         inline: true },
      { name: 'Activity',        value: app.answers.activity + ' out of 10',              inline: true },
    )
    .setFooter({ text: 'Save your Application ID for reference' });
}

function staffReview(app, member) {
  const user    = member.user;
  const ageDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const flags   = user.flags?.toArray() || [];
  const sus     = app.susScore;

  let color, susLabel;
  if (sus <= config.sus.autoApproveMax)      { color = config.colors.green;  susLabel = 'CLEAN';     }
  else if (sus <= config.sus.flaggedMax)     { color = config.colors.yellow; susLabel = 'FLAGGED';   }
  else                                        { color = config.colors.red;    susLabel = 'HIGH RISK'; }

  return new EmbedBuilder()
    .setColor(color)
    .setTitle('New Application - ' + susLabel)
    .setDescription('Application from ' + user.tag + ' requires staff review.')
    .setThumbnail(app.robloxData?.avatarUrl || user.displayAvatarURL())
    .addFields(
      { name: 'Application Answers', value: '\u200b' },
      { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox, inline: true },
      { name: 'Division',  value: cap(app.answers.division),                      inline: true },
      { name: 'Activity',  value: app.answers.activity + '/10',                   inline: true },
      { name: 'Timezone',  value: app.answers.timezone,                           inline: true },

      { name: 'Roblox Profile', value: app.robloxData
        ? 'Username: ' + app.robloxData.username + '\nDisplay Name: ' + app.robloxData.displayName + '\nAccount Age: ' + ageString(app.robloxData.created) + '\nCreated: ' + new Date(app.robloxData.created).toDateString()
        : 'Could not verify Roblox account'
      },

      { name: 'Discord Profile', value: [
        'Tag: ' + user.tag,
        'ID: ' + user.id,
        'Account Age: ' + ageDays + ' days',
        'Created: ' + fullTime(user.createdTimestamp),
        'Joined Server: ' + (member.joinedAt ? fullTime(member.joinedTimestamp) : 'Unknown'),
        'Badges: ' + (flags.length ? flags.join(', ') : 'None'),
        'Avatar: ' + (user.avatar ? 'Custom' : 'Default'),
      ].join('\n') },

      { name: 'Suspicion Score: ' + sus + ' out of 22 - ' + susLabel, value: formatBreakdown(app.susBreakdown, sus) },

      { name: 'App ID',    value: app.id,              inline: true },
      { name: 'Submitted', value: relTime(app.submittedAt), inline: true },
    )
    .setFooter({ text: 'User ID: ' + user.id })
    .setTimestamp();
}

function logEntry(app, member) {
  return new EmbedBuilder()
    .setColor(config.colors.blue)
    .setTitle('Application Received - ' + app.id)
    .setThumbnail(app.robloxData?.avatarUrl || member.user.displayAvatarURL())
    .addFields(
      { name: 'Discord',   value: member.user.tag + ' (' + member.user.id + ')', inline: true },
      { name: 'Roblox',    value: app.robloxData?.username || app.answers.roblox, inline: true },
      { name: 'Division',  value: cap(app.answers.division),                      inline: true },
      { name: 'Activity',  value: app.answers.activity + '/10',                   inline: true },
      { name: 'Sus Score', value: app.susScore + '/22',                           inline: true },
      { name: 'Submitted', value: relTime(app.submittedAt),                       inline: true },
    )
    .setFooter({ text: config.serverName })
    .setTimestamp();
}

function audit(app, byId, action, note) {
  const colors = { accepted: config.colors.green, denied: config.colors.red, waitlisted: config.colors.yellow, interview: config.colors.purple };
  const labels = { accepted: 'ACCEPTED', denied: 'DENIED', waitlisted: 'WAITLISTED', interview: 'INTERVIEW REQUESTED' };

  return new EmbedBuilder()
    .setColor(colors[action] || config.colors.blue)
    .setTitle('Audit Log - ' + (labels[action] || action.toUpperCase()))
    .addFields(
      { name: 'App ID',    value: app.id,                              inline: true },
      { name: 'Applicant', value: '<@' + app.userId + '>',             inline: true },
      { name: 'Action By', value: '<@' + byId + '>',                   inline: true },
      { name: 'Roblox',    value: app.robloxData?.username || 'N/A',   inline: true },
      { name: 'Division',  value: cap(app.answers.division),           inline: true },
      { name: 'Note',      value: note || 'No note provided',          inline: false },
    )
    .setFooter({ text: config.serverName + ' Audit Log' })
    .setTimestamp();
}

function acceptDM(app, nickname) {
  return new EmbedBuilder()
    .setColor(config.colors.green)
    .setTitle('Welcome to ' + config.serverName)
    .setDescription(
      'Congratulations, ' + nickname + '!\n\n' +
      'Your enlistment application has been accepted. You are now a member of the ' + cap(app.answers.division) + ' division.\n\n' +
      'Head to <#' + require('../config').channels.training + '> and request training to be promoted to Soldat.'
    )
    .setThumbnail(app.robloxData?.avatarUrl || null)
    .addFields(
      { name: 'Nickname',  value: nickname,                    inline: true },
      { name: 'Division',  value: cap(app.answers.division),  inline: true },
      { name: 'App ID',    value: app.id,                      inline: true },
    )
    .setFooter({ text: config.serverName })
    .setTimestamp();
}

function denyDM(app, reason) {
  return new EmbedBuilder()
    .setColor(config.colors.red)
    .setTitle('Application Denied')
    .setDescription(
      'Your enlistment application for ' + config.serverName + ' has been denied.\n\n' +
      (reason ? 'Reason: ' + reason + '\n\n' : '') +
      'You may re-apply at any time.'
    )
    .addFields({ name: 'App ID', value: app.id })
    .setFooter({ text: config.serverName })
    .setTimestamp();
}

function interviewDM(app) {
  return new EmbedBuilder()
    .setColor(config.colors.purple)
    .setTitle('Interview Requested')
    .setDescription('Your application has been flagged for an interview before a final decision is made. A staff member will contact you shortly.')
    .addFields({ name: 'App ID', value: app.id })
    .setTimestamp();
}

function waitlistDM(app, note) {
  return new EmbedBuilder()
    .setColor(config.colors.yellow)
    .setTitle('Application Waitlisted')
    .setDescription('Your application has been placed on the waitlist.' + (note ? '\n\nNote: ' + note : ''))
    .addFields({ name: 'App ID', value: app.id })
    .setTimestamp();
}

module.exports = { panel, receipt, staffReview, logEntry, audit, acceptDM, denyDM, interviewDM, waitlistDM };
