import express from "express";
import multer from "multer";
import {
  createVideo,
  deleteVideo,
  getCourseVideosPublic,
  getVideoById,
  getVideosByCourse,
  getVideos,
  updateVideo,
  uploadVideoToVimeoController,
} from "../controllers/video.controller.js";
import {
  createVideoValidation,
  updateVideoValidation,
  validateCourseIdParam,
  validateObjectId,
} from "../util/validation.js";
import { authenticateEducator } from "../middleware/auth.middleware.js";

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

router.post("/", authenticateEducator, createVideoValidation, createVideo);
router.post(
  "/upload-to-vimeo",
  authenticateEducator,
  upload.single("video"),
  uploadVideoToVimeoController
);
router.get("/course/:courseId", validateObjectId("courseId"), getCourseVideosPublic);
router.get("/", authenticateEducator, getVideos);
router.get("/course/:courseId", validateCourseIdParam, getVideosByCourse);
router.get("/:id", authenticateEducator, validateObjectId(), getVideoById);
router.put(
  "/:id",
  authenticateEducator,
  [...validateObjectId(), ...updateVideoValidation],
  updateVideo
);
router.delete("/:id", authenticateEducator, validateObjectId(), deleteVideo);

export default router;
