const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const cors = require("cors")
app.use(express.json())
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cookieParser());
app.use(express.json());


app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||                             // for Electron app (file:// or no origin)
      origin === 'http://localhost:5173'     // for dev mode
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const authRoute = require("./routes/auth")
const folderRoute = require("./routes/folderRoutes")
const fileRoutes = require("./routes/fileRoutes")
const uploadRoutes = require("./routes/uploadRoutes")
const searchRoutes = require("./routes/search")
const trashRoute = require("./routes/trashRoutes")

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/folders", folderRoute)
app.use("/api/v1/files", fileRoutes)
app.use("/api/v1/upload", uploadRoutes)
app.use("/api/v1/search", searchRoutes)
app.use("/api/v1/trash", trashRoute)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
