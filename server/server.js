// backend/index.js
import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import Tesseract from "tesseract.js";
import fs from "fs";
import FileModel from "./models/File.js";
import sharp from "sharp";
import axios from "axios";
import base64Img from "base64-img";

const app = express();
dotenv.config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
    });

    let extractedText = "";
    let geminiDescription = "";

    if (req.file.mimetype.startsWith("image")) {
      const preprocessedPath = `uploads/preprocessed-${req.file.filename}`;

      await sharp(req.file.path).grayscale().normalise().toFile(preprocessedPath);

      const { data } = await Tesseract.recognize(preprocessedPath, "eng", {
        logger: (m) => console.log(m),
      });

      if (data && Array.isArray(data.words)) {
        const topWords = data.words
          .filter((w) => w.text?.trim().length > 0)
          .sort((a, b) => b.font_size - a.font_size)
          .slice(0, 10)
          .map((w) => w.text)
          .join(" ");
        extractedText = topWords;
      } else if (data.text) {
        extractedText = data.text.trim();
      }

      fs.unlinkSync(preprocessedPath);

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
        console.log("\uD83E\uDDE0 Gemini detected content:", geminiDescription);
      } catch (geminiErr) {
        console.error("Gemini Vision API error:", geminiErr.response?.data || geminiErr.message);
      }
    }

    const newFile = new FileModel({
      filename: req.file.originalname,
      url: result.secure_url,
      type: req.file.mimetype,
      extractedText,
      geminiText: geminiDescription,
    });

    await newFile.save();
    fs.unlinkSync(req.file.path);

    res.status(200).json(newFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/files", async (req, res) => {
  const files = await FileModel.find().sort({ createdAt: -1 });
  res.json(files);
});

app.get("/search", async (req, res) => {
  const { q } = req.query;
  const regex = new RegExp(q, "i");
  const results = await FileModel.find({
    $or: [
      { filename: regex },
      { extractedText: regex },
      { geminiText: regex },
    ],
  });
  res.json(results);
});

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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
