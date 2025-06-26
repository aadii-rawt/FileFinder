const mongoose = require("mongoose");
const FileModel = require("../models/File");

const getFile = async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const userId = req.query.userId;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const files = await FileModel.find({
      parent,
      user: new mongoose.Types.ObjectId(userId),
      trashed: false,
    }).sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

const getAllFiles = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const files = await FileModel.find({
      user: new mongoose.Types.ObjectId(userId),
      trashed: false,
    }).sort({ createdAt: -1 });

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all files" });
  }
};

const trashFile = async (req, res) => {
    await FileModel.findByIdAndUpdate(req.params.id, { trashed: true });
    res.json({ success: true });
}

module.exports = { getFile, getAllFiles, trashFile }