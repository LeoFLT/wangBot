const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['c', 'h', 'commands', 'command'],
  description: 'returns information about a command',
  usage:
    '<command name>¹\n'
    + '¹: optional, defaults to showing all commands\n',
  example: 'help help',
  args: false,
  isHelp: true,
  execute(message, args, prefix) {
    const messageToSend = new MessageEmbed();
    const { commands } = message.client;
    let largestLen = 0;
    commands.forEach((cmd) => (cmd.name.length > largestLen ? largestLen = cmd.name.length : undefined));
    if (!args.length) {
      const embedFields = [];
      commands.forEach((cmd, i) => embedFields.push({
        name: cmd.name,
        value: cmd.description,
        inline: i % 3 === 0,
      }));
      messageToSend.setTitle('**Command list**')
        .setDescription(`Use ${prefix}help command_name to get detailed information about a certain command.`);
      messageToSend.addFields(...embedFields);
      return message.inlineReply(messageToSend);
    }
    const name = args[0].toLowerCase();
    const command = commands.get(name)
      || commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply("that's not a valid command.");
    }
    messageToSend.addField('**Name**', command.name, true);

    if (command.aliases.length > 0) messageToSend.addField('**Aliases**', command.aliases.join(', '), true);
    if (command.description) messageToSend.addField('**Description**', command.description, false);
    if (command.usage) messageToSend.addField('**Usage**', `${prefix}${command.name} ${command.usage}`, false);
    if (command.example) messageToSend.addField('**Example**', `${prefix}${command.name} ${command.example}`, false);
    return message.inlineReply(messageToSend);
  },
};
