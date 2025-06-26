const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    trashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Folder", FolderSchema);
