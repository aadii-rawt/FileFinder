const express = require("express")
const { getTrash, folderRestore, permanentDelete } = require("../controllers/trashController")
const router = express.Router()

router.post("/", getTrash)
router.patch("/restore/:id", folderRestore)
router.delete("/permanent/:id", permanentDelete); // 👈 permanent delete route


module.exports = router