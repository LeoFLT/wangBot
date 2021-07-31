const { Schema, model } = require('mongoose');
const GuildModel = require('./Guild').schema;
const RoleSchema = require('./Role').schema;
const MemberModel = require('./Member').schema;
const MessageSchema = require('./Message').schema;
const ChannelSchema = require('./Channel').schema;

const ReactionListenerSchema = new Schema({
  id: String,
  guild: GuildModel,
  author: MemberModel,
  sentMessage: {
    id: String,
    title: String,
    content: String,
    channel: ChannelSchema,
  },
  channel: ChannelSchema,
  message: MessageSchema,
  roleToPing: RoleSchema,
  is_ongoing: {
    type: Boolean,
    default: true,
  },
  allow_dupes: {
    type: Boolean,
    default: false,
  },
  availableRoles: {
    type: Map,
    of: Object,
    default: new Map(),
  },
  userReactions: {
    type: Map,
    of: Object,
    default: new Map(),
  },
});

module.exports = model('ReactionListener', ReactionListenerSchema);
