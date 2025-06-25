const express = require("express")
const { getFolder, createFolder, getFolderById, trashFolder, renameFolder } = require("../controllers/folderController")
const router = express.Router()

router.get("/", getFolder)
router.post("/", createFolder);
router.get("/:id", getFolderById);
router.patch("/trash/:id", trashFolder)
router.put('/:id', renameFolder);

module.exports = router