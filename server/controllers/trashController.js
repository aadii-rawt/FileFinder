const FileModel = require("../models/File")
const FolderModel = require("../models/Folder")

const getTrash = async (req, res) => {
  console.log("reached");
  
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const trashedFiles = await FileModel.find({ trashed: true, user: userId }).sort({ trashedAt: -1 });
    const trashedFolders = await FolderModel.find({ trashed: true, user: userId }).sort({ trashedAt: -1 });

    res.json({
      trashedFiles,
      trashedFolders,
    });
  } catch (err) {
    console.error("Error fetching trash:", err);
    res.status(500).json({ error: "Failed to fetch trash." });
  }
};


const folderRestore = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const folder = await FolderModel.findOne({ _id: req.params.id, user: userId });
  if (!folder) return res.status(404).json({ error: "Folder not found or access denied" });

  await FolderModel.findByIdAndUpdate(req.params.id, { trashed: false, trashedAt: null });
  res.json({ success: true });
};

const permanentDelete = async (req, res) => {
  const { userId } = req.body;
  const { id } = req.params;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const file = await FileModel.findOne({ _id: id, user: userId });
    if (file) {
      await FileModel.findByIdAndDelete(id);
      return res.json({ success: true, type: "file", id });
    }

    const folder = await FolderModel.findOne({ _id: id, user: userId });
    if (folder) {
      await deleteFolderAndContents(id, userId);
      return res.json({ success: true, type: "folder", id });
    }

    res.status(404).json({ error: "Item not found or access denied." });
  } catch (err) {
    console.error("Permanent delete error:", err);
    res.status(500).json({ error: "Failed to permanently delete." });
  }
};

const deleteFolderAndContents = async (folderId, userId) => {
  await FileModel.deleteMany({ parent: folderId, user: userId });

  const subfolders = await FolderModel.find({ parent: folderId, user: userId });

  for (const subfolder of subfolders) {
    await deleteFolderAndContents(subfolder._id, userId);
  }

  await FolderModel.findByIdAndDelete(folderId);
};



module.exports = { getTrash, folderRestore, permanentDelete }