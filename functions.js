const ReactionListener = require('./models/Reaction');

async function detectMemberFromReaction(user, reaction) {
  console.log(
    `${new Date().toISOString().replace('T', ' ')} - INFO:\t`
    + `${user.tag} reacted with :${reaction.emoji}: on message "${reaction.message.id}"`,
  );
  return reaction.message.guild.members.cache.find(
    (m) => m.user.id === user.id,
  );
}

module.exports = {
  parseCmd(cmd, msg, noBackticks) {
    if (noBackticks) {
      const startIndex = msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
      const endIndex = msg.indexOf(' ', startIndex + 1) + 1;
      // endIndex === 0 => no whitespace after startIndex
      const finalStr = msg.slice(startIndex, !endIndex ? undefined : endIndex);
      if (finalStr.startsWith('`') || finalStr.endsWith('`')) return;
      return finalStr.trim();
    }
    const startIndex = msg.indexOf(`${cmd} `, msg.split(/\s/)[0].length) + cmd.length + 1;
    const endIndex = msg.indexOf('`', startIndex + 1) + 1;
    const strNoFilter = msg.slice(
      startIndex,
      !endIndex ? undefined : endIndex,
    );
    if (!strNoFilter.startsWith('`') || !strNoFilter.endsWith('`')) return;
    return strNoFilter.replace(/`/g, '').trim();
  },
  async userAddRole(client, discordObj) {
    const { user, reaction } = discordObj;
    const member = await detectMemberFromReaction(user, reaction);
    if (!member) return;

    try {
      process.stdout.write(
        `${new Date()
          .toISOString()
          .replace('T', ' ')} - INFO:\tFetching message from DB...`,
      );
      const messageQuery = await ReactionListener.findById(reaction.message.id);

      process.stdout.write(messageQuery ? ' Found\n' : ' Not Found\n');
      if (!messageQuery?.is_ongoing) return;
      const roleToApply = messageQuery.availableRoles.get(reaction.emoji.name);
      const roleList = [];
      const removeArr = [];

      if (messageQuery.allow_dupes) {
        await member.roles.add(roleToApply, `added via reaction to a poll created by ${messageQuery.message.author.tag}`
          + ` on channel #${messageQuery.channel.name}`);
      } else {
        messageQuery.availableRoles.forEach((v) => roleList.push(v.id));
        member.roles.cache.forEach((role) => {
          if (roleList.includes(role.id)) removeArr.push(role);
        });
        await removeArr.forEach((r) => member.roles.remove(r, `removed via reaction to a poll created by ${messageQuery.message.author.tag}`
          + ` on channel #${messageQuery.channel.name}`));

        await member.roles.add(roleToApply.id, `added via reaction to a poll created by ${messageQuery.message.author.tag}`
          + ` on channel #${messageQuery.channel.name}`);
        messageQuery.users.set(user.id, roleToApply.id);
        await messageQuery.save().then(console.log);
      }
    } catch (e) {
      console.log(`${new Date().toISOString()
        .replace('T', ' ')} - ERROR:\t${e.message}\nStack: ${e.stack}`);
    }
  },
  async userRemoveRole(client, discordObj) {
    const { user, reaction } = discordObj;
    const member = await detectMemberFromReaction(user, reaction);
    if (!member) return;

    try {
      process.stdout.write(
        `${new Date()
          .toISOString()
          .replace('T', ' ')} - INFO:\tFetching message from DB...`,
      );
      const messageQuery = await ReactionListener.findById(reaction.message.id);
      process.stdout.write(messageQuery ? ' Found\n' : ' Not Found\n');
      if (!messageQuery) return;

      const roleToRemove = messageQuery.availableRoles.get(reaction.emoji.name);
      if (roleToRemove) {
        await member.roles.remove(roleToRemove.id,
          `removed via reaction to a poll created by ${messageQuery.message.author.tag}`
          + ` on channel #${messageQuery.channel.name}`);
        messageQuery.users.set(user.id, undefined);
        await messageQuery.save();
      }
    } catch (e) {
      console.log(`${new Date().toISOString()
        .replace('T', ' ')} - ERROR:\t${e.message}\nStack: ${e.stack}`);
    }
  },
  async fetchReactionList(dClient) {
    let allMessages = [];
    try {
      process.stdout.write(
        `${new Date()
          .toISOString()
          .replace('T', ' ')} - INFO:\tFetching messages from DB...`,
      );
      allMessages = await ReactionListener.find({
        is_ongoing: true,
      });
      process.stdout.write(' OK!');
    } catch (e) {
      process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
    }
    let messageCount = 0;
    await Promise.all(allMessages.map(async (msg) => {
      const channel = await dClient.guilds.cache
        .get(msg.guild)
        .channels.cache.get(msg.channel.id);
      channel.messages.fetch(msg.id).then(() => messageCount++).catch(console.log);
      messageCount++;
    }));
    process.stdout.write(` (${messageCount} messages cached)\n`);
  },
  discordTimestamp(dateObj) {
    return `<t:${Math.floor(dateObj ? dateObj.getTime() / 1000 : Date.now() / 1000)}:R>`;
  },
};
