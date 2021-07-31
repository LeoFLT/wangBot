const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(reaction, user, client) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        console.error(`Unable to fetch a message from reaction ${reaction.id}`);
        return;
      }
    }
    if (reaction.me) return;

    const messageQuery = await ReactionListener
      .findOne({ id: reaction.message.id, is_ongoing: true });
    if (!messageQuery) return;

    if (messageQuery.availableRoles.has(reaction.emoji.name)) {
      const roleToRemove = messageQuery.availableRoles.get(reaction.emoji.name);
      const guild = await client.guilds.fetch(messageQuery.sentMessage.channel.guild.id);
      const member = guild.members.cache.find((m) => m.user.id === user.id);
      if (!member) return;
      if (member.roles.cache.some((role) => role.id === roleToRemove.id)) return;
      await member.roles.remove(roleToRemove.id, `role from poll named '${
        messageQuery.sentMessage.title}' on #${
        messageQuery.sentMessage.channel.name} created by ${
        messageQuery.author.user.tag}`);

      messageQuery.userReactions
        .set(member.id, { role: undefined, reaction: undefined });
      await messageQuery.save();
    }
  },
};
