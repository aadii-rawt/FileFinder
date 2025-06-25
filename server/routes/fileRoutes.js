const express = require('express');
const { getFile, getAllFiles, trashFile } = require('../controllers/fileControler');
const router = express.Router();

router.get("/", getFile);
router.get("/all", getAllFiles);
router.patch("/trash/:id", trashFile)

module.exports = router;
