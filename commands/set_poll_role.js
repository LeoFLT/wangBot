const { MessageEmbed } = require('discord.js');
const Guild = require('../models/Guild');

module.exports = {
  name: 'set_poll_role',
  aliases: ['spr', 'set_role_poll'],
  description: 'Sets the role users need to have to listen to updates. Use -d to disable this feature. Use -c to see the current role.',
  usage: '-<d|c> | \`<Role Name>\`',
  example: '`Survivor`',
  args: true,
  async execute(message, args) {
    if (args.length < 1) return message.inlineReply('Missing parameters.');
    const regexpTest = message.content.match(/`(?<roleName>.+?)`$|(?<disable>-d|-disable|-c|-current)$/);
    if (!regexpTest) return message.inlineReply('Unable to parse the passed arguments.');
    const { roleName, disable } = regexpTest.groups;
    const updatedSchema = {};
    if (roleName) {
      const roleToApply = await message.guild.roles.cache.find((role) => role.name === roleName);
      if (!roleToApply) return message.inlineReply(`Unable to find a role in this server called \`${roleName}\`.`);
      updatedSchema.survivorRole = { id: roleToApply.id, name: roleToApply.name };
    } else if (disable === '-c' || disable === '-current') {
      const docToFind = await Guild.findOne({ id: message.guild.id });
      return message.inlineReply(`The current role for survivor is${docToFind?.survivorRole?.name ? `: \`${docToFind.survivorRole.name}\`` : ' not set'}`);
    } else if (disable) {
      updatedSchema.survivorRole = {
        id: null,
        name: null,
      };
    } else return;
    const docToUpdate = await Guild.findOneAndUpdate({ id: message.guild.id }, updatedSchema);
    message.inlineReply(`Survivor role ${updatedSchema.survivorRole.name ? `set to \`${updatedSchema.survivorRole.name}\`` : 'disabled'}.`);
  },
};
