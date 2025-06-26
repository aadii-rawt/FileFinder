
const FolderModel = require("../models/Folder")
const mongoose = require("mongoose");
const FileModel = require("../models/File");
const getFolder = async (req, res) => {
    try {
        const parent = req.query.parent || null;
        const userId = req.query.userId;

        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const folders = await FolderModel.find({
            parent,
            user: new mongoose.Types.ObjectId(userId),
            trashed: false,
        }).sort({ createdAt: 1 });

        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch folders" });
    }
};


const createFolder = async (req, res) => {
    try {
        const folder = new FolderModel({
            name: req.body.name,
            parent: req.body.parent || null,
            user: new mongoose.Types.ObjectId(req.body.userId), // ✅ Required field
        });

        await folder.save();
        res.status(201).json(folder);
    } catch (err) {
        console.error("Error creating folder:", err);
        res.status(500).json({ error: "Failed to create folder" });
    }
};


const getFolderById = async (req, res) => {
    try {
        const folder = await FolderModel.findById(req.params.id);
        if (!folder) return res.status(404).json({ error: "Folder not found" });
        res.json(folder);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch folder" });
    }
}

// Helper function to recursively get all child folder IDs
const getAllChildFolderIds = async (parentId) => {
  const children = await FolderModel.find({ parent: parentId, trashed: false });
  let allIds = children.map(f => f._id.toString());

  for (const child of children) {
    const subIds = await getAllChildFolderIds(child._id);
    allIds.push(...subIds);
  }

  return allIds;
};

const trashFolder = async (req, res) => {
  const folderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    return res.status(400).json({ error: "Invalid folder ID" });
  }

  try {
    // 1. Trash the folder itself
    await FolderModel.findByIdAndUpdate(folderId, {
      trashed: true,
      trashedAt: new Date(),
    });

    // 2. Get all subfolders recursively
    const childFolderIds = await getAllChildFolderIds(folderId);

    // 3. Trash all child folders
    await FolderModel.updateMany(
      { _id: { $in: childFolderIds } },
      { $set: { trashed: true, trashedAt: new Date() } }
    );

    // 4. Trash all files in this folder and its children
    await FileModel.updateMany(
      {
        $or: [
          { parent: folderId },
          { parent: { $in: childFolderIds } },
        ],
      },
      { $set: { trashed: true, trashedAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error trashing folder:", err);
    res.status(500).json({ error: "Failed to trash folder" });
  }
};


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