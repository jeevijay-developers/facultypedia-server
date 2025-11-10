import express from "express";
import {
  createTestSeries,
  getAllTestSeries,
  getTestSeriesById,
  getTestSeriesBySlug,
  updateTestSeries,
  deleteTestSeries,
  getTestSeriesByEducator,
  getTestSeriesBySpecialization,
  getTestSeriesBySubject,
  getTestSeriesByRating,
  searchTestSeriesByTitle,
  getTestSeriesByCourse,
  enrollStudent,
  removeStudent,
  addTest,
  removeTest,
  updateTestSeriesRating,
  getTestSeriesStatistics,
  getOverallStatistics,
} from "../controllers/testSeries.controller.js";

import {
  createTestSeriesValidation,
  updateTestSeriesValidation,
  enrollStudentInTestSeriesValidation,
  testSeriesTestOperationValidation,
  rateTestSeriesValidation,
  validateObjectId,
  validateSlug,
  validateEducatorIdParam,
  validateSpecializationParam,
  validateSubjectParam,
  validateRatingParam,
  validateCourseIdParam,
} from "../util/validation.js";

const router = express.Router();

// ==================== CRUD Routes ====================

// Create a new test series
router.post("/", createTestSeriesValidation, createTestSeries);

// Get all test series with filters
router.get("/", getAllTestSeries);

// Get test series by ID
router.get("/:id", validateObjectId("id"), getTestSeriesById);

// Get test series by slug
router.get("/slug/:slug", validateSlug, getTestSeriesBySlug);

// Update test series by ID
router.put("/:id", updateTestSeriesValidation, updateTestSeries);

// Delete test series by ID (soft delete)
router.delete("/:id", validateObjectId("id"), deleteTestSeries);

// ==================== Filter Routes ====================

// Search test series by title
router.get("/search/title", searchTestSeriesByTitle);

// Get test series by educator
router.get(
  "/educator/:educatorId",
  validateEducatorIdParam,
  getTestSeriesByEducator
);

// Get test series by specialization
router.get(
  "/specialization/:specialization",
  validateSpecializationParam,
  getTestSeriesBySpecialization
);

// Get test series by subject
router.get("/subject/:subject", validateSubjectParam, getTestSeriesBySubject);

// Get test series by rating
router.get("/rating/:minRating", validateRatingParam, getTestSeriesByRating);

// Get test series by course
router.get("/course/:courseId", validateCourseIdParam, getTestSeriesByCourse);

// ==================== Enrollment Routes ====================

// Enroll student in test series
router.post("/:id/enroll", enrollStudentInTestSeriesValidation, enrollStudent);

// Remove student from test series
router.delete(
  "/:id/enroll",
  enrollStudentInTestSeriesValidation,
  removeStudent
);

// ==================== Test Management Routes ====================

// Add test to test series
router.post("/:id/tests", testSeriesTestOperationValidation, addTest);

// Remove test from test series
router.delete("/:id/tests", testSeriesTestOperationValidation, removeTest);

// ==================== Rating Routes ====================

// Update test series rating
router.post("/:id/rating", rateTestSeriesValidation, updateTestSeriesRating);

// ==================== Statistics Routes ====================

// Get test series statistics
router.get("/:id/statistics", validateObjectId("id"), getTestSeriesStatistics);

// Get overall platform statistics
router.get("/statistics/overall", getOverallStatistics);

export default router;
