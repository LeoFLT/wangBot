const { Schema, model } = require('mongoose');
const UserSchema = require('./User').schema;
const GuildSchema = require('./Guild').schema;

const MemberSchema = new Schema({
  id: String,
  guild: GuildSchema,
  user: UserSchema,
});

module.exports = model('DiscordMember', MemberSchema);
