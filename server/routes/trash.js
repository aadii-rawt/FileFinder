const express = require("express");
const { trashFolder, trashFiles, getTrashFiles } = require("../controllers/trashControler");
const router = express.Router()

router.get("/trash", getTrashFiles);
router.patch("/files/:id/trash", trashFiles);
router.patch("/folders/:id/trash", trashFolder);

module.exports = router