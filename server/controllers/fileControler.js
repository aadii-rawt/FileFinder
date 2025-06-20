
export const getFile =  async (req, res) => {
    try {
        const parent = req.query.parent || null;
        const files = await FileModel.find({ parent, trashed: false }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch files" });
    }
}

export const GetAllFiles =  async (req, res) => {
    try {
        const files = await FileModel.find({ trashed: false }).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch all files" });
    }
}