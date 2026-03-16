require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token    = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : null;
const clientId = process.env.CLIENT_ID ? process.env.CLIENT_ID.trim() : null;
const guildId  = process.env.GUILD_ID  ? process.env.GUILD_ID.trim()  : null;

// All commands defined here to avoid file loading issues
const commands = [
  new SlashCommandBuilder().setName('panel').setDescription('Post the enlistment panel'),
  new SlashCommandBuilder().setName('app-review').setDescription('List all pending applications'),
  new SlashCommandBuilder().setName('app-stats').setDescription('View application statistics'),
  new SlashCommandBuilder().setName('app-status').setDescription('Check application status').addUserOption(o => o.setName('user').setDescription('User to check')),
  new SlashCommandBuilder().setName('app-history').setDescription('Full application history of a user').addUserOption(o => o.setName('user').setDescription('User to look up').setRequired(true)),
  new SlashCommandBuilder().setName('blacklist').setDescription('Manage the blacklist')
    .addSubcommand(s => s.setName('add').setDescription('Blacklist a user').addUserOption(o => o.setName('user').setRequired(true).setDescription('User')).addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason')))
    .addSubcommand(s => s.setName('remove').setDescription('Remove from blacklist').addUserOption(o => o.setName('user').setRequired(true).setDescription('User')))
    .addSubcommand(s => s.setName('list').setDescription('View all blacklisted users'))
    .addSubcommand(s => s.setName('check').setDescription('Check if user is blacklisted').addUserOption(o => o.setName('user').setRequired(true).setDescription('User'))),
  new SlashCommandBuilder().setName('forceaccept').setDescription('Force accept a pending application').addUserOption(o => o.setName('user').setRequired(true).setDescription('Applicant')).addStringOption(o => o.setName('note').setDescription('Note')),
  new SlashCommandBuilder().setName('forcedeny').setDescription('Force deny a pending application').addUserOption(o => o.setName('user').setRequired(true).setDescription('Applicant')).addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason')),
  new SlashCommandBuilder().setName('discharge').setDescription('Discharge a member').addUserOption(o => o.setName('user').setRequired(true).setDescription('Member')).addStringOption(o => o.setName('reason').setRequired(true).setDescription('Reason')),
  new SlashCommandBuilder().setName('roster').setDescription('View all enlisted members by division'),
  new SlashCommandBuilder().setName('whois').setDescription('View full profile of a member').addUserOption(o => o.setName('user').setRequired(true).setDescription('Member')),
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Deploying ' + commands.length + ' commands...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('Commands deployed successfully.');
  } catch (e) {
    console.error('Deploy failed: ' + e.message);
  } finally {
    process.exit(0);
  }
})();
