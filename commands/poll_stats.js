const { MessageEmbed } = require('discord.js');
const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'poll_stats',
  aliases: ['ps', 'poll_stat'],
  description: 'Show poll statistics for a message.',
  usage: '<link to a message>',
  example: 'https://discord.com/channels/748581308866887691/811643995755249664/870896674149662800',
  args: true,
  async execute(message, args) {
    if (!args[0]) return message.inlineReply('No link provided');
    const regexpTest = args[0].match(/^https:\/\/discord\.com\/channels\/(?<guild>\d+?)\/(?<channel>\d+?)\/(?<msg>\d+?)$/);
    if (!regexpTest) return message.inlineReply('Invalid link format.');

    const { msg } = regexpTest.groups;
    const filter = { id: msg };
    const doc = await ReactionListener.findOne(filter);

    if (!doc) return message.inlineReply('Did not find a poll that matches that message.');
    const msgToSend = new MessageEmbed().setTitle('Poll statistics')
      .addFields({
        name: 'Poll Author',
        value: `<@${doc.author.id}>`,
        inline: false,
      },
      {
        name: 'Channel',
        value: `<#${doc.sentMessage.channel.id}>`,
        inline: true,
      },
      {
        name: doc.sentMessage.title,
        value: doc.sentMessage.content,
        inline: false,
      });
    const roleEmbeds = {};
    const memberCount = doc.userReactions.size;
    doc.availableRoles.forEach((v, k) => roleEmbeds[v.id] = {
      name: v.name,
      reaction: k,
      playerList: [],
    });
    doc.userReactions.forEach((v, k) => {
      const { role } = v;
      roleEmbeds[role]?.playerList?.push(`<@${k}>`);
    });

    let isTruncated = false;
    for (const role in roleEmbeds) {
      const { playerList } = roleEmbeds[role];
      let playerListStr = playerList.join('\n');
      if (playerListStr.length >= 1024) {
        isTruncated = true;
        playerListStr = playerListStr.slice(0, 1024).replace(/<@\d+$/, '');
      }
      msgToSend.addField(`\`${
        roleEmbeds[role].name}\` - ${
        playerList.length} member${
        playerList.length > 1 ? 's' : playerList.length === 0 ? 's' : ''} (${
        ((playerList.length / memberCount) * 100).toFixed(2)}%)`,
      playerList.length > 0 ? playerListStr : 'No members', true);
    }
    msgToSend.setColor('#ff6c6c');
    if (isTruncated) msgToSend.addField('\u200B', 'Player counts truncated due to size');
    message.inlineReply(msgToSend);
  },
};
