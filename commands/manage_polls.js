const { MessageEmbed } = require('discord.js');
const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'manage_polls',
  description: 'Enable/disable polls for the server. Use -e to enable and -d to disable.',
  example: '-e https://discord.com/channels/748581308866887691/811643995755249664/870896674149662800',
  aliases: ['mp', 'manage_poll'],
  args: true,
  async execute(message, args) {
    let setEnabled;
    if (args[0] === '-e' || args[0] === '-enable') setEnabled = true;
    else if (args[0] === '-d' || args[0] === '-disable') setEnabled = false;
    if (typeof setEnabled === 'undefined') return message.inlineReply(`Invalid flag \`${args[0]}\`.`);

    if (!args[1]) return message.inlineReply('No link provided');
    const regexpTest = args[1].match(/^https:\/\/discord\.com\/channels\/(?<guild>\d+?)\/(?<channel>\d+?)\/(?<msg>\d+?)$/);
    if (!regexpTest) return message.inlineReply('Invalid link format.');

    const { msg } = regexpTest.groups;
    const filter = { id: msg };
    const doc = await ReactionListener.findOne(filter);

    if (!doc) return message.inlineReply('Did not find a poll that matches that message.');
    const msgToSend = new MessageEmbed().setTitle(`Change Poll for ${message.guild.name}`)
      .setDescription(`Are you sure you want to **${
        setEnabled ? 'enable' : 'disable'}** this poll? This can be undone at any time with ${
        setEnabled ? '-d' : '-e'}.`)
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
          doc.is_ongoing = setEnabled;
          doc.save().then(console.log);
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
