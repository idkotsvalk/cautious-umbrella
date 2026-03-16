require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// Keep alive HTTP server for Render
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('online');
}).listen(PORT, () => console.log('HTTP server running on port ' + PORT));

// Self ping every 1 minute to prevent Render sleeping
function ping() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) return;
  https.get(url).on('error', () => {});
}
ping();
setInterval(ping, 60 * 1000);

// Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd.data && cmd.execute) {
    client.commands.set(cmd.data.name, cmd);
    console.log('Command loaded: /' + cmd.data.name);
  }
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const ev = require(path.join(__dirname, 'events', file));
  if (ev.once) {
    client.once(ev.name, (...args) => ev.execute(...args, client));
  } else {
    client.on(ev.name, (...args) => ev.execute(...args, client));
  }
  console.log('Event loaded: ' + ev.name);
}

// Error handlers
client.on('error', e => console.error('Client error: ' + e.message));
client.on('warn',  m => console.warn('Warning: ' + m));

// Login
const TOKEN = process.env.BOT_TOKEN ? process.env.BOT_TOKEN.trim() : null;
if (!TOKEN) {
  console.error('BOT_TOKEN is missing');
  process.exit(1);
}

client.login(TOKEN).then(() => {
  console.log('Login successful');
}).catch(e => {
  console.error('Login failed: ' + e.message);
  process.exit(1);
});
