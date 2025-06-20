
export const getTrashFiles = async (req, res) => {
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

export const trashFolder = async (req, res) => {
    await FolderModel.findByIdAndUpdate(req.params.id, { trashed: false });
    res.json({ success: true });
}

export const trashFiles = async (req, res) => {
    await FileModel.findByIdAndUpdate(req.params.id, { trashed: false });
    res.json({ success: true });
}
