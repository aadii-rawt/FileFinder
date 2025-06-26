const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const cors = require("cors")
app.use(cors())
app.use(express.json())
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser");

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  next();
});


const allowedOrigins = [
  process.env.ORIGIN_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        // Allow requests with no origin (like mobile apps)
        return callback(null, true);
      }

      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  })
);


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