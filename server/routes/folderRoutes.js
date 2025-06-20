const express = require('express');
const { createFolder, getFolderById, getFolder } = require('../controllers/folderControler');
const router = express.Router();


// Root folder
router.get("/", getFolder);
router.post("/folders", createFolder);


router.get("/folders/:id", getFolderById);

module.exports = router;
