const { Schema, model } = require('mongoose');
const GuildSchema = require('./Guild').schema;

const ChannelSchema = new Schema({
  id: String,
  name: String,
  guild: GuildSchema,
});

module.exports = model('DiscordChannel', ChannelSchema);
