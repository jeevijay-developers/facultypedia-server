import express from "express";
const router = express.Router();

import {
  getAllEducators,
  getEducatorById,
  getEducatorByUsername,
  getEducatorBySlug,
  updateEducator,
  deleteEducator,
  getEducatorsBySpecialization,
  getEducatorsBySubject,
  getEducatorsByClass,
  getEducatorsByRating,
  searchEducators,
  addFollower,
  removeFollower,
  getEducatorFollowers,
  updateEducatorRating,
  updateEducatorRevenue,
  getTopRatedEducators,
  getEducatorStatistics,
} from "../controllers/educator.controller.js";
import { signupEducator as createEducatorProfile } from "../controllers/auth.controller.js";

import {
  validateObjectId,
  validateUsername,
  validateSlug,
  validateFullName,
  validateUsernameField,
  validateEmail,
  validateDescription,
  validateSpecialization,
  validateClass,
  validateMobileNumber,
  validateURL,
  validatePayPerHourFee,
  validateSubject,
  validateStatus,
  validateStudentId,
  validateRating,
  educatorSignupValidation,
  validateRevenue,
  validateSpecializationParam,
  validateSubjectParam,
  validateClassParam,
  validateRatingParam,
} from "../util/validation.js";

// Validation middleware for updating educator
const updateEducatorValidation = [
  ...validateObjectId(),
  validateFullName(true),
  validateUsernameField(true),
  validateEmail(true),
  validateDescription[0],
  validateSpecialization(true),
  validateClass(true),
  validateMobileNumber(true),
  validateURL("profilePicture"),
  validateURL("introVideo"),
  validatePayPerHourFee(true),
  validateSubject(true),
  validateStatus[0],
];

// Validation middleware for follower operations
const followerValidation = [...validateObjectId(), ...validateStudentId];

// Validation middleware for rating
const ratingValidation = [...validateObjectId(), ...validateRating];

// Validation middleware for revenue update
const revenueValidation = [...validateObjectId(), ...validateRevenue];

// Routes

// POST /api/educators - Create educator profile (signup)
router.post("/", educatorSignupValidation, createEducatorProfile);

// GET /api/educators - Get all educators with filtering and pagination
router.get("/", getAllEducators);

// GET /api/educators/search - Search educators by name or username
router.get("/search", searchEducators);

// GET /api/educators/top-rated - Get top rated educators
router.get("/top-rated", getTopRatedEducators);

// GET /api/educators/specialization/:specialization - Get educators by specialization
router.get(
  "/specialization/:specialization",
  validateSpecializationParam,
  getEducatorsBySpecialization
);

// GET /api/educators/subject/:subject - Get educators by subject
router.get("/subject/:subject", validateSubjectParam, getEducatorsBySubject);

// GET /api/educators/class/:className - Get educators by class
router.get("/class/:className", validateClassParam, getEducatorsByClass);

// GET /api/educators/rating/:minRating - Get educators by minimum rating
router.get("/rating/:minRating", validateRatingParam, getEducatorsByRating);

// GET /api/educators/username/:username - Get educator by username
router.get("/username/:username", validateUsername, getEducatorByUsername);

// GET /api/educators/slug/:slug - Get educator by slug
router.get("/slug/:slug", validateSlug, getEducatorBySlug);

// GET /api/educators/:id - Get educator by ID
router.get("/:id", validateObjectId(), getEducatorById);

// GET /api/educators/:id/followers - Get educator's followers
router.get("/:id/followers", validateObjectId(), getEducatorFollowers);

// GET /api/educators/:id/statistics - Get educator statistics
router.get("/:id/statistics", validateObjectId(), getEducatorStatistics);

// POST /api/educators/:id/followers - Add follower to educator
router.post("/:id/followers", followerValidation, addFollower);

// POST /api/educators/:id/rating - Update educator rating
router.post("/:id/rating", ratingValidation, updateEducatorRating);

// POST /api/educators/:id/revenue - Update educator revenue
router.post("/:id/revenue", revenueValidation, updateEducatorRevenue);

// PUT /api/educators/:id - Update educator
router.put("/:id", updateEducatorValidation, updateEducator);

// DELETE /api/educators/:id - Delete educator (soft delete)
router.delete("/:id", validateObjectId(), deleteEducator);

// DELETE /api/educators/:id/followers - Remove follower from educator
router.delete("/:id/followers", followerValidation, removeFollower);

export default router;
