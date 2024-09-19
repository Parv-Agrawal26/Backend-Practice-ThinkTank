const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: String,
  date: {
    type: Date,
    default: Date.now(),
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

module.exports = mongoose.model("post", postSchema);
