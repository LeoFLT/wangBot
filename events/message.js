const { DMChannel } = require('discord.js');
const GuildModel = require('../models/Guild');

module.exports = {
  name: 'message',
  once: false,
  async execute(message, client) {
    if (message.author.bot || message.channel instanceof DMChannel) return;
    const guildPrefix = await GuildModel.findOne({ id: message.guild.id }) || process.env.PREFIX;
    if (!message.content.startsWith(guildPrefix)) return;
    const args = message.content.slice(guildPrefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find((cmd) => (
      cmd.aliases && cmd.aliases.includes(commandName)));

    if (!command) return;
    if (command.args && !args.length) {
      let reply = 'No arguments were provided';
      if (command.usage) reply += `\n**Usage:**\n\`\`\`${guildPrefix}${commandName} ${command.usage}\`\`\``;
      if (command.example) reply += `\n**Example:**\n${guildPrefix}${commandName} ${command.example}`;
      return message.channel.send(reply);
    }

    try {
      command.execute(message, args);
    } catch (e) {
      console.error(`\n${new Date().toISOString()
        .replace('T', ' ')} - ERROR: commandName: ${commandName}\n`
        + `message: ${e.message}\n`
        + `Error: ${{ e }}`);
      await message.reply('there was an error trying to execute that command');
    }
  },
};
