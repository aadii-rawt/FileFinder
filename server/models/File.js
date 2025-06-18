const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    geminiText: { type: String, default: "" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", FileSchema);
