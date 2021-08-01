const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'purge_players',
  aliases: ['purge', 'pp'],
  description: 'remove all users that match the specified role criteria from this server',
  usage: '\`<roles to match>\` \`<roles to ignore when matched>\`',
  example: '`Player, Mappool Feedback` `Helper`',
  args: true,
  async execute(message, args) {
    if (!message.member.hasPermission('ADMINISTRATOR')) return;
    const rolesToMatch = args[0].includes(',') ? args[0].split(',') : args[0];
    const rolesToUnmatch = args[0].includes(',') ? args[0].split(',') : args[1];
    console.log(rolesToMatch, rolesToUnmatch);
    const reply = await message.inlineReply(
      new MessageEmbed().addFields({
        name: 'Are you sure you want to purge these players?',
        value: "\nThis action can't be undone.",
      }),
    );
    await reply.react('✅');
    await reply.react('❌');
    const collector = reply.createReactionCollector(
      (reaction) => reaction.emoji.name === '✅',
    );

    collector.on('collect', (reaction, user) => {
      console.log(user, reaction);
      if (user.id !== message.client.user.id && reaction.emoji === '✅') {
        // doStuff
        message.channel.send('Success');
        return console.log({ user });
      }
    });
  },
};
