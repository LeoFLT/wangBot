const { MessageEmbed } = require('discord.js');
const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'list_polls',
  aliases: ['lp', 'list_poll', 'lr', 'list_reaction', 'list_reactions'],
  description: 'List all polls for the server. Use -a to show only active polls or -i to only show inactive polls.',
  usage: '-<active|a|inactive|i>',
  example: '-a',
  args: false,
  async execute(message, args) {
    const queryActive = args.length === 1 && (args[0] === '-a' || args[0] === '-active');
    const queryInactive = args.length === 1 && (args[0] === '-i' || args[0] === '-inactive');
    let doc;
    try {
      const filter = { 'guild.id': message.guild.id };
      if (queryActive) filter.is_ongoing = true;
      else if (queryInactive) filter.is_ongoing = false;
      doc = await ReactionListener.find(filter);
    } catch (e) {
      process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
    }
    const embedFields = [];

    if (!doc) return message.reply('No polls made for this server');
    doc.forEach((poll, index, array) => {
      const emojiToRole = [];
      poll.availableRoles.forEach((v, k) => emojiToRole.push(`${k}: <@&${v.id}>`));
      embedFields.push({
        name: 'Poll Author',
        value: `<@${poll.author.id}>`,
        inline: true,
      },
      {
        name: 'Channel',
        value: `<#${poll.sentMessage.channel.id}>`,
        inline: true,
      },
      {
        name: poll.sentMessage.title,
        value: poll.sentMessage.content,
        inline: false,
      },
      {
        name: 'Reactions: Roles',
        value: emojiToRole,
        inline: true,
      },
      {
        name: 'Is active?',
        value: poll.is_ongoing,
        inline: true,
      },
      {
        name: 'Link',
        value: `https://discord.com/channels/${poll.guild.id}/${poll.sentMessage.channel.id}/${poll.sentMessage.id}`,
        inline: false,
      });
      if ((index + 1) !== array.length) {
        embedFields.push({
          name: '\u200B',
          value: '-----------------',
          inline: false,
        });
      }
    });
    const msgToSend = new MessageEmbed().setTitle(`Poll list for ${message.guild.name}`)
      .setDescription(queryActive || queryInactive
        ? `Showing only ${queryInactive ? 'in' : ''}active polls (${doc.length})` : 'Showing all polls')
      .addFields(...embedFields)
      .setColor('#ff6c6c');
    message.inlineReply(msgToSend);
  },
};
