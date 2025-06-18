const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const path = require('path');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Root files
router.get('/', async (req, res) => {
  const files = await File.find({ parent: null }).sort({ createdAt: 1 });
  res.json(files);
});

// Nested files
router.get('/:parentId', async (req, res) => {
  const files = await File.find({ parent: req.params.parentId }).sort({ createdAt: 1 });
  res.json(files);
});

// Upload file
router.post('/', upload.single('file'), async (req, res) => {
  const file = new File({
    name: req.file.originalname,
    path: req.file.path,
    parent: req.body.parent || null,
  });
  await file.save();
  res.json(file);
});

module.exports = router;
