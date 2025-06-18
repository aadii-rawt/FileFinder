const express = require('express');
const Folder = require('../models/Folder');
const router = express.Router();

// Root folders
router.get('/', async (req, res) => {
  const folders = await Folder.find({ parent: null }).sort({ createdAt: 1 });
  res.json(folders);
});

// Nested folders
router.get('/:parentId', async (req, res) => {
  const folders = await Folder.find({ parent: req.params.parentId }).sort({ createdAt: 1 });
  res.json(folders);
});

// Create folder
router.post('/', async (req, res) => {
  const folder = new Folder(req.body);
  await folder.save();
  res.json(folder);
});

module.exports = router;
