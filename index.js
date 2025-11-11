import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import questionRoutes from "./routes/questions.route.js";
import webinarRoutes from "./routes/webinar.route.js";
import educatorRoutes from "./routes/educator.route.js";
import testRoutes from "./routes/test.route.js";
import connectDB from "./util/DBConnect.js";
dotenv.config();

const APP = express();

// Middleware
APP.use(cors());
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Use routes
APP.use("/api/questions", questionRoutes);
APP.use("/api/webinars", webinarRoutes);
APP.use("/api/educators", educatorRoutes);
APP.use("/api/tests", testRoutes);

const PORT = process.env.PORT || 5000;

APP.get("/", (req, res) => {
  res.send("Hello World!");
});

//^ Server starting
APP.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  connectDB();
});
