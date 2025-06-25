
const FolderModel = require("../models/Folder")

const getFolder = async (req, res) => {
    try {
        const parent = req.query.parent || null;
        const folders = await FolderModel.find({ parent, trashed: false }).sort({ createdAt: 1 });
        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch folders" });
    }
}

const createFolder = async (req, res) => {
    try {
        const folder = new FolderModel({
            name: req.body.name,
            parent: req.body.parent || null,
        });
        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        console.error("Error creating folder:", err);
        res.status(500).json({ error: "Failed to create folder" });
    }
}

const getFolderById = async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.id);
        if (!folder) return res.status(404).json({ error: "Folder not found" });
        res.json(folder);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch folder" });
    }
}

const trashFolder = async (req, res) => {
    await FolderModel.findByIdAndUpdate(req.params.id, { trashed: true });
    res.json({ success: true });
}

const renameFolder = async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const folder = await FolderModel.findById(req.params.id);
        if (!folder) return res.status(404).json({ error: 'Folder not found' });

        // Check for duplicate name among siblings
        const duplicate = await FolderModel.findOne({
            parent: folder.parent || null,
            name: name.trim(),
            _id: { $ne: folder._id },
            trashed: { $ne: true },
        });

        if (duplicate) {
            return res.status(409).json({ error: 'A folder with that name already exists' });
        }

        folder.name = name.trim();
        await folder.save();

        res.json({ success: true, folder });
    } catch (err) {
        console.error('Rename folder error:', err);
        res.status(500).json({ error: 'Failed to rename folder' });
    }
}

module.exports = { getFolder, createFolder, getFolderById, trashFolder, renameFolder }