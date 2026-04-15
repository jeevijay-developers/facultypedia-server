import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
const router = express.Router();

import {
  createWebinar,
  getAllWebinars,
  getWebinarById,
  getWebinarBySlug,
  updateWebinar,
  deleteWebinar,
  enrollStudent,
  unenrollStudent,
  getUpcomingWebinars,
  getWebinarsByEducator,
  bulkCreateWebinars,
  uploadWebinarIntroVideo,
  getWebinarIntroVideoStatus,
} from "../controllers/webinar.controller.js";
import { ensureDevEnvironment } from "../middleware/dev.middleware.js";

import {
  validateObjectId,
  validateSlug,
  validateWebinarTitle,
  validateWebinarDescription,
  validateWebinarType,
  validateWebinarTiming,
  validateSubject,
  validateWebinarFees,
  validateWebinarDuration,
  validateSpecialization,
  validateSeatLimit,
  validateClass,
  validateEducatorId,
  validateWebinarImage,
  validateWebinarLink,
  validateAssetsLink,
  validateStudentId,
  validateEducatorIdParam,
  bulkCreateWebinarsValidation,
} from "../util/validation.js";

const ensureUploadDir = () => {
  const uploadDir = path.join(process.cwd(), "tmp", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        cb(null, ensureUploadDir());
      } catch (error) {
        cb(error, "");
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file?.originalname || "");
      cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB cap for intro videos
  },
});

// Validation middleware for creating webinar
const createWebinarValidation = [
  validateWebinarTitle(),
  validateWebinarDescription(),
  validateWebinarTiming(),
  validateSubject(),
  validateWebinarFees(),
  validateWebinarDuration[0],
  validateSpecialization(),
  validateSeatLimit(),
  validateClass(),
  ...validateEducatorId,
  ...validateWebinarImage,
  ...validateWebinarLink,
  ...validateAssetsLink,
];

// Validation middleware for updating webinar
const updateWebinarValidation = [
  ...validateObjectId(),
  validateWebinarTitle(true),
  validateWebinarDescription(true),
  validateWebinarType(true),
  validateWebinarTiming(true),
  validateSubject(true),
  validateWebinarFees(true),
  validateSeatLimit(true),
];

// Validation middleware for enrollment
const enrollmentValidation = [...validateObjectId(), ...validateStudentId];

// Routes

// Dev-only bulk create webinars
router.post(
  "/bulk",
  ensureDevEnvironment,
  bulkCreateWebinarsValidation,
  bulkCreateWebinars
);

// GET /api/webinars - Get all webinars with filtering and pagination
router.get("/", getAllWebinars);

// GET /api/webinars/upcoming - Get upcoming webinars
router.get("/upcoming", getUpcomingWebinars);

// GET /api/webinars/educator/:educatorId - Get webinars by educator
router.get(
  "/educator/:educatorId",
  validateEducatorIdParam,
  getWebinarsByEducator
);

// GET /api/webinars/:id - Get webinar by ID
router.get("/:id", validateObjectId(), getWebinarById);

// GET /api/webinars/slug/:slug - Get webinar by slug
router.get("/slug/:slug", validateSlug, getWebinarBySlug);

// POST /api/webinars - Create new webinar
router.post("/", createWebinarValidation, createWebinar);

// PUT /api/webinars/:id - Update webinar
router.put("/:id", updateWebinarValidation, updateWebinar);

// DELETE /api/webinars/:id - Delete webinar (soft delete)
router.delete("/:id", validateObjectId(), deleteWebinar);

// Intro/Demo Video (Vimeo)
router.post(
  "/:id/intro-video/upload",
  validateObjectId(),
  videoUpload.single("video"),
  uploadWebinarIntroVideo
);

router.get(
  "/:id/intro-video/status",
  validateObjectId(),
  getWebinarIntroVideoStatus
);

// POST /api/webinars/:id/enroll - Enroll student in webinar
router.post("/:id/enroll", enrollmentValidation, enrollStudent);

// POST /api/webinars/:id/unenroll - Unenroll student from webinar
router.post("/:id/unenroll", enrollmentValidation, unenrollStudent);

export default router;
