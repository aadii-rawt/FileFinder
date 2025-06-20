const express = require("express");
const { uploadFile, uploadBulk } = require("../controllers/uploadControler");
const router = express.Router()
const multer = require('multer')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

router.post("/", upload.single("file"), uploadFile);

router.post("/upload-bulk", upload.array("files"), uploadBulk);

module.exports = router