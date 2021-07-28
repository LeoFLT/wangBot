const { model, Schema } = require("mongoose");

const ReactionListenerSchema = new Schema({
  _id: Object,
  guild: String,
  message: {
    _id: Object,
    id: String,
    title: String,
    content: String,
    channel: String,
    author: {
      _id: Object,
      id: String,
      tag: String,
    },
  },
  channel: {
    _id: Object,
    id: String,
    guild: String,
    name: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  is_ongoing: {
    type: Boolean,
    default: true,
  },
  allow_dupes: {
    type: Boolean,
    default: false,
  },
  roles: [
    {
      _id: Object,
      id: String,
      name: String,
      guild: String,
      channel: String,
      reaction: String,
    },
  ],
  users: [
    {
      type: Map,
      _id: Object,
      id: String,
      role_id: String,
      role_name: String,
    },
  ],
});

module.exports = model("WatchReaction", ReactionListenerSchema);
