const { connect } = require('mongoose');
const mongoPath = process.env.MONGO_PATH;

module.exports = {
  connect: async () => (connect(mongoPath, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })),
};
