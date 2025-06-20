import axios from "axios";


export const searchFile = async (req, res) => {
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
}