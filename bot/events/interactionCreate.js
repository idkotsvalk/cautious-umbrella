const {
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

const config  = require('../config');
const data    = require('../utils/data');
const sus     = require('../utils/sus');
const roblox  = require('../utils/roblox');
const h       = require('../utils/helpers');
const E       = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    console.log(`[interaction] ${interaction.user.tag} — ${interaction.commandName || interaction.customId || 'unknown'}`);
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (cmd) await cmd.execute(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId === 'start_app') {
        await handleStart(interaction);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId === 'app_modal') {
        await handleModal(interaction, client);
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith('note_')) {
        await handleNote(interaction, client);
        return;
      }

      if (interaction.isButton() && interaction.customId.startsWith('app_')) {
        await handleStaffBtn(interaction);
        return;
      }
    } catch (err) {
      console.error('[interaction ERROR]', err.message);
      console.error(err.stack);
      const msg = { content: '❌ Something went wrong.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
      else await interaction.reply(msg).catch(() => {});
    }
  },
};

async function handleStart(interaction) {
  try {
    console.log(`[handleStart] ${interaction.user.tag}`);
    const userId = interaction.user.id;

    console.log('[handleStart] checking blacklist...');
    const blacklisted = await data.isBlacklisted(userId);
    if (blacklisted) {
      const entry = await data.getBlacklistEntry(userId);
      return interaction.reply({
        embeds: [{ color: 0xE74C3C, title: '🚫  Blacklisted', description: `You are blacklisted.\n**Reason:** ${entry?.reason || 'No reason given'}` }],
        ephemeral: true,
      });
    }

    console.log('[handleStart] checking enlisted...');
    const allDivRoles = Object.values(config.roles.divisions).map(d => d.id);
    const alreadyEnlisted = allDivRoles.some(id => interaction.member.roles.cache.has(id)) || interaction.member.roles.cache.has(config.roles.enlisted);
    if (alreadyEnlisted) {
      return interaction.reply({
        embeds: [{ color: 0xF1C40F, title: '⚠️  Already Enlisted', description: 'You are already a member of this regiment.' }],
        ephemeral: true,
      });
    }

    console.log('[handleStart] showing modal...');
    const modal = new ModalBuilder().setCustomId('app_modal').setTitle('Colberg Grenadiers — Enlistment Form');
    const q1 = new TextInputBuilder().setCustomId('roblox').setLabel('Roblox Username').setPlaceholder('Your exact Roblox username').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q2 = new TextInputBuilder().setCustomId('timezone').setLabel('Your Timezone').setPlaceholder('e.g. EST, UTC+8, GMT+1').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q3 = new TextInputBuilder().setCustomId('division').setLabel('Preferred Division').setPlaceholder('Infantry / Militia / Guard / Navy').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20);
    const q4 = new TextInputBuilder().setCustomId('activity').setLabel('Activity Level (1–10)').setPlaceholder('How active are you? 1 = rarely, 10 = daily').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(2);
    modal.addComponents(
      new ActionRowBuilder().addComponents(q1),
      new ActionRowBuilder().addComponents(q2),
      new ActionRowBuilder().addComponents(q3),
      new ActionRowBuilder().addComponents(q4),
    );
    await interaction.showModal(modal);
    console.log('[handleStart] modal shown!');
  } catch (e) {
    console.error('[handleStart ERROR]', e.message, e.stack);
    await interaction.reply({ content: '❌ Error: ' + e.message, ephemeral: true }).catch(() => {});
  }
}

async function handleModal(interaction, client) {
  await interaction.deferReply({ ephemeral: true });

  const raw = {
    roblox:   interaction.fields.getTextInputValue('roblox').trim(),
    timezone: interaction.fields.getTextInputValue('timezone').trim(),
    division: interaction.fields.getTextInputValue('division').trim().toLowerCase(),
    activity: interaction.fields.getTextInputValue('activity').trim(),
  };

  const divKey = h.parseDivision(raw.division);
  if (!divKey) {
    return interaction.editReply({
      embeds: [{ color: 0xE74C3C, title: '❌  Invalid Division', description: 'Please choose: **Infantry**, **Militia**, **Guard**, or **Navy**.\n\nClick the button again to resubmit.' }],
    });
  }

  const activity = h.parseActivity(raw.activity);
  if (!activity) {
    return interaction.editReply({
      embeds: [{ color: 0xE74C3C, title: '❌  Invalid Activity', description: 'Activity must be a number between **1** and **10**.\n\nClick the button again to resubmit.' }],
    });
  }

  await interaction.editReply({ embeds: [{ color: 0x3498DB, description: '🔍  Verifying your Roblox account...' }] });
  const robloxData = await roblox.getUser(raw.roblox);
  if (!robloxData) {
    return interaction.editReply({
      embeds: [{ color: 0xE74C3C, title: '❌  Roblox Not Found', description: `Could not find **${raw.roblox}** on Roblox.\n\nCheck your spelling and click the button again.` }],
    });
  }

  const susResult = sus.analyse(interaction.member);
  const answers   = { roblox: raw.roblox, timezone: raw.timezone, division: divKey, activity: activity.toString() };
  const autoOk    = susResult.level === 'clean';

  const app = await data.createApp({
    userId:       interaction.user.id,
    guildId:      interaction.guildId,
    answers,
    susScore:     susResult.score,
    susBreakdown: susResult.items,
    robloxData,
    status:       autoOk ? 'accepted' : 'pending',
  });

  await interaction.editReply({ embeds: [E.receipt(app)] });

  const logCh = interaction.guild.channels.cache.get(config.channels.applicationLogs);
  let logMsg = null;
  if (logCh) {
    logMsg = await logCh.send({ embeds: [E.logEntry(app, interaction.member)] }).catch(() => null);
    if (logMsg) await logMsg.react('📨
