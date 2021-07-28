const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "clean_channel_category",
  description: "Clean all messages from a channel category",
  aliases: ["ccc"],
  args: true,
  usage: "<channel category to purge>",
  async execute(message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const channelArr = [];
    const channelErrArr = [];
    const finalChannelArr = [];
    const guild = await message.guild.fetch();
    const categoryToClone = args.join(" ");
    // get the category
    const category = guild.channels.cache.find(
        (channel) => channel.name.toLowerCase() === categoryToClone.toLowerCase()
    );
    category.children.forEach((channel) => channelArr.push(channel));
    const midPoint = Math.ceil(channelArr.length / 2);
    const channelArrFirstHalf = channelArr.slice(0, midPoint);
    const channelArrSecondHalf = channelArr.slice(-midPoint);
    const reply = await message.reply(
        new MessageEmbed()
            .setTitle(`**Clean \`${category.name}\` channel category?**`)
            .addFields(
                {
                  name: "Are you sure you want to continue? This will purge all messages on all channels of this category",
                  value: "\nThis change can't be undone.",
                },
                {
                  name: "Channel list:",
                  value:
                      channelArrFirstHalf.length > 0
                          ? channelArrFirstHalf
                          : "No channels to clone",
                  inline: true,
                },
                {
                  name: "\u200B",
                  value:
                      channelArrSecondHalf.length > 0 ? channelArrSecondHalf : "\u200B",
                  inline: true,
                }
            )
            .setTimestamp()
            .setFooter(
                "wang bot",
                "https://cdn.discordapp.com/emojis/798065159620657179.gif"
            )
    );
    if (channelArrFirstHalf.length > 0) {
      await reply.react("✅");
      await reply.react("❌");
  }
    else return;
    const collector = reply.createReactionCollector((reaction, rUser) => {
      if (
        !reaction.me &&
        (reaction.emoji.name === "✅" || reaction.emoji.name === "❌")
      ) {
        const user = guild.members.cache.find(
          (member) => member.user.id === rUser.id
        );
        try {
          return user.hasPermission("ADMINISTRATOR");
        } catch (e) {
          return false;
        }
      }
      return false;
    });

    const channelAmount = channelArr.length;
    collector.on("collect", (reaction) => {
      collector.stop();
      switch (reaction.emoji.name) {
        case "✅": {
          const timestamp = Date.now();
          const EventEmitter = require("events");
          class Emitter extends EventEmitter {}
          const eventEmitter = new Emitter();

          eventEmitter.once(`clean_channel_category-${timestamp}`, async () => {
            const guildFinal = await message.guild.fetch();
            const finalCategory = guildFinal.channels.cache.find(
              (channel) =>
                channel.name.toLowerCase() === categoryToClone.toLowerCase()
            );
            finalCategory.children.forEach((channel) =>
              finalChannelArr.push(channel)
            );
            const midPointFinal = Math.ceil(finalChannelArr.length / 2);
            const finalChannelArrFirstHalf = finalChannelArr.slice(
              0,
              midPointFinal
            );
            const finalChannelArrSecondHalf = finalChannelArr.slice(
              -midPointFinal
            );
            const finalMessage = new MessageEmbed()
              .setTitle("**Operation Completed**")
              .addFields(
                {
                  name: `**New channel list for \`${category.name}\`:**`,
                  value:
                    finalChannelArrFirstHalf.length > 0
                      ? finalChannelArrFirstHalf
                      : "No channels cloned",
                  inline: true,
                },
                {
                  name: "\u200B",
                  value:
                    finalChannelArrSecondHalf.length > 0
                      ? finalChannelArrSecondHalf
                      : "\u200B",
                  inline: true,
                }
              )
              .setTimestamp()
              .setFooter(
                "wang bot",
                "https://cdn.discordapp.com/emojis/798065159620657179.gif"
              );
            if (channelErrArr.length > 0)
              finalMessage.addField("Errored channels: ", channelErrArr, false);
            return message.channel.send(finalMessage);
          });

          let i = 0;
          category.children.forEach(async (channel) => {
            try {
              const newChannel = await channel.clone();
              await channel.delete();
              channelArr.push(newChannel);
            } catch (e) {
              channelErrArr.push(channel);
            }
            if (++i >= channelAmount)
              eventEmitter.emit(`clean_channel_category-${timestamp}`);
          });
          break;
        }
        case "❌":
        default: {
          message.channel.send("Operation cancelled");
        }
      }
    });
  },
};
