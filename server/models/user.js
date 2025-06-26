const mongoose = require("mongoose");
// const { comparePassword } = require("../utils/hash");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, default: "" },
});

module.exports = mongoose.model("User", userSchema);
