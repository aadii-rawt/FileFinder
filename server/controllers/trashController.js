const FileModel = require("../models/File")
const FolderModel = require("../models/Folder")

const getTrash = async (req, res) => {
    try {
        const trashedFiles = await FileModel.find({ trashed: true }).sort({ trashedAt: -1 });
        const trashedFolders = await FolderModel.find({ trashed: true }).sort({ trashedAt: -1 });

        res.json({
            trashedFiles,
            trashedFolders,
        });
    } catch (err) {
        console.error("Error fetching trash:", err);
        res.status(500).json({ error: "Failed to fetch trash." });
    }
}

const folderRestore = async (req, res) => {
    await FolderModel.findByIdAndUpdate(req.params.id, { trashed: false });
    res.json({ success: true });
}


const permanentDelete = async (req, res) => {
  const { id } = req.params;

  try {
    // Try to find the item in files first
    // const file = await FileModel.findById(id);
    // if (file) {
    //   await FileModel.findByIdAndDelete(id);
    //   return res.json({ success: true, type: "file", id });
    // }

    // If not a file, check for folder
    const folder = await FolderModel.findById(id);
    if (folder) {
      await deleteFolderAndContents(id); // 👈 Recursive deletion
      return res.json({ success: true, type: "folder", id });
    }

    res.status(404).json({ error: "Item not found." });
  } catch (err) {
    console.error("Permanent delete error:", err);
    res.status(500).json({ error: "Failed to permanently delete." });
  }
};

const deleteFolderAndContents = async (folderId) => {
  // Delete all files inside this folder
  await FileModel.deleteMany({ parent: folderId });

  // Find all subfolders of this folder
  const subfolders = await FolderModel.find({ parent: folderId });

  // Recursively delete all subfolders and their contents
  for (const subfolder of subfolders) {
    await deleteFolderAndContents(subfolder._id);
  }

  // Delete the folder itself
  await FolderModel.findByIdAndDelete(folderId);
};



module.exports = { getTrash, folderRestore, permanentDelete }