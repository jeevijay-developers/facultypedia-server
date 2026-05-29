import express from "express";
import {
  getAllEducators,
  updateEducator,
  updateEducatorStatus,
  deleteEducator,
  getAllStudents,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
  getAllCourses,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  getAllWebinars,
  updateWebinar,
  updateWebinarStatus,
  deleteWebinar,
  getPlatformAnalytics,
  getAllTests,
  updateTest,
  updateTestStatus,
  deleteTest,
  getAllTestSeries,
  updateTestSeries,
  updateTestSeriesStatus,
  deleteTestSeries,
  updateLiveClass,
  updateLiveClassStatus,
  deleteLiveClass,
} from "../controllers/admin.controller.js";
import { getAllLiveClasses } from "../controllers/liveClass.controller.js";
import {
  getRevenueSummary,
  getRevenueByMonth,
  getRevenueByType,
  getRevenueTransactions,
} from "../controllers/revenue.controller.js";
import { getPaymentHistoryAdmin } from "../controllers/payment.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { body, param } from "express-validator";

import {
  calculateMonthlyPayouts,
  processPayout,
  getAllPayouts,
  getMonthlySalesSummary,
  processBulkPayouts,
} from "../controllers/payout.controller.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Shared validator for status-toggle routes. Accepts either
// { isActive: boolean } or { status: "active" | "inactive" }.
const statusBody = [
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("status must be active or inactive"),
  body()
    .custom((value) => value.isActive !== undefined || value.status !== undefined)
    .withMessage("Provide isActive or status"),
];

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
 * @route   PUT /api/admin/educators/:id
 * @desc    Edit educator (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/educators/:id",
  [param("id").isMongoId().withMessage("Invalid educator ID")],
  updateEducator
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
 * @route   PUT /api/admin/students/:id
 * @desc    Edit student (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/students/:id",
  [param("id").isMongoId().withMessage("Invalid student ID")],
  updateStudent
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
 * @route   PUT /api/admin/courses/:id/status
 * @desc    Activate/deactivate course
 * @access  Private (Admin only)
 * @body    { isActive: boolean } | { status: "active" | "inactive" }
 */
router.put(
  "/courses/:id/status",
  [param("id").isMongoId().withMessage("Invalid course ID"), ...statusBody],
  updateCourseStatus
);

/**
 * @route   PUT /api/admin/courses/:id
 * @desc    Edit course (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/courses/:id",
  [param("id").isMongoId().withMessage("Invalid course ID")],
  updateCourse
);

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
 * @route   PUT /api/admin/webinars/:id/status
 * @desc    Activate/deactivate webinar
 * @access  Private (Admin only)
 * @body    { isActive: boolean } | { status: "active" | "inactive" }
 */
router.put(
  "/webinars/:id/status",
  [param("id").isMongoId().withMessage("Invalid webinar ID"), ...statusBody],
  updateWebinarStatus
);

/**
 * @route   PUT /api/admin/webinars/:id
 * @desc    Edit webinar (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/webinars/:id",
  [param("id").isMongoId().withMessage("Invalid webinar ID")],
  updateWebinar
);

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

// ==================== Revenue & Payments ====================
router.get("/revenue/summary", getRevenueSummary);
router.get("/revenue/by-month", getRevenueByMonth);
router.get("/revenue/by-type", getRevenueByType);
router.get("/revenue/transactions", getRevenueTransactions);
router.get("/payments", getPaymentHistoryAdmin);

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

/**
 * @route   PUT /api/admin/tests/:id/status
 * @desc    Activate/deactivate test
 * @access  Private (Admin only)
 * @body    { isActive: boolean } | { status: "active" | "inactive" }
 */
router.put(
  "/tests/:id/status",
  [param("id").isMongoId().withMessage("Invalid test ID"), ...statusBody],
  updateTestStatus
);

/**
 * @route   PUT /api/admin/tests/:id
 * @desc    Edit test (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/tests/:id",
  [param("id").isMongoId().withMessage("Invalid test ID")],
  updateTest
);

/**
 * @route   DELETE /api/admin/tests/:id
 * @desc    Delete test
 * @access  Private (Admin only)
 */
router.delete(
  "/tests/:id",
  [param("id").isMongoId().withMessage("Invalid test ID")],
  deleteTest
);

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

/**
 * @route   PUT /api/admin/test-series/:id/status
 * @desc    Activate/deactivate test series
 * @access  Private (Admin only)
 * @body    { isActive: boolean } | { status: "active" | "inactive" }
 */
router.put(
  "/test-series/:id/status",
  [param("id").isMongoId().withMessage("Invalid test series ID"), ...statusBody],
  updateTestSeriesStatus
);

/**
 * @route   PUT /api/admin/test-series/:id
 * @desc    Edit test series (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/test-series/:id",
  [param("id").isMongoId().withMessage("Invalid test series ID")],
  updateTestSeries
);

/**
 * @route   DELETE /api/admin/test-series/:id
 * @desc    Delete test series
 * @access  Private (Admin only)
 */
router.delete(
  "/test-series/:id",
  [param("id").isMongoId().withMessage("Invalid test series ID")],
  deleteTestSeries
);

// ==================== Live Classes Management Routes ====================

/**
 * @route   GET /api/admin/live-classes
 * @desc    Get all live classes across all educators
 * @access  Private (Admin only)
 * @query   {
 *   page?: number (default: 1),
 *   limit?: number (default: 20),
 *   search?: string,
 *   subject?: string,
 *   sortBy?: string (default: "createdAt"),
 *   sortOrder?: "asc" | "desc" (default: "desc")
 * }
 */
router.get("/live-classes", getAllLiveClasses);

/**
 * @route   PUT /api/admin/live-classes/:id/status
 * @desc    Activate/deactivate live class
 * @access  Private (Admin only)
 * @body    { isActive: boolean } | { status: "active" | "inactive" }
 */
router.put(
  "/live-classes/:id/status",
  [param("id").isMongoId().withMessage("Invalid live class ID"), ...statusBody],
  updateLiveClassStatus
);

/**
 * @route   PUT /api/admin/live-classes/:id
 * @desc    Edit live class (whitelisted fields)
 * @access  Private (Admin only)
 */
router.put(
  "/live-classes/:id",
  [param("id").isMongoId().withMessage("Invalid live class ID")],
  updateLiveClass
);

/**
 * @route   DELETE /api/admin/live-classes/:id
 * @desc    Delete live class
 * @access  Private (Admin only)
 */
router.delete(
  "/live-classes/:id",
  [param("id").isMongoId().withMessage("Invalid live class ID")],
  deleteLiveClass
);

// ==================== Payout Management Routes ====================

/**
 * @route   POST /api/admin/payouts/calculate
 * @desc    Calculate monthly payouts
 * @access  Private (Admin only)
 * @body    { month: number, year: number }
 */
router.post("/payouts/calculate", calculateMonthlyPayouts);

/**
 * @route   POST /api/admin/payouts/pay
 * @desc    Process a payout
 * @access  Private (Admin only)
 * @body    { payoutId: string }
 */
router.post("/payouts/pay", processPayout);

/**
 * @route   GET /api/admin/payouts
 * @desc    Get all payouts
 * @access  Private (Admin only)
 */
router.get("/payouts", getAllPayouts);

/**
 * @route   GET /api/admin/payouts/monthly-sales
 * @desc    Get monthly sales summary per educator
 * @access  Private (Admin only)
 * @query   { page?, limit?, month?, year?, scheduledDate? }
 */
router.get("/payouts/monthly-sales", getMonthlySalesSummary);

/**
 * @route   POST /api/admin/payouts/bulk-pay
 * @desc    Process bulk payouts (multiple educators)
 * @access  Private (Admin only)
 * @body    { payoutIds?: string[], month?: number, year?: number }
 */
router.post("/payouts/bulk-pay", processBulkPayouts);

export default router;
