const { MessageEmbed } = require("discord.js");
const ReactionListener = require("../models/Reaction");
const { discordTimestamp } = require('../functions');

module.exports = {
  name: "list_polls",
  aliases: ["lp", "list_poll", "lr", "list_reaction", "list_reactions"],
  description:
    "List all polls for the server. Use -a to show only active polls or -i to only show inactive polls. Use -f to search for polls relating to a specific member.",
  usage: "-<active|a|inactive|i> -<|f|find>",
  example: "-i -f 146685063914848256",
  args: true,
  async execute(message, args) {
    const queryActive = args.includes("-a") || args.includes("-active");
    const queryInactive =
      !queryActive && (args.includes("-i") || args.includes("-inactive"));
    const queryFind = args.indexOf("-f") || args.indexOf("-find");
    let doc, memberToFind;
    try {
      const filter = { "guild.id": message.guild.id };
      if (queryActive) filter.is_ongoing = true;
      else if (queryInactive) filter.is_ongoing = false;
      if (queryFind !== -1) {
        queryFindIndex = queryFind + 1;
        const userStr = args[queryFindIndex].replace(/[<>&@!]/g, "");
        memberToFind = message.guild.members.cache.find((m) =>
          (m.id === userStr ||
          m.user.id === userStr ||
          m.displayName === userStr ||
          m.user.username === userStr ||
          `${m.user.username}#${m.user.discriminator}` === userStr)
        );
        if (!memberToFind)
            return message.inlineReply(`Unable to find user: \`${userStr}\``);
      }
      doc = await ReactionListener.find(filter);
    } catch (e) {
      process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
    }

    
    if (!doc)
      return message.reply("No polls that match this criteria found");
    
    const embedFields = [];

    if (queryFind === -1) {
      doc.forEach((poll) => {
        const currField = [];
        const emojiToRole = [];

        poll.availableRoles.forEach((v, k) =>
          emojiToRole.push(`${k}: <@&${v.id}>`)
        );
        currField.push(
          {
            name: "Poll Author",
            value: `<@${poll.author.id}>`,
            inline: true,
          },
          {
            name: "Channel",
            value: `<#${poll.sentMessage.channel.id}>`,
            inline: true,
          },
          {
            name: poll.sentMessage.title,
            value: poll.sentMessage.content,
            inline: false,
          },
          {
            name: "Reactions: Roles",
            value: emojiToRole,
            inline: true,
          },
          {
            name: "Is active?",
            value: poll.is_ongoing,
            inline: true,
          },
          {
            name: "Link",
            value: `https://discord.com/channels/${poll.guild.id}/${poll.sentMessage.channel.id}/${poll.sentMessage.id}`,
            inline: false,
          }
        );
        
      embedFields.push(currField);
      });
    }
    else {
      doc.forEach((poll) => {
        if (!poll.userReactions.has(memberToFind.id))
          return;

        const currField = [];
        const reaction = poll.userReactions.get(memberToFind.id);
        const role = poll.availableRoles.get(reaction.reaction);

        if (!role)
          return;

        currField.push({
          name: "Poll Author",
          value: `<@${poll.author.id}>`,
          inline: true
        },
        {
          name: "Channel",
          value: `<#${poll.sentMessage.channel.id}>`,
          inline: true,
        },
        {
          name: "Is active?",
          value: poll.is_ongoing,
          inline: true,
        },
        {
          name: poll.sentMessage.title,
          value: poll.sentMessage.content,
          inline: false,
        },
        {
          name: "User",
          value: `<@${memberToFind.id}>`,
          inline: true
        },
        {
          name: "Role assigned",
          value: `${reaction.reaction || '*None*'}: ${role?.id ? `<@&${role.id}>` : ''}`,
          inline: true
        },
        {
          name: "Member Info",
          value: '```js\n' + `Discord = "${memberToFind.user.tag}"\nMemberID = ${memberToFind.id}\nUserID = ${memberToFind.user.id}` + '```',
          inline: false
        },
        {
          name: "Poll Link",
          value: `https://discord.com/channels/${poll.guild.id}/${poll.sentMessage.channel.id}/${poll.sentMessage.id}`,
          inline: false,
        });

        if (reaction?.date) {
          const date = new Date(reaction.date);
          currField.push({
            name: "Date of last reaction",
            value: `\`${date.toUTCString()}\` (${discordTimestamp(date, "f")} - ${discordTimestamp(date, "")})`,
            inline: false
          });
        }

        embedFields.push(currField);
      });
    }
    for (const [index, embeds] of embedFields.entries()) {
    const msgToSend = new MessageEmbed()
      .setTitle(`Poll list for ${message.guild.name}`)
      .setDescription(
        queryActive || queryInactive
          ? `Showing only ${queryInactive ? "in" : ""}active polls` : 'Showing all polls'
      )
      .addFields(...embeds)
      .setColor("#ff6c6c")
      .setFooter(`page ${index + 1}/${embedFields.length}`);

      if (index === 0)
        message.inlineReply(msgToSend);
      else
        message.channel.send(msgToSend);
    }
  },
};
