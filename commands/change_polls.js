const { MessageEmbed } = require('discord.js');
const { ReactionListenerModel } = require('../models/Reaction');

module.exports = {
  name: 'change_polls',
  aliases: [
    'change_poll', 'start_polls', 'start_poll',
    's_poll', 'end_polls', 'end_poll', 'e_poll',
    'ch_poll', 'ch_polls', 'chp', 'c_p'],
  description: 'Changes a poll state running the selected poll.',
  usage: '-<e|enable|d|disable> <link to a message>',
  example: '-e https://discord.com/1234567890/0987654321/5647382910',
  args: true,
  async execute(message, args) {
    if (args.length < 2) return message.inlineReply('Missing parameters.');
    const enablePool = args.includes('-e') || args.includes('-enable');
    const disablePool = (!enablePool && (args.includes('-d') || args.includes('-disable')));
    const linkRegexp = /https:\/\/discord\.com\/channels\/(?<guildId>\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)\/?/i;

    if (args[0].match(linkRegexp)) groupMatches = args[0].match(linkRegexp).groups;
    else if (args[1].match(linkRegexp)) groupMatches = args[1].match(linkRegexp).groups;
    const { guildId, channelId, messageId } = groupMatches;
    let dbConnection = db;
    let doc;
    let success = false;
    try {
      dbConnection = await dbConnection;
      const filter = { id: message.guild.id };
      if (enablePool) filter.is_ongoing = true;
      else if (disablePool) filter.is_ongoing = false;
      doc = await ReactionListenerModel.updateOne({ _id: messageId }, filter).then(() => success = true);
    } catch (e) {
      process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
      (await dbConnection).disconnect().then(() => console.log(`${new Date().toISOString()
        .replace('T', ' ')} - INFO:\tForcibly Disconnected from DB\n`));
    } finally {
      (await dbConnection).disconnect().then(() => console.log(`${new Date().toISOString()
        .replace('T', ' ')} - INFO:\tDisconnected from DB\n`));
    }

    if (success) {
      return message.inlineReply('Operation completed successfully');
    }
    if (!doc) {
      dbConnection.disconnect().then(() => console.log(`${new Date().toISOString()
        .replace('T', ' ')} - INFO:\tDisconnected from DB\n`));
      return message.inlineReply('Unable to find that match in the database');
    }

    const msgEmbeds = [
      {
        name: 'Poll Author',
        value: `<@${doc.message.author.id}>`,
        inline: false,
      },
      {
        name: 'Channel',
        value: `<#${doc.message.channel}>`,
        inline: true,
      },
      {
        name: doc.message.title,
        value: doc.message.content,
        inline: false,
      },
    ];
    const msgToSend = new MessageEmbed().setTitle('Confirm change')
      .setDescription(`Confirm ${
        enablePool ? 'reopening poll' : 'disabling poll'}? It can be undone later with .chp ${
        enablePool ? '<-d|-disable>' : '<-e|-enable>'}`)
      .addFields(...msgEmbeds)
      .setFooter('created at')
      .setTimestamp(doc.date)
      .setColor('#ff6c6c');
    const reactToMsg = await message.inlineReply(msgToSend);

    await reactToMsg.react('✅');
    await reactToMsg.react('❌');
    const collector = reactToMsg.createReactionCollector((reaction, rUser) => {
      if (
        !reaction.me
        && (reaction.emoji.name === '✅' || reaction.emoji.name === '❌')
      ) {
        const user = message.guild.members.cache.find(
          (member) => member.user.id === rUser.id,
        );
        try {
          if (user.hasPermission('ADMINISTRATOR')) {
            if (user.id === message.author.id) return true;
          } else return false;
        } catch (e) {
          return false;
        }
      }
      return false;
    });

    collector.on('collect', () => collector.stop());
    collector.on('end', async (collected) => {
      switch (collected.first().emoji.name) {
        case '✅': {
          try {
            await db();
            ReactionListener.updateOne({
              guild: message.guild.id,
              _id: messageId,
            },
            {
              is_ongoing: enablePool || false,
            }).then(console.log);
            return reactToMsg.edit(msgToSend.addField('Status'), 'Success');
          } catch (e) {
            process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
            dbConnection.disconnect().then(() => console.log(`${new Date().toISOString()
              .replace('T', ' ')} - INFO:\tForcibly Disconnected from DB\n`));
            reactToMsg.edit(msgToSend.addField('Status'), `${e.name}\n${e.error}`);
          } finally {
            dbConnection.disconnect().then(() => console.log(`${new Date().toISOString()
              .replace('T', ' ')} -finally INFO:\tDisconnected from DB\n`));
          }
        }
        case '❌': {
          return reactToMsg.edit(msgToSend.addField('Status', 'Operation cancelled'));
        }
      }
    });
  },
};
