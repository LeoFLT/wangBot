const { MessageEmbed } = require('discord.js');
const ReactionListenerModel = require('../models/Reaction');
const { parseCmd } = require('../functions');
const { RoleList } = require('../classes');

module.exports = {
  name: 'watch_for_reactions',
  description: 'Listen to reactions to a message and assign roles based on it',
  aliases: ['wr', 'wfr', 'watch_reactions'],
  args: true,
  usesDb: true,
  takesParameters: true,
  usage:
    '"<Message to send>" -<channel|c> <#channel> -<title|t> \\`<question title>\\` -<ping|p> \\`<role to ping>\\`¹²'
    + ' -<dupes|d> <allow users to claim multiple roles (true|false)>² "<message content>"'
    + ' -<roles|r> <key value pairs corresponding to \\:emojis\\: and \\`roles\\` to assign>³*\n'
    + '¹: argument must be enclosed in ticks\n'
    + '²: optional\n'
    + '³: roles must be enclosed in ticks\n'
    + '*: must be the last parameter used',
  example:
    '"My cool, Multiline and rich :money: text. Use ?# as a delimiter '
    + 'if you need special characters,\notherwise use one single or double quotes/single '
    + 'or triple ticks, or one of these templates:\n`< message <` `> message >` `{ message {` `} message }`.\nNote how everything up until now is still inside the message to send parameter."\n-c #announcements -t '
    + '`Question 1: Question title here` -p `Role To Ping` -d false '
    + '-r :one: `Role One` :two: `Role Two` :three: `Role Three`\n',
  async execute(message) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return;
    const messageStr = message.content.trim().split(/\s+/);
    const parserRegex = new RegExp(
      `^${messageStr[0]} (?<delim>\\?#|\`\`\`|\`\`|[\`"'<>\\[\\]\\{\\}])(?<parserMsg>.*?)\\k<delim>`,
      'su',
    );

    const messageBodyMatches = message.content.match(parserRegex);
    if (!messageBodyMatches) return message.inlineReply('Wrongly formatted message body');

    const parsedMsg = messageBodyMatches.groups.parserMsg.trim();
    if (!parsedMsg) return message.inlineReply('Message body cannot be empty');
    messageStr.shift();

    const argsObj = {
      message: {
        author: {
          id: message.member.user.id,
          tag: message.member.user.tag,
        },
        title: undefined,
        content: parsedMsg,
        channelToSend: undefined,
      },
      roleToPing: { id: undefined, name: 'None' },
      allowDupes: false,
      availableRoles: new RoleList(),
    };
    const Arguments = {
      channel(param, msg) {
        const startIndex = msg.content.indexOf(`${param} <#`) + param.length + 1;
        const endIndex = msg.content.indexOf('>', startIndex) + 1;
        const channelId = msg.content
          .slice(startIndex, endIndex)
          .replace(/[<#>]/g, '');
        argsObj.message.channelToSend = msg.guild.channels.cache.find(
          (ch) => ch.id === channelId,
        );
      },
      title(param, msg) {
        argsObj.message.title = parseCmd(param, msg.content);
      },
      ping(param, msg) {
        const currCmd = parseCmd(param, msg.content);
        let roleToPing;
        if (currCmd.toLowerCase() === 'everyone') roleToPing = message.guild.roles.everyone;
        else {
          roleToPing = msg.guild.roles.cache.find(
            (el) => el.name.toLowerCase() === currCmd.toLowerCase(),
          );
        }
        argsObj.roleToPing.id = roleToPing.id;
        argsObj.roleToPing.name = roleToPing.name;
      },
      dupes(param, msg) {
        const dupeBool = parseCmd(param, msg.content.replace(/`/g, ''), true);
        argsObj.allowDupes = dupeBool || false;
      },
      roles(param, msg) {
        const startIndex = msg.content.indexOf(`-${param}`);
        let currCmd = msg.content.slice(startIndex);
        const roleRegExpTest = /(?<reaction>\S+|<:([\w\s\d]+):\d+>)\s`(?<roleName>[\w\s\d]+)`/g;
        currCmd = Array.from(currCmd.matchAll(roleRegExpTest)).map((el) => ({
          ...el.groups,
        }));
        let roleCount = 0;
        currCmd.forEach((rolePair) => {
          if (rolePair?.reaction && rolePair?.roleName) {
            const roleQuery = message.guild.roles.cache.find((r) => r.name === rolePair.roleName);
            if (!roleQuery) return;
            argsObj
              .availableRoles
              .set(rolePair.reaction, { id: roleQuery.id, name: roleQuery.name });
            roleCount++;
          }
        });
        if (roleCount > 0) return true;
      },
    };
    for (const command in Arguments) {
      Arguments[command.slice(0, 1)] = Arguments[command];
    }

    const cmdRegex = /(-\w+)\s*/gi;
    const paramList = [];
    [...message.content.matchAll(cmdRegex)]
      .forEach((match) => (match[1] ? paramList.push(match[1]) : undefined));
    // eslint-disable-next-line no-restricted-syntax
    for (const param of paramList) {
      const cmdToFind = param.slice(1);
      try {
        if (Object.prototype.hasOwnProperty.call(Arguments, cmdToFind)) {
          // test for valid arguments
          let paramVal;
          if (['channel', 'c', 'dupes', 'd'].includes(cmdToFind)) paramVal = parseCmd(param, message.content, true);
          else if (['roles', 'r'].includes(cmdToFind)) {
            paramVal = Arguments[cmdToFind](cmdToFind, message);
          } else paramVal = parseCmd(param, message.content);
          if (!paramVal) return message.inlineReply(`Missing options for argument: \`${param}\``);
          Arguments[cmdToFind](param, message);
        } else {
          return message.inlineReply(`Invalid argument: \`${param}\``);
        }
      } catch (error) {
        console.log({ error });
        return message.inlineReply(`Encountered an error while setting parameter: \`${cmdToFind || param}\`: ${error.message}`);
      }
    }

    if (!argsObj.message?.channelToSend) return message.inlineReply('Invalid channel identifier');

    const embedFields = [
      {
        name: argsObj.message.title,
        value: argsObj.message.content,
        inline: false,
      },
      {
        name: 'Channel to send',
        value: argsObj.message.channelToSend,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: 'Role to ping',
        value: `${!argsObj.roleToPing.id ? 'None'
          : argsObj?.roleToPing?.name === '@everyone' ? '@everyone'
            : `<@&${argsObj?.roleToPing?.id}>`}`,
        inline: true,
      },
      {
        name: 'Reactions to watch',
        value: argsObj.availableRoles.joinReactions('\n'),
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: 'Roles to assign',
        value: argsObj.availableRoles.joinIDs('\n'),
        inline: true,
      },
      {
        name: 'Allow multiple roles?',
        value: argsObj.allowDupes,
        inline: false,
      },
    ];

    const messageToSend = new MessageEmbed()
      .setTitle('Confirm sending message')
      .setDescription('Confirm that you want to send the following message:')
      .addFields(...embedFields);
    const messageTest = await message.inlineReply(messageToSend);
    await messageTest.react('✅');
    await messageTest.react('❌');
    const collector = messageTest.createReactionCollector((reaction, rUser) => {
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
          let strTest = argsObj.roleToPing.name === '@everyone' ? '@everyone, new survivor question:' : `<@&${argsObj.roleToPing.id}>, new survivor question:`;
          if (!argsObj?.roleToPing?.id) strTest = 'New survivor question:'
          const finalMessage = await argsObj.message.channelToSend.send(strTest,
            new MessageEmbed()
              .setTitle(argsObj.message.title)
              .setDescription(argsObj.message.content),
            {
              split: true,
              allowedMentions: { parse: ['roles', 'users', 'everyone'] },
            },
          );
          const reactionListener = new ReactionListenerModel({
            id: finalMessage.id,
            guild: { name, id } = message.guild,
            author: {
              id: message.member.id,
              guild: { name, id } = message.guild,
              user: { id: message.author.id, tag: `${message.author.username}#${message.author.discriminator}` },
            },
            sentMessage: {
              id: finalMessage.id,
              title: argsObj.message.title,
              content: argsObj.message.content,
              channel: {
                id: finalMessage.channel.id,
                name: finalMessage.channel.name,
                guild: { name, id } = finalMessage.guild,
              },
            },
            channel: {
              id: message.channel.id,
              name: argsObj.message.channelToSend.name,
              guild: { name, id } = message.guild,
            },
            message: {
              id: message.id,
              guild: { name, id } = message.guild,
              channel: {
                id: message.channel.id,
                name: message.channel.name,
                guild: { name, id } = message.guild,
              },
            },
            roleToPing: argsObj.roleToPing,
            // TODO: add logic to have multiple states for this
            is_ongoing: true,
            allow_dupes: argsObj.allowDupes,
          });

          argsObj.availableRoles
            .forEach((v, k) => reactionListener.set(`availableRoles.${k}`, v));

          const err = {
            hasError: false,
          };
          await argsObj.availableRoles.forEach((role, reaction) => {
            try {
              finalMessage.react(reaction);
            } catch (e) {
              err.error = e;
              err.hasError = true;
            }
          });
          try {
            messageToSend.addField('Status', 'Success');
            messageTest.edit(messageToSend);
            await reactionListener.save();
          } catch (e) {
            console.log('Error while saving to database:', { e });
          }
          if (err.hasError) {
            console.log({ err });
            messageToSend.addField(
              'Status',
              `Error while sending message\n${err.error}`,
            );
            messageTest.edit(messageToSend);
          }
          break;
        }
        case '❌':
        default:
          messageToSend.addField('Status', 'Operation cancelled');
          return messageTest.edit(messageToSend);
      }
    });
  },
};
