const { MessageEmbed } = require('discord.js');
const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'list_polls',
  description: 'List all polls for the server. Use -a to show only active polls or -i to only show inactive polls.',
  aliases: ['lp', 'list_poll', 'lr', 'list_reaction', 'list_reactions'],
  args: false,
  async execute(message, args) {
    const queryActive = (args.length === 1 && args[0] === '-a') || false;
    const queryInactive = (args.length === 1 && args[0] === '-i') || false;
    let doc;
    try {
      const filter = { guild: message.guild.id };
      if (queryActive) filter.is_ongoing = true;
      else if (queryInactive) filter.is_ongoing = false;
      doc = await ReactionListener.find(filter);
    } catch (e) {
      process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
    }
    const embedFields = [];
    for (const poll of doc) {
      embedFields.push({
        name: 'Poll Author',
        value: `<@${poll.author.id}>`,
        inline: false,
      }, {
        name: 'Channel',
        value: `<#${poll.sentMessage.channel.id}>`,
        inline: true,
      }, {
        name: `[${poll.sentMessage.title}](https://discord.com/channels/${
          poll.sentMessage.channel.guild.id}/${
          poll.sentMessage.channel.id}/${
          poll.sentMessage.id})`,
        value: poll.sentMessage.content,
        inline: false,
      });
    }
    const msgToSend = new MessageEmbed().setTitle(`Poll list for ${message.guild.name}`)
      .setDescription(queryActive || queryInactive
        ? `Showing only ${queryInactive ? 'in' : ''}active polls${doc.length}` : 'Showing all polls')
      .addFields(...embedFields);
    message.channel.send(msgToSend, { disableMentions: 'none', split: true });
  },
};
