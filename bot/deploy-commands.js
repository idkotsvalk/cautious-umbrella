const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const token    = process.env.BOT_TOKEN?.trim();
const clientId = process.env.CLIENT_ID?.trim();
const guildId  = process.env.GUILD_ID?.trim();

const commands = [];
const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of files) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data) { commands.push(cmd.data.toJSON()); console.log(`  📦 ${cmd.data.name}`); }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🔄  Deploying ${commands.length} commands...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('✅  Commands deployed!');
  } catch (e) {
    console.error('❌  Deploy failed:', e.message);
  } finally {
    process.exit(0);
  }
})();
