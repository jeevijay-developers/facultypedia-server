import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import questionRoutes from "./routes/questions.route.js";
import webinarRoutes from "./routes/webinar.route.js";
import educatorRoutes from "./routes/educator.route.js";
import testRoutes from "./routes/test.route.js";
import courseRoutes from "./routes/course.route.js";
import testSeriesRoutes from "./routes/testSeries.route.js";
import authRoutes from "./routes/auth.route.js";
import studentRoutes from "./routes/student.route.js";
import postRoutes from "./routes/post.route.js";
import paymentRoutes from "./routes/payment.route.js";
import educatorUpdateRoutes from "./routes/educatorUpdate.route.js";
import liveClassRoutes from "./routes/liveClass.route.js";
import studyMaterialRoutes from "./routes/studyMaterial.route.js";
import uploadRoutes from "./routes/upload.route.js";
import videoRoutes from "./routes/video.route.js";
import notificationRoutes from "./routes/notification.route.js";
import adminRoutes from "./routes/admin.route.js";
import educatorMessageRoutes from "./routes/educatorMessage.route.js";
import chatRoutes from "./routes/chat.route.js";
import queryRoutes from "./routes/query.route.js";
import resultRoutes from "./routes/result.route.js";
import progressRoutes from "./routes/progress.route.js";
import reviewRoutes from "./routes/review.route.js";
import connectDB from "./util/DBConnect.js";
import initializeNotificationSocket from "./sockets/notification.socket.js";
import { initializeChatNamespace } from "./sockets/chat.socket.js";
import { initializeStudentEducatorQueryNamespace } from "./sockets/studentEducator.socket.js";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const APP = express();
const server = createServer(APP);

// Initialize CORS allow-list for REST + Socket.IO
const normalizeOrigin = (origin = "") =>
  origin.toString().trim().replace(/\/+$/, "").toLowerCase();

const configuredOrigins = [
  process.env.NEXT_PUBLIC_EDUCATOR_DASHBOARD_URL,
  process.env.NEXT_PUBLIC_WEB_URL,
  process.env.NEXT_PUBLIC_SUPER_DASHBOARD_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
].filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://facultypedia.com",
  "https://www.facultypedia.com",
  "https://educator.facultypedia.com",
  "https://admin.facultypedia.com",
];

const allowedOrigins = new Set(
  [...defaultAllowedOrigins, ...configuredOrigins]
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
);

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }
  return allowedOrigins.has(normalizeOrigin(origin));
};

const corsOriginHandler = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error("Not allowed by CORS"));
};

const corsOptions = {
  origin: corsOriginHandler,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 204,
};

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

// Initialize notification socket handlers
initializeNotificationSocket(io);

// Initialize chat socket namespace
initializeChatNamespace(io);

// Initialize student-educator query namespace
initializeStudentEducatorQueryNamespace(io);

// Middleware
APP.use(
  cors(corsOptions)
);
APP.options(/.*/, cors(corsOptions));
APP.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith("/api/payments/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);
APP.use(express.urlencoded({ extended: true }));

// Use routes
APP.use("/api/auth", authRoutes);
APP.use("/api/admin", adminRoutes);
APP.use("/api/chat", chatRoutes);
APP.use("/api/queries", queryRoutes);
APP.use("/api/questions", questionRoutes);
APP.use("/api/webinars", webinarRoutes);
APP.use("/api/educators", educatorRoutes);
APP.use("/api/educators", educatorMessageRoutes);
APP.use("/api/tests", testRoutes);
APP.use("/api/courses", courseRoutes);
APP.use("/api/test-series", testSeriesRoutes);
APP.use("/api/students", studentRoutes);
APP.use("/api/live-classes", liveClassRoutes);
APP.use("/api", resultRoutes);
APP.use("/api/study-materials", studyMaterialRoutes);
APP.use("/api/videos", videoRoutes);
APP.use("/api/posts", postRoutes);
APP.use("/api/payments", paymentRoutes);
APP.use("/api/educator-update", educatorUpdateRoutes);
APP.use("/api/upload", uploadRoutes);
APP.use("/api/notifications", notificationRoutes);
APP.use("/api/progress", progressRoutes);
APP.use("/api/reviews", reviewRoutes);

APP.use((err, _req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked for this origin",
    });
  }

  if (err instanceof multer.MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum allowed size is 25 MB per file."
        : err.message || "Upload failed";

    return res.status(statusCode).json({
      success: false,
      message,
      code: err.code,
    });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

APP.get("/", (req, res) => {
  res.send("Hello World!");
});

// Server starting
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}`);
  console.log("CORS allowed origins:", Array.from(allowedOrigins));
  connectDB();
});
