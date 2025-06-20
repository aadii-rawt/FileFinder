const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const FolderModel = require('./models/Folder')
app.use(cors());
app.use(express.json());

console.log(FolderModel);


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/* ============== Routes ============== */
const folderRoute = require("./routes/folderRoutes")

app.use("/api/v1/folders", folderRoute)
/* ============== Start Server ============== */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));