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
const Fuse = require("fuse.js");

// const trashRoute = require("./routes/trash")
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


app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    let geminiDescription = "";

    const isImage = req.file.mimetype.startsWith("image");
    const isPdf = req.file.mimetype === "application/pdf";

    if (isImage || isPdf) {
      const buffer = fs.readFileSync(req.file.path);
      const base64 = buffer.toString("base64");

      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: "Summarize the contents of this file. If it's a resume, extract key info like name, skills, and experience." },
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
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});


app.post("/upload-bulk", upload.array("files"), async (req, res) => {
  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "auto",
      });

      let geminiDescription = "";

      if (file.mimetype.startsWith("image")) {
        try {
          const base64Image = base64Img.base64Sync(file.path);
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
                        mimeType: file.mimetype,
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
          console.log("🧠 Gemini:", file.originalname, " → ", geminiDescription);
        } catch (err) {
          console.error("Gemini error:", err.response?.data || err.message);
        }
      }

      const newFile = new FileModel({
        filename: file.originalname,
        url: result.secure_url,
        type: file.mimetype,
        geminiText: geminiDescription,
        parent: req.body.parent || null,
        path: file.webkitRelativePath || "", // you can save folder path
      });

      await newFile.save();
      uploadedFiles.push(newFile);

      fs.unlinkSync(file.path);
    }

    res.status(200).json({ uploadedFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Bulk upload failed" });
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
    const folders = await FolderModel.find({ parent, trashed: false }).sort({ createdAt: 1 });
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
// Add this route:
app.get("/folders/test", async (req, res) => {
  try {
    const folders = await FolderModel.find().limit(5);
    res.json(folders);
  } catch (err) {
    console.error("❌ TEST ERROR:", err);
    res.status(500).json({ error: "Test failed" });
  }
});





// Move folder to trash:
app.patch("/folders/:id/trash", async (req, res) => {
  await FolderModel.findByIdAndUpdate(req.params.id, { trashed: true });
  res.json({ success: true });
});

app.patch("/folders/:id/restore", async (req, res) => {
  await FolderModel.findByIdAndUpdate(req.params.id, { trashed: false });
  res.json({ success: true });
});


// 📄 Get Files by Parent
app.get("/files", async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const files = await FileModel.find({ parent, trashed: false }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/files/all", async (req, res) => {
  try {
    const files = await FileModel.find({ trashed: false }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all files" });
  }
});

app.patch("/files/:id/trash", async (req, res) => {
  await FileModel.findByIdAndUpdate(req.params.id, { trashed: true });
  res.json({ success: true });
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

// app.get("/smart-search", async (req, res) => {
//   const { q } = req.query;
//   if (!q) return res.status(400).json({ error: "Search query required." });

//   try {
//     const files = await FileModel.find();

//     // Define Fuse options
//     const fuse = new Fuse(files, {
//       keys: ["geminiText", "filename"], // Fields to search in
//       threshold: 0.3, // Lower is stricter (0.0 = exact match, 1.0 = match anything)
//       minMatchCharLength: 2,
//       ignoreLocation: true,
//       includeScore: true,
//     });

//     const result = fuse.search(q);

//     // Map Fuse results to actual files
//     const matchingFiles = result.map((r) => r.item);

//     res.json(matchingFiles);
//   } catch (err) {
//     console.error("Fuzzy smart search error:", err);
//     res.status(500).json({ error: "Smart search failed." });
//   }
// });

app.get("/smart-search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Search query required." });

  try {
    const files = await FileModel.find({ geminiText: { $exists: true, $ne: "" } });
    const matchingFiles = [];

    for (const file of files) {
      const prompt = `
User searched for: "${q}"

Below is a document description. Respond only with "Yes" if it matches the user's intent. Otherwise, respond "No".

Description:
${file.geminiText}
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }
      );

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase();
      if (reply && reply.includes("yes")) {
        matchingFiles.push(file);
      }
    }

    res.json(matchingFiles);
  } catch (err) {
    console.error("Semantic search error:", err.response?.data || err.message);
    res.status(500).json({ error: "Smart search failed." });
  }
});



/* ============== Start Server ============== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));