const express = require("express");
const { searchFile } = require("../controllers/searchRoute");
const router = express.Router()

router.get("/smart-search", searchFile);

module.exports = router