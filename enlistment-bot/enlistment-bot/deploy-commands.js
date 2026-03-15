const { REST, Routes } = require('discord.js');
const fs     = require('fs');
const path   = require('path');
require('dotenv').config();

const token    = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId  = process.env.GUILD_ID;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data) {
    commands.push(cmd.data.toJSON());
    console.log(`  📦 Queued: /${cmd.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\n🔄  Deploying ${commands.length} command(s) to guild ${guildId}...\n`);
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log(`✅  All commands deployed successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌  Deployment failed:', err.message);
    process.exit(0);  // exit 0 so bot still starts even if commands fail
  }
})();
