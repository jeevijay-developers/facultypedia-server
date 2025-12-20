import express from "express";
import {
  getAllEducators,
  updateEducatorStatus,
  deleteEducator,
  getAllStudents,
  updateStudentStatus,
  deleteStudent,
  getAllCourses,
  deleteCourse,
  getAllWebinars,
  deleteWebinar,
  getPlatformAnalytics,
  getAllTests,
  getAllTestSeries,
} from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// ==================== Educator Management Routes ====================

/**
 * @route   GET /api/admin/educators
 * @desc    Get all educators with filtering and pagination
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   specialization?: string,
 *   subject?: string,
 *   status?: "active" | "inactive",
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/educators", getAllEducators);

/**
 * @route   PUT /api/admin/educators/:id/status
 * @desc    Update educator status (activate/deactivate)
 * @access  Private (Admin only)
 * @param   id - Educator ObjectId
 * @body    { status: "active" | "inactive" }
 */
router.put(
  "/educators/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid educator ID"),
    body("status")
      .isIn(["active", "inactive"])
      .withMessage("Status must be active or inactive"),
  ],
  updateEducatorStatus
);

/**
 * @route   DELETE /api/admin/educators/:id
 * @desc    Hard delete educator and all associated content
 * @access  Private (Admin only)
 * @param   id - Educator ObjectId
 */
router.delete(
  "/educators/:id",
  [param("id").isMongoId().withMessage("Invalid educator ID")],
  deleteEducator
);

// ==================== Student Management Routes ====================

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with filtering and pagination
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   specialization?: "IIT-JEE" | "NEET" | "CBSE",
 *   class?: string,
 *   isActive?: "true" | "false",
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/students", getAllStudents);

/**
 * @route   PUT /api/admin/students/:id/status
 * @desc    Update student status (activate/deactivate)
 * @access  Private (Admin only)
 * @param   id - Student ObjectId
 * @body    { isActive: boolean }
 */
router.put(
  "/students/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid student ID"),
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
  ],
  updateStudentStatus
);

/**
 * @route   DELETE /api/admin/students/:id
 * @desc    Hard delete student
 * @access  Private (Admin only)
 * @param   id - Student ObjectId
 */
router.delete(
  "/students/:id",
  [param("id").isMongoId().withMessage("Invalid student ID")],
  deleteStudent
);

// ==================== Course Management Routes ====================

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses across all educators
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/courses", getAllCourses);

/**
 * @route   DELETE /api/admin/courses/:id
 * @desc    Delete course
 * @access  Private (Admin only)
 * @param   id - Course ObjectId
 */
router.delete(
  "/courses/:id",
  [param("id").isMongoId().withMessage("Invalid course ID")],
  deleteCourse
);

// ==================== Webinar Management Routes ====================

/**
 * @route   GET /api/admin/webinars
 * @desc    Get all webinars across all educators
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/webinars", getAllWebinars);

/**
 * @route   DELETE /api/admin/webinars/:id
 * @desc    Delete webinar
 * @access  Private (Admin only)
 * @param   id - Webinar ObjectId
 */
router.delete(
  "/webinars/:id",
  [param("id").isMongoId().withMessage("Invalid webinar ID")],
  deleteWebinar
);

// ==================== Analytics Routes ====================

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform-wide analytics and statistics
 * @access  Private (Admin only)
 */
router.get("/analytics", getPlatformAnalytics);

// ==================== Test Management Routes ====================

/**
 * @route   GET /api/admin/tests
 * @desc    Get all tests across all educators
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/tests", getAllTests);

// ==================== Test Series Management Routes ====================

/**
 * @route   GET /api/admin/test-series
 * @desc    Get all test series across all educators
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   search?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/test-series", getAllTestSeries);

export default router;
