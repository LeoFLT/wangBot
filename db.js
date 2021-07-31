const { connect } = require('mongoose');
const { mongoPath } = require('./config.json');

module.exports = {
  connect: async () => (connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })),
};
