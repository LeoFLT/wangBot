const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  id: String,
  tag: String,
});

module.exports = model('DiscordUser', UserSchema);
