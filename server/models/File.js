// backend/models/File.js
import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    filename: String,
    url: String,
    type: String,
    extractedText: String,
  },
  { timestamps: true }
);

export default mongoose.model("File", FileSchema);
