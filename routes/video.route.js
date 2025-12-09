import express from "express";
import {
  createVideo,
  deleteVideo,
  getVideoById,
  getVideos,
  updateVideo,
} from "../controllers/video.controller.js";
import {
  createVideoValidation,
  updateVideoValidation,
  validateObjectId,
} from "../util/validation.js";

const router = express.Router();

router.post("/", createVideoValidation, createVideo);
router.get("/", getVideos);
router.get("/:id", validateObjectId(), getVideoById);
router.put("/:id", [...validateObjectId(), ...updateVideoValidation], updateVideo);
router.delete("/:id", validateObjectId(), deleteVideo);

export default router;
