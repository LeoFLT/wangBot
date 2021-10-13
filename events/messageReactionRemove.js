const ReactionListener = require('../models/Reaction');
const Guild = require('../models/Guild');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(reaction, user, guildObj, client) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        console.error(`Unable to fetch a message from reaction ${reaction.id}`);
        return;
      }
    }
    if (reaction.me) return;
    const guildRole = await Guild.findOne({ id: reaction.message.guild.id });
    const messageQuery = await ReactionListener.findOne({ id: reaction.message.id, is_ongoing: true });
    const { guild } = reaction.message;
    const member = guild.members.cache.find((m) => m.user.id === user.id);
    if (!member) return;

    if (guildRole.rolesToWatch.has(reaction.message.id)) {
      const roleToRemove = guildRole.rolesToWatch.get(reaction.message.id);
      if (member.roles.cache.has(roleToRemove.id));
        return member.roles.remove(roleToRemove.id);
    }

    if (guildRole?.survivorRole?.id) {
      if (!member.roles.cache.has(guildRole.survivorRole.id)) {
        return;
      }
    }
    if (!messageQuery) return;
  
    if (messageQuery.availableRoles.has(reaction.emoji.name)) {
      const roleToRemove = messageQuery.availableRoles.get(reaction.emoji.name);
    
      if (!member.roles.cache.some((role) => role.id === roleToRemove.id))
        return;
  
      await member.roles.remove(roleToRemove.id, `role from poll named '${
        messageQuery.sentMessage.title}' on #${
        messageQuery.sentMessage.channel.name} created by ${
        messageQuery.author.user.tag}`);

      messageQuery.userReactions
        .set(member.id, { role: undefined, reaction: undefined, date: Date.now() });
      await messageQuery.save();
    }
  },
};
