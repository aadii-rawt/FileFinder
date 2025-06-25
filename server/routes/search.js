const express = require("express");
const router = express.Router()
const Fuse = require("fuse.js");
const FileModel = require("../models/File")

router.get("/", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Search query required." });

  try {
    const files = await FileModel.find();

    const fuse = new Fuse(files, {
      keys: ["geminiText", "filename"],
      threshold: 0.3,
      minMatchCharLength: 2,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: false, // Set to true to debug
    });

    const query = String(q).trim().toLowerCase();
    const result = fuse.search(query);
    const matchingFiles = result.map((r) => r.item);

    res.json(matchingFiles);
  } catch (err) {
    console.error("Fuzzy smart search error:", err);
    res.status(500).json({ error: "Smart search failed." });
  }
});


module.exports = router