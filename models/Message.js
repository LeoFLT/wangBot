const { Schema, model } = require('mongoose');
const GuildSchema = require('./Guild').schema;
const MemberSchema = require('./Member').schema;
const ChannelSchema = require('./Channel').schema;

const MessageSchema = new Schema({
  id: String,
  guild: GuildSchema,
  channel: ChannelSchema,
  author: MemberSchema,
});

module.exports = model('DiscordMessage', MessageSchema);
