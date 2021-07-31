const { Schema, model } = require('mongoose');

const RoleSchema = new Schema({
  id: String,
  name: String,
});

module.exports = model('DiscordRole', RoleSchema);
