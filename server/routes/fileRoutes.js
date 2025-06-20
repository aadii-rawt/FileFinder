const express = require('express');
const multer = require('multer');
const File = require('../models/File');
const { GetAllFiles, getFile } = require('../controllers/fileControler');
const router = express.Router();

router.get("/", getFile);

router.get("/files/all",GetAllFiles);

module.exports = router;
