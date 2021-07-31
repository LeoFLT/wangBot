const { Permissions, MessageEmbed } = require('discord.js');

module.exports = {
  name: 'move_channels',
  description: 'Move channels from one category to another',
  aliases: ['move', 'mc'],
  args: true,
  usage:
    '<channel list, separated by commas (no spaces) or a channel category> <channel category to move the channels to>',
  async execute(message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return;
    let channelsToMoveTest;
    let destCategoryTest;
    if (args[0].includes('"') || args[0].includes("'")) {
      args = args.join(' ');
      const regexp = /^["']([\w\s]+)["']/;
      const matches = regexp.exec(args);
      if (matches[1]) {
        channelsToMoveTest = matches[1];
        args = args.replace(matches[0], '').split(/\s+/);
      }
    } else {
      channelsToMoveTest = args[0].includes(',')
        ? args[0].split(',').map((el) => el.toLowerCase())
        : args[0];
    }
    if (args.join(' ').includes('"') || args.join(' ').includes("'")) {
      args = args.join(' ');
      const regexp = /["']([\w\s]+)["']$/;
      const matches = regexp.exec(args);
      if (matches[1]) {
        destCategoryTest = matches[1];
      }
    } else {
      destCategoryTest = args[1];
    }
    console.log({ channelsToMoveTest }, { destCategoryTest });
    if (!args[1]) {
      return message.channel.send(
        'Missing argument: channel category to move the channels to',
      );
    }

    const guild = await message.guild.fetch();
    const destCategory = guild.channels.cache.find(
      (ch) => ch.name === destCategoryTest && !ch.parentID,
    );
    if (!destCategory) {
      return message.channel.send(
        `\`\`\`${destCategoryTest}\`\`\` is not a valid channel category`,
      );
    }

    let channelsToMove;
    switch (true) {
      case typeof channelsToMoveTest === 'string': {
        // category or single channel
        const channel = guild.channels.cache.find(
          (ch) => ch.name.toLowerCase() === channelsToMoveTest.toLowerCase(),
        );
        const { parentID } = channel;
        if (!parentID) {
          channelsToMove = guild.channels.cache.filter(
            (c) => c.parentID === channel.id && c.parentID,
          );
        } else {
          channelsToMove = guild.channels.cache.filter(
            (c) => c.id === channel.id,
          );
        }
        break;
      }
      case Array.isArray(channelsToMoveTest): {
        // array of channels
        channelsToMove = guild.channels.cache.filter((channel) => channelsToMoveTest.includes(channel.name.toLowerCase()));
        break;
      }
    }
    const beforeChangeArr = [];
    channelsToMove.forEach((channel) => beforeChangeArr.push(channel));
    const midPoint = Math.ceil(beforeChangeArr.length / 2);
    const beforeChangeArrFirstHalf = beforeChangeArr.slice(0, midPoint);
    const beforeChangeArrSecondHalf = beforeChangeArr.slice(midPoint);

    const reply = await message.inlineReply(
      new MessageEmbed()
        .setTitle(`**Move these channels to \`${destCategory.name}\`?**`)
        .addFields(
          {
            name: 'Are you sure you want to continue?',
            value: `This will move the channels below to **\`${destCategory.name}\`**`,
          },
          {
            name: 'Channel list:',
            value:
              beforeChangeArrFirstHalf.length > 0
                ? beforeChangeArrFirstHalf
                : 'No channels to clone',
            inline,
          },
          {
            name: '\u200B',
            value:
              beforeChangeArrSecondHalf.length > 0
                ? beforeChangeArrSecondHalf
                : '\u200B',
            inline,
          },
        )
        .setTimestamp()
        .setFooter(
          'wang bot',
          'https://cdn.discordapp.com/emojis/798065159620657179.gif',
        ),
    );
    if (beforeChangeArrFirstHalf.length > 0) reply.react('✅'), reply.react('❌');
    else return;
    const collector = reply.createReactionCollector((reaction, rUser) => {
      if (
        !reaction.me
        && (reaction.emoji.name === '✅' || reaction.emoji.name === '❌')
      ) {
        const user = guild.members.cache.find(
          (member) => member.user.id === rUser.id,
        );
        try {
          if (user.hasPermission('ADMINISTRATOR')) return true;
          return false;
        } catch (e) {
          return false;
        }
      }
      return false;
    });

    const channelAmount = beforeChangeArr.length;
    collector.on('collect', (reaction) => {
      collector.stop();
      switch (reaction.emoji.name) {
        case '✅': {
          const timestamp = Date.now();
          const EventEmitter = require('events');

          class Emitter extends EventEmitter {}

          const eventEmitter = new Emitter();

          eventEmitter.once(`move_channels-${timestamp}`, async () => {
            const finalMessage = new MessageEmbed()
              .setTitle('**Operation Completed**')
              .setTimestamp()
              .setFooter(
                'wang bot',
                'https://cdn.discordapp.com/emojis/798065159620657179.gif',
              );
            return message.channel.send(finalMessage);
          });

          let i = 0;
          channelsToMove.forEach(async (channel) => {
            // const teamName = channel.name.replace('-', ' ');
            // const teamRole = await channel.guild.roles.create({
            //   data: {
            //     name: teamName,
            //   },
            // });
            await channel.setParent(destCategory.id);
            // await channel.overwritePermissions([{
            //  id: teamRole.id,
            //  allow: [
            //    "VIEW_CHANNEL",
            //    "SEND_MESSAGES",
            //    "EMBED_LINKS",
            //    "ATTACH_FILES",
            //    "READ_MESSAGE_HISTORY",
            //    "USE_EXTERNAL_EMOJIS",
            //  ]
            // },{
            //  id: channel.guild.roles.everyone.id,
            //  deny: [
            //    "VIEW_CHANNEL",
            //    "SEND_MESSAGES"
            //  ]
            // }]);
            if (++i >= channelAmount) eventEmitter.emit(`move_channels-${timestamp}`);
          });
          break;
        }
        case '❌':
        default: {
          message.channel.send('Operation cancelled');
        }
      }
    });
  },
};
