const { Schema, model } = require('mongoose');

const GuildSchema = new Schema({
  name: String,
  id: String,
  prefix: {
    default: '.',
    type: String,
  },
  survivorRole: {
    id: String,
    name: String,
  },
  rolesToWatch: {
    type: Map,
    of: Object,
    default: new Map(),
  },
});

module.exports = model('DiscordGuild', GuildSchema);
