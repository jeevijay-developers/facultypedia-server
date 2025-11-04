
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const APP = express();

// Middleware
APP.use(cors());
APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/facultypedia", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

// Import routes
const questionsRoute = require("../routes/questions.route");
const webinarRoute = require("../routes/webinar-route");

// Use routes
APP.use("/api/questions", questionsRoute);
APP.use("/api/webinars", webinarRoute);

const PORT = process.env.PORT || 5000;

APP.get("/", (req, res) => {
    res.send("Hello World!");
});

//^ Server starting
APP.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
    connectDB();
});
