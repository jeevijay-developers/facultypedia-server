import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import questionRoutes from "./routes/questions.route.js";
import webinarRoutes from "./routes/webinar.route.js";
import educatorRoutes from "./routes/educator.route.js";
import testRoutes from "./routes/test.route.js";
import courseRoutes from "./routes/course.route.js";
import testSeriesRoutes from "./routes/testSeries.route.js";
import studentRoutes from "./routes/student.route.js";
import connectDB from "./util/DBConnect.js";
dotenv.config();

const APP = express();

// Middleware
const allowedOrigins = [
  process.env.NEXT_PUBLIC_DASHBOARD_URL,
  process.env.NEXT_PUBLIC_WEB_URL,
].filter(Boolean);
APP.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  })
);
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Use routes
APP.use("/api/questions", questionRoutes);
APP.use("/api/webinars", webinarRoutes);
APP.use("/api/educators", educatorRoutes);
APP.use("/api/tests", testRoutes);
APP.use("/api/courses", courseRoutes);
APP.use("/api/test-series", testSeriesRoutes);
APP.use("/api/students", studentRoutes);

const PORT = process.env.PORT || 5000;

APP.get("/", (req, res) => {
  res.send("Hello World!");
});

// Debug route to check Test model
APP.get("/debug/test-count", async (req, res) => {
  try {
    const { default: Test } = await import('./models/test.js');
    const count = await Test.countDocuments();
    res.json({ 
      success: true, 
      testCount: count,
      message: 'Test model is working'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Test model error'
    });
  }
});

//^ Server starting
APP.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  connectDB();
});
