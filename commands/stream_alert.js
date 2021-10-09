const Guild = require('../models/Guild');

module.exports = {
  name: 'stream_alert',
  aliases: ['sa'],
  description: 'Give a role based on reactions to a message',
  usage: '<link to a message> `<role to give>` :<reaction>:',
  example: 'https://discord.com/channels/748581308866887691/811643995755249664/870896674149662800 `Stream Alert` :one:',
  args: true,
  async execute(message, args, client) {
    if (!args[0]) return message.inlineReply('No message link provided.');

    const regexpTest = args[0].match(/^https:\/\/discord\.com\/channels\/(?<guild>\d+?)\/(?<channel>\d+?)\/(?<msg>\d+?)$/);
    const roleToFind = message.content.match(/`(?<role>.+?)`\s(?<emoji>.{1,2})/);
    
    if (!roleToFind || !roleToFind?.groups) message.inlineReply('Invalid message format.');
    const { msg } = regexpTest.groups;
    const { role, emoji } = roleToFind.groups;

    console.log({msg}, {role}, {emoji});
    if (!regexpTest) return message.inlineReply('Invalid link format.');
    if (!role) return message.inlineReply('No role provided.');
    if (!emoji) return message.inlineReply('No reaction emoji provided.');
    const roleToAdd = await message.guild.roles.cache.find((r) => r.name === role || r.id === role);

    if (!roleToAdd) return message.inlineReply(`Role named \`${role}\` not found.`);

    const doc = await Guild.findOne({ id: message.guild.id });
    doc.rolesToWatch.set(msg, { emoji: emoji, id: roleToAdd.id });
    await doc.save();
    return message.inlineReply(`Adding role \`${roleToAdd.name}\` when reacting with ${emoji} to the selected message.`);
  }
};
