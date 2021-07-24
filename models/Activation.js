const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ActivationSchema = new Schema({
  userid: String,
  code: String,
  expiry: {
    type: Date,
    default: Date.now
  }
});

module.exports = Activation = mongoose.model("activate", ActivationSchema);
