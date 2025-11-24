import { Router } from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentByUsername,
  updateStudent,
  deleteStudent,
  enrollInCourse,
  followEducator,
  unfollowEducator,
  registerForWebinar,
  getStudentStatistics,
  getStudentsBySpecialization,
  getStudentsByClass,
  updatePassword,
  getEnrolledStudentsByEducator,
} from "../controllers/student.controller.js";

import {
  createStudentValidation,
  updateStudentValidation,
  studentQueryValidation,
  studentUsernameValidation,
  studentSpecializationValidation,
  studentClassValidation,
  studentPasswordValidation,
  studentEnrollmentValidation,
  studentFollowValidation,
  studentWebinarValidation,
  validateId,
} from "../util/validation.js";

const router = Router();

// ======================== Student CRUD Routes ========================

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Public
 * @body    {
 *   name: string (required),
 *   username: string (required, unique),
 *   password: string (required, min 6 chars),
 *   mobileNumber: string (required, unique, Indian format),
 *   email: string (required, unique),
 *   specialization: "IIT-JEE" | "NEET" | "CBSE" (required),
 *   class: "Class 6th" to "Class 12th" | "Dropper" (required),
 *   address?: object (optional),
 *   image?: string (optional),
 *   deviceToken?: string (optional),
 *   preferences?: object (optional)
 * }
 */
router.post("/", createStudentValidation, createStudent);

/**
 * @route   GET /api/students
 * @desc    Get all students with optional filtering and pagination
 * @access  Public
 * @query   {
 *   page?: number (optional, default: 1),
 *   limit?: number (optional, default: 10, max: 100),
 *   specialization?: "IIT-JEE" | "NEET" | "CBSE" (optional),
 *   class?: string (optional),
 *   isActive?: "true" | "false" (optional, default: true),
 *   search?: string (optional, searches in name, email, username),
 *   sortBy?: string (optional, default: "joinedAt"),
 *   sortOrder?: "asc" | "desc" (optional, default: "desc")
 * }
 */
router.get("/", studentQueryValidation, getAllStudents);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Public
 * @param   id - Student ObjectId
 */
router.get("/:id", validateId, getStudentById);

/**
 * @route   GET /api/students/username/:username
 * @desc    Get student by username
 * @access  Public
 * @param   username - Student username
 */
router.get(
  "/username/:username",
  studentUsernameValidation,
  getStudentByUsername
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student by ID
 * @access  Private (Student - only their own profile)
 * @param   id - Student ObjectId
 * @body    Partial student data (excludes password, role, joinedAt, tests, results)
 */
router.put("/:id", updateStudentValidation, updateStudent);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student by ID (soft delete)
 * @access  Private (Admin or Student themselves)
 * @param   id - Student ObjectId
 */
router.delete("/:id", validateId, deleteStudent);

// ======================= Student Course Management Routes =======================

/**
 * @route   POST /api/students/:id/enroll
 * @desc    Enroll student in a course
 * @access  Private (Student)
 * @param   id - Student ObjectId
 * @body    {
 *   courseId: ObjectId (required) - ID of the course to enroll in
 * }
 */
router.post("/:id/enroll", studentEnrollmentValidation, enrollInCourse);

// ======================= Student Educator Management Routes =======================

/**
 * @route   POST /api/students/:id/follow
 * @desc    Follow an educator
 * @access  Private (Student)
 * @param   id - Student ObjectId
 * @body    {
 *   educatorId: ObjectId (required) - ID of the educator to follow
 * }
 */
router.post("/:id/follow", studentFollowValidation, followEducator);

/**
 * @route   DELETE /api/students/:id/unfollow
 * @desc    Unfollow an educator
 * @access  Private (Student)
 * @param   id - Student ObjectId
 * @body    {
 *   educatorId: ObjectId (required) - ID of the educator to unfollow
 * }
 */
router.delete("/:id/unfollow", studentFollowValidation, unfollowEducator);

// ======================= Student Webinar Management Routes =======================

/**
 * @route   POST /api/students/:id/register-webinar
 * @desc    Register student for a webinar
 * @access  Private (Student)
 * @param   id - Student ObjectId
 * @body    {
 *   webinarId: ObjectId (required) - ID of the webinar to register for
 * }
 */
router.post(
  "/:id/register-webinar",
  studentWebinarValidation,
  registerForWebinar
);

// ======================= Student Statistics and Analytics Routes =======================

/**
 * @route   GET /api/students/:id/statistics
 * @desc    Get student statistics and progress
 * @access  Private (Student or Admin)
 * @param   id - Student ObjectId
 */
router.get("/:id/statistics", validateId, getStudentStatistics);

/**
 * @route   GET /api/students/educator/:educatorId/enrolled
 * @desc    Get all students enrolled in educator's courses
 * @access  Private (Educator)
 * @param   educatorId - Educator ObjectId
 */
router.get(
  "/educator/:educatorId/enrolled",
  validateId,
  getEnrolledStudentsByEducator
);

// ======================= Specialization and Class Specific Routes =======================

/**
 * @route   GET /api/students/specialization/:specialization
 * @desc    Get all students by specialization
 * @access  Public
 * @param   specialization - "IIT-JEE", "NEET", or "CBSE"
 * @query   {
 *   page?: number (optional, default: 1),
 *   limit?: number (optional, default: 10)
 * }
 */
router.get(
  "/specialization/:specialization",
  [studentSpecializationValidation, studentQueryValidation],
  getStudentsBySpecialization
);

/**
 * @route   GET /api/students/class/:className
 * @desc    Get all students by class
 * @access  Public
 * @param   className - Class name (e.g., "Class 12th", "Dropper")
 * @query   {
 *   page?: number (optional, default: 1),
 *   limit?: number (optional, default: 10)
 * }
 */
router.get(
  "/class/:className",
  [studentClassValidation, studentQueryValidation],
  getStudentsByClass
);

// ======================= Password Management Routes =======================

/**
 * @route   PUT /api/students/:id/password
 * @desc    Update student password
 * @access  Private (Student - only their own password)
 * @param   id - Student ObjectId
 * @body    {
 *   currentPassword: string (required),
 *   newPassword: string (required, min 6 chars)
 * }
 */
router.put("/:id/password", studentPasswordValidation, updatePassword);

export default router;
