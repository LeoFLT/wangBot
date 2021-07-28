const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "purge_players",
  description: "Clean all messages from a channel category",
  aliases: ["purge", "pp"],
  args: true,
  usage: "<roles to match> <roles to ignore when matched>",
  async execute(message, args, parseCmd) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const rolesToMatch = args[0].includes(",") ? args[0].split(",") : args[0];
    const rolesToUnmatch = args[0].includes(",") ? args[0].split(",") : args[1];
    console.log(rolesToMatch, rolesToUnmatch);
    const reply = await message.reply(
      new MessageEmbed().addFields({
        name: "Are you sure you want to purge these players?",
        value: "\nThis action can't be undone.",
      })
    );
    reply.react("✅"), reply.react("❌");
    const collector = reply.createReactionCollector(
      (reaction) => reaction.emoji.name === "✅"
    );

    collector.on("collect", (reaction, user) => {
      if (user.id !== message.client.user.id && reaction.emoji === "✅") {
        // doStuff
        message.channel.send("Success");
        return console.log({ user });
      }
    });
  },
};
