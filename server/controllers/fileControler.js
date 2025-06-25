const FileModel = require("../models/File")

const getFile = async (req, res) => {
    try {
        const parent = req.query.parent || null;
        const files = await FileModel.find({ parent, trashed: false }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch files" });
    }
}

const getAllFiles = async (req, res) => {
    try {
        const files = await FileModel.find({ trashed: false }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all files" });
    }
}

const trashFile = async (req, res) => {
    await FileModel.findByIdAndUpdate(req.params.id, { trashed: true });
    res.json({ success: true });
}

module.exports = { getFile, getAllFiles, trashFile }