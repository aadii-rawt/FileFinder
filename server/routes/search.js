const express = require("express");
const router = express.Router();
const Fuse = require("fuse.js");
const FileModel = require("../models/File");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  const { q, userId } = req.query;

  if (!q || !userId) {
    return res.status(400).json({ error: "Missing search query or userId." });
  }

  try {
    const files = await FileModel.find({
      user: new mongoose.Types.ObjectId(userId),
      trashed: false,
    });

    const fuse = new Fuse(files, {
      keys: ["geminiText", "filename"],
      threshold: 0.3,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });

    const result = fuse.search(q.trim().toLowerCase());
    const matchingFiles = result.map((r) => r.item);

    res.json(matchingFiles);
  } catch (err) {
    console.error("Fuzzy smart search error:", err);
    res.status(500).json({ error: "Smart search failed." });
  }
});

module.exports = router;
