const { Schema, model } = require('mongoose');

const GuildSchema = new Schema({
  name: String,
  id: String,
  prefix: {
    default: '.',
    type: String,
  },
});

module.exports = model('DiscordGuild', GuildSchema);
