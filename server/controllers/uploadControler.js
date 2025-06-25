const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const base64Img = require("base64-img");
const FileModel = require("../models/File")
const fs = require("fs");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});


const uploadFile = async (req, res) => {
    console.log("reached")
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
}

const uploadBulk = async (req, res) => {
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
}

module.exports = { uploadFile, uploadBulk }