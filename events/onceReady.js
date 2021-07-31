const ReactionListener = require('../models/Reaction');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    process.stdout.write(
      `\n${new Date()
        .toISOString()
        .replace(
          't',
          ' ',
        )} - INFO: Loading messages to watch... `,
    );
    const messagesToWatch = await ReactionListener.find({ is_ongoing: true });
    let messageCount = 0;
    let failedCount = 0;
    for (const message of messagesToWatch) {
      try {
        const { sentMessage } = message;
        const channel = client.channels.cache.get(sentMessage.channel.id);
        await channel.messages.fetch(sentMessage.id);
        messageCount++;
      } catch (e) {
        failedCount++;
      }
    }
    process.stdout.write(`OK! (Loaded: ${messageCount}${failedCount ? ` | Failed:${failedCount}` : ''})\n`);
  },
};
