const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    senderName: {
      type: String,
      required: true,
    },
    senderPhone: {
      type: Number,
      required: true,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    senderMessage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", messageSchema);
