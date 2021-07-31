const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'messageReactionAdd',
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

    const messageQuery = await ReactionListener.findOne({ id: reaction.message.id, is_ongoing: true });
    if (!messageQuery) return;

    if (messageQuery.availableRoles.has(reaction.emoji.name)) {
      // do Stuff
      const roleToApply = messageQuery.availableRoles.get(reaction.emoji.name);
      const guild = await client.guilds.fetch(messageQuery.sentMessage.channel.guild.id);
      const member = guild.members.cache.find((m) => m.user.id === user.id);
      if (!member) return;

      if (messageQuery.allow_dupes) {
        try {
          await member.roles.add(roleToApply.id, `role from poll named '${
            messageQuery.sentMessage.title}' on #${
            messageQuery.sentMessage.channel.name} created by ${
            messageQuery.author.user.tag}`);
        } catch (e) {
          console.error(`Failed to apply role on user. Guild: ${guild.name} (ID: ${guild.id})`, e.stack);
        }
      } else {
        await messageQuery.availableRoles.forEach((v, k) => {
          if (member.roles.cache.has(v.id)) {
            if (k !== reaction.emoji.name) {
              member.roles.remove(v.id, `role from poll named '${
                messageQuery.sentMessage.title}' on #${
                messageQuery.sentMessage.channel.name} created by ${
                messageQuery.author.user.tag}`);
            }
          }
        });
        await member.roles.add(roleToApply.id, `role from poll named '${
          messageQuery.sentMessage.title}' on #${
          messageQuery.sentMessage.channel.name} created by ${
          messageQuery.author.user.tag}`);
        messageQuery.userReactions.set(member.id, { role: roleToApply.id, reaction: reaction.emoji.name });
        await messageQuery.save();
      }
    }
  },
};
