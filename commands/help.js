const prefix = process.env.PREFIX;

module.exports = {
  name: 'help',
  description: 'returns information about a command',
  usage:
    '```'
    + `\n${process.env.PREFIX}help <command name>¹\n`
    + '¹: optional, defaults to showing all commands\n'
    + '```',
  aliases: ['c', 'h', 'commands', 'command'],
  args: false,
  execute(message, args, parseCmd) {
    const data = [];
    const { commands } = message.client;
    const commandArr = [];
    commands
      .forEach((command) => (
        !commandArr.includes(command.name) ? commandArr.push(command.name) : null));
    if (!args.length) {
      data.push(
        'Command list:```',
        `${commandArr.sort().join('\n')}\`\`\``,
        `\nUse \`${prefix}help [command name]\` to get more information about a specific command`,
      );
      return message.channel.send(data, { split: true });
    }
    const name = args[0].toLowerCase();
    const command = commands.get(name)
      || commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply("that's not a valid command.");
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases.length > 0) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:**\n${command.usage}`);
    if (command.example) data.push(`**Example:**\n${prefix}${command.example}`);
    message.channel.send(data, { split: true });
  },
};
