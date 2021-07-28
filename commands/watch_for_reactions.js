const { MessageEmbed } = require("discord.js");
const ReactionListener = require("../models/reaction_listener.js");

module.exports = {
  name: "watch_for_reactions",
  description: "Listen to reactions to a message and assign roles based on it",
  aliases: ["wr", "wfr", "watch_reactions"],
  args: true,
  usesDb: true,
  takesParameters: true,
  usage:
    "```\n.wr <#channel> -<title|t> `<question title>` -<ping|p> `<role to ping>` -<dupes|d> <allow users to claim multiple roles (true|false)> {<message content>} -<roles|r> <key value pairs corresponding to emojis and roles to assign>¹\n¹: roles must be inside ticks (`)```\nExample: ```\n.wr #announcements -t `Question 1: Bla bla` -p `Survivor` -d false\n{\nQuestion one\nParagraph Two\nParagraph three\n}\n:one: -r `Role One` :two: `Role Two` ```\n",
  async execute(message, _, parseCmd, db) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    // replace escaped block delimiters
    let argsObj = {
      channelToSend: undefined,
      message: {
        author: {
          id: message.member.user.id,
          tag: message.member.user.tag,
        },
        title: undefined,
        content: undefined,
      },
      pingRole: undefined,
      allowDupes: false,
      rolesToClaim: [],
    };
    const cmdRegex = /(-\w+)\s*/gi;
    const paramList = [];
    [...message.content.matchAll(cmdRegex)].forEach((match) =>
      match[1] ? paramList.push(match[1]) : undefined
    );
    for (const param of paramList) {
      let currCmd;
      if (param === "-c" || param === "-channel") {
        const startIndex =
          message.content.indexOf(`${param} <#`) + param.length + 1;
        const endIndex = message.content.indexOf(">", startIndex) + 1;
        currCmd = message.content
          .slice(startIndex, endIndex)
          .replace(/[<#>]/g, "");
      } else if (param === "-dupes" || param === "-d") {
        currCmd = parseCmd(param, message.content.replace(/`/g, ""), true);
      } else if (param === "-r" || param === "-roles") {
        const startIndex = message.content.indexOf(param);
        currCmd = message.content.slice(startIndex);
        const roleRegExpTest =
          /(?<reaction>\S+|<:([\w\s\d]+):\d+>)\s`(?<roleName>[\w\s\d]+)`/g;
        let resArr = Array.from(currCmd.matchAll(roleRegExpTest)).map((el) => ({
          ...el.groups,
        }));
        currCmd = resArr;
      } else currCmd = parseCmd(param, message.content);

      try {
        if (param === "-title" || param === "-t")
          argsObj.message.title = currCmd;
        if (param === "-ping" || param === "-p") {
          const roleToPing = message.guild.roles.cache.find(
            (el) => el.name.toLowerCase() === currCmd.toLowerCase()
          );
          argsObj.pingRole = { id, name } = roleToPing;
        }
        if (param === "-dupes" || param === "-d") argsObj.allowDupes = currCmd;
        if (param === "-r" || param === "-roles")
          argsObj.rolesToClaim = currCmd;
        if (param === "-c" || param === "-channel") {
          const channelToSend = message.guild.channels.cache.find(
            (el) => el.id === currCmd
          );
          argsObj.channelToSend = channelToSend;
        }
      } catch (error) {
        console.log({ error });
        return message.channel.send(
          "Error executing command, check your syntax and try again."
        );
      }
    }
    let msgStr = message.content.replace(/\\{/g, "#!#").replace(/\\}/g, "!#!");
    let sliceStartIndex = msgStr.indexOf("{");
    let sliceEndIndex = msgStr.indexOf("}", sliceStartIndex + 1);

    if (
      !(sliceStartIndex || sliceEndIndex) ||
      sliceStartIndex === -1 ||
      sliceEndIndex === -1
    )
      return message.channel.send("Unable to parse the message to send.");
    if (!argsObj.hasOwnProperty("channelToSend"))
      return message.channel.send("Invalid channel identifier");
    argsObj.rolesToClaim.forEach((el, i) => {
      let role = message.guild.roles.cache.find(
        (role) => role.name.toLowerCase() === el.roleName.toLowerCase()
      );
      if (!role) return;
      currObj = {
        _id: role.id,
        guild: role.guild.id,
        roleId: role.id,
        channel: argsObj.channelToSend.id,
      };
      argsObj.rolesToClaim[i] = { ...argsObj.rolesToClaim[i], ...currObj };
    });

    // replace escaped sequences back to their proper symbols
    argsObj.message.content = msgStr
      .slice(sliceStartIndex + 1, sliceEndIndex - 1)
      .replace(/#!#/g, "{")
      .replace(/!#!/g, "}")
      .trim();
    let messageToSend = new MessageEmbed()
      .setDescription("Confirm that you want to send the following message:")
      .addFields(
        {
          name: argsObj.message.title,
          value: argsObj.message.content,
          inline: false,
        },
        {
          name: "Channel",
          value: argsObj.channelToSend,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "Role to ping",
          value: argsObj.pingRole,
          inline: true,
        },
        {
          name: "Reaction",
          value: argsObj.rolesToClaim.map((el) => el.reaction),
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true,
        },
        {
          name: "Role",
          value: argsObj.rolesToClaim.map((el) => `<@&${el.roleId}>`),
          inline: true,
        },
        {
          name: "Allow multiple roles?",
          value: argsObj.allowDupes,
          inline: false,
        }
      );
    console.log({ argsObj }, argsObj.rolesToClaim);
    messageToSend.setTitle("Confirm sending message");
    let messageTest = await message.channel.send(messageToSend);
    messageTest.react("✅"), messageTest.react("❌");
    const collector = messageTest.createReactionCollector((reaction, rUser) => {
      if (
        !reaction.me &&
        (reaction.emoji.name === "✅" || reaction.emoji.name === "❌")
      ) {
        const user = message.guild.members.cache.find(
          (member) => member.user.id === rUser.id
        );
        try {
          if (user.hasPermission("ADMINISTRATOR")) {
            if (user.id === message.author.id) return true;
          } else return false;
        } catch (e) {
          return false;
        }
      }
      return false;
    });

    collector.on("collect", () => collector.stop());
    collector.on("end", async (collected) => {
      switch (collected.first().emoji.name) {
        case "✅": {
          const dbConnection = await db();
          try {
            const finalMessage = await argsObj.channelToSend.send(
              `${
                argsObj.pingRole ? `<@&${argsObj.pingRole.id}> ` : undefined
              }New question`,
              new MessageEmbed()
                .setTitle(argsObj.message.title)
                .setDescription(argsObj.message.content)
            );
            const reactionListener = new ReactionListener({
              _id: finalMessage.id,
              guild: argsObj.channelToSend.guild.id,
              message: {
                _id: finalMessage.id,
                id: finalMessage.id,
                title: argsObj.message.title,
                content: argsObj.message.content,
                channel: argsObj.channelToSend.id,
                author: {
                  _id: message.author.id,
                  id: message.author.id,
                  tag: message.author.tag,
                },
              },
              channel: {
                _id: argsObj.channelToSend.id,
                id: argsObj.channelToSend.id,
                guild: argsObj.channelToSend.guild.id,
                name: argsObj.channelToSend.name,
              },
              is_ongoing: true,
              allow_dupes: argsObj.allowDupes,
              roles: argsObj.rolesToClaim.map((role) => ({
                _id: role._id,
                id: role._id,
                name: role.roleName,
                guild: role.guild,
                channel: role.channel,
                reaction: role.reaction,
              })),
            });
            argsObj.rolesToClaim.forEach((role) =>
              finalMessage.react(role.reaction)
            );
            await reactionListener.save().then(console.log);
            messageToSend.addField("Status", "Success");
            messageTest.edit(messageToSend);
          } catch (e) {
            console.log({ e });
            messageToSend.addField(
              "Status",
              "Error while sending message\n" + e
            );
            messageTest.edit(messageToSend);
          } finally {
            dbConnection.disconnect();
          }
          break;
        }
        case "❌":
        default:
          messageToSend.addField("Status", "Operation cancelled");
          return messageTest.edit(messageToSend);
      }
    });
  },
};
