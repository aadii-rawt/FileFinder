const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const axios = require("axios");
const base64Img = require("base64-img");
const FileModel = require("./models/File");
const FolderModel = require("./models/Folder");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ============== Routes ============== */

// 📁 Upload File
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    let geminiDescription = "";

    if (req.file.mimetype.startsWith("image")) {
      try {
        const base64Image = base64Img.base64Sync(req.file.path);
        const base64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [
              {
                parts: [
                  { text: "Describe this image clearly and concisely." },
                  {
                    inlineData: {
                      mimeType: req.file.mimetype,
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }
        );

        geminiDescription =
          geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log("🧠 Gemini Description:", geminiDescription);
      } catch (err) {
        console.error("Gemini API error:", err.response?.data || err.message);
      }
    }

    const newFile = new FileModel({
      filename: req.file.originalname,
      url: result.secure_url,
      type: req.file.mimetype,
      geminiText: geminiDescription,
      parent: req.body.parent || null,
    });

    await newFile.save();
    fs.unlinkSync(req.file.path);

    res.status(200).json(newFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// 📂 Create Folder
app.post("/folders", async (req, res) => {
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
});

// 📂 Get Folders by Parent
app.get("/folders", async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const folders = await FolderModel.find({ parent }).sort({ createdAt: 1 });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

app.get("/folders/:id", async (req, res) => {
  try {
    const folder = await FolderModel.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch folder" });
  }
});

app.patch("/folders/:id/trash", async (req, res) => {
  try {
    const folder = await FolderModel.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Folder not found" });

    folder.trashed = true;
    folder.trashedAt = new Date();
    await folder.save();

    res.json({ success: true, message: "Folder moved to trash." });
  } catch (err) {
    console.error("Error moving folder to trash:", err);
    res.status(500).json({ error: "Failed to move folder to trash." });
  }
});


// 📄 Get Files by Parent
app.get("/files", async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const files = await FileModel.find({ parent }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/files/all", async (req, res) => {
  try {
    const files = await FileModel.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all files" });
  }
});

app.patch("/files/:id/trash", async (req, res) => {
  try {
    const file = await FileModel.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    file.trashed = true;
    file.trashedAt = new Date();
    await file.save();

    res.json({ success: true, message: "File moved to trash." });
  } catch (err) {
    console.error("Error moving file to trash:", err);
    res.status(500).json({ error: "Failed to move file to trash." });
  }
});

// 🗑️ Fetch Trash
app.get("/trash", async (req, res) => {
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
});

// 🔍 Global Smart Search Route (Gemini-based)
app.get("/smart-search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Search query required." });

  try {
    const files = await FileModel.find();
    const matchingFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image")) continue;

      // Step 1: Download the image and convert to base64
      const imageBuffer = await axios
        .get(file.url, { responseType: "arraybuffer" })
        .then((res) => Buffer.from(res.data).toString("base64"));

      // Step 2: Create a Gemini API request
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Does this image visually match the query: "${q}"? Respond with only "Yes" or "No".`,
                },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: imageBuffer,
                  },
                },
              ],
            },
          ],
        }
      );

      const reply =
        geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase();

      if (reply && reply.includes("yes")) {
        matchingFiles.push(file);
      }
    }

    res.json(matchingFiles);
  } catch (err) {
    console.error("Gemini smart search error:", err.response?.data || err.message);
    res.status(500).json({ error: "Smart search failed using Gemini." });
  }
});



/* ============== Start Server ============== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
