const { DMChannel } = require('discord.js');
const GuildModel = require('../models/Guild');

module.exports = {
  name: 'message',
  once: false,
  async execute(message, client) {
    if (message.author.bot || message.channel instanceof DMChannel) return;
    let findPrefix = await GuildModel.findOne({ id: message.guild.id });
    if (!findPrefix) findPrefix = await new GuildModel({ id: message.guild.id }).save();
    const guildPrefix = findPrefix.prefix;
    if (!message.content.startsWith(guildPrefix)) return;
    const args = message.content.slice(guildPrefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find((cmd) => (
      cmd.aliases && cmd.aliases.includes(commandName)));

    if (!command) return;
    if (command.args && !args.length) {
      return client.commands.get('help').execute(message, [command.name], guildPrefix);
    }

    try {
      if (command.isHelp) command.execute(message, args, guildPrefix);
      else command.execute(message, args, client);
    } catch (e) {
      console.error(`\n${new Date().toISOString()
        .replace('T', ' ')} - ERROR: commandName: ${commandName}\n`
        + `message: ${e.message}\n`
        + `Error: ${{ e }}`);
      await message.reply('there was an error trying to execute that command');
    }
  },
};
