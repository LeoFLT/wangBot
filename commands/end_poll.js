const { MessageEmbed } = require('discord.js');
const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'end_poll',
  description: 'End the linked poll and reply to the original message with the results.',
  example: '-w \\`Role Name\\` "The correct answer was :one:" https://discord.com/channels/748581308866887691/811643995755249664/870896674149662800',
  aliases: ['ep', 'end_poll'],
  args: true,
  async execute(message) {
    const argsRegex = message.content.match(/(?:-w|-wr|-winner|-winner_role|-c|-cr|-correct|correct_role)\s`(?<roleToFind>.+?)`\s(?:(?<delim>'|"|`|\?#|<|{)(?<msg>.+?)\k<delim>)\s(?:https:\/\/discord\.com\/channels\/(?<guild>\d+?)\/(?<channel>\d+?)\/(?<msgId>\d+?))$/);
    if (!argsRegex) return message.inlineReply('Missing parameters for the command.');
    const {
      roleToFind, guild, channel, msg, msgId,
    } = argsRegex.groups;

    const guildObj = await message.client.guilds.fetch(guild);
    const roleObj = await guildObj.roles.cache.find((r) => r.name.toLowerCase() === roleToFind.toLowerCase());
    const channelObj = await guildObj.channels.cache.get(channel);
    const msgObj = await channelObj.messages.fetch(msgId);

    if (!guildObj) return message.inlineReply('Invalid data given for parameter `Discord link`.');
    if (!roleObj) return message.inlineReply(`Role ${roleToFind} not found.`);
    if (!channelObj) return message.inlineReply('Channel not found.');
    if (!msgObj) return message.inlineReply('Message not found.');

    const filter = { id: msgId, is_ongoing: true };
    const doc = await ReactionListener.findOne(filter);

    if (!doc) return message.inlineReply('Did not find a poll that matches that message.');
    const msgToSend = new MessageEmbed().setTitle(`Release Results for ${doc.sentMessage.title}`)
      .setDescription('Are you sure you want to  **end** this poll? '
        + 'This will send a reply to the original message with the role distribution '
        + '(equivalent to using .manage_polls -d and .poll_stats at once, but without sending the member list)')
      .addFields({
        name: 'Poll author',
        value: `<@${doc.author.id}>`,
        inline: true,
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
      },
      {
        name: 'Correct answer',
        value: `<@&${roleObj.id}>`,
      });

    const messageTest = await message.inlineReply(msgToSend);
    await messageTest.react('✅');
    await messageTest.react('❌');
    const collector = messageTest.createReactionCollector((reaction, rUser) => {
      if (!reaction.me && (reaction.emoji.name === '✅' || reaction.emoji.name === '❌')) {
        return rUser.id === message.author.id;
      }
      return false;
    });

    collector.on('collect', () => collector.stop());
    collector.on('end', async (collected) => {
      switch (collected.first().emoji.name) {
        case '✅': {
          doc.is_ongoing = false;
          await doc.save();
          const newMessage = new MessageEmbed()
            .setTitle(`${doc.sentMessage.title}: poll closed`)
            .setDescription(msg)
            .setTimestamp();
          const roleEmbeds = {};
          const memberCount = doc.userReactions.size;
          await doc.availableRoles.forEach((v, k) => roleEmbeds[v.id] = {
            name: v.name,
            reaction: k,
            playerList: [],
          });
          doc.userReactions.forEach((v, k) => {
            const { role } = v;
            roleEmbeds[role]?.playerList?.push(`<@${k}>`);
          });

          let choiceStr = '';
          for (const role in roleEmbeds) {
            const { playerList } = roleEmbeds[role];
            choiceStr += `**\`${
              roleEmbeds?.[role]?.name}\`**: ${
              playerList.length} member${
              playerList.length > 1 ? 's' : playerList.length === 0 ? 's' : ''} (${
              ((playerList.length / memberCount) * 100).toFixed(2)}%)\n`;
          }
          newMessage.addFields({
            name: 'Choice distribution',
            value: choiceStr.trim(),
            inline: false,
          },
          {
            name: 'Correct answer',
            value: `**\`${roleToFind}\`**`,
            inline: false,
          });
          newMessage.setColor('#ff6c6c');
          await msgObj.inlineReply(newMessage);
          msgToSend.addField('Status', 'Success');
          return messageTest.edit(msgToSend);
        }
        case '❌':
        default:
          msgToSend.addField('Status', 'Operation cancelled');
          return messageTest.edit(msgToSend);
      }
    });
  },
};
