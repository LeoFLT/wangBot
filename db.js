const mongoose = require("mongoose");
const { mongoPath } = require("./config.json");
module.exports = {
  mongoose: async () => {
    await mongoose.connect(mongoPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return mongoose;
  },
};
