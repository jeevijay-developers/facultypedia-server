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
  getStudentNotifications,
  getEducatorEnrolledStudents,
  updatePassword,
} from "../controllers/student.controller.js";
import { bulkCreateStudents } from "../controllers/auth.controller.js";
import { ensureDevEnvironment } from "../middleware/dev.middleware.js";

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
  validateEducatorIdParam,
  bulkCreateStudentsValidation,
} from "../util/validation.js";

const router = Router();

// Dev-only bulk create students
router.post(
  "/bulk",
  ensureDevEnvironment,
  bulkCreateStudentsValidation,
  bulkCreateStudents
);

router.post("/", createStudentValidation, createStudent);

router.get("/", studentQueryValidation, getAllStudents);

// ======================= Educator Enrolled Students Route =======================
// This route must be placed before /:id to avoid educatorId being interpreted as student ID
router.get(
  "/educator/:educatorId/enrolled",
  validateEducatorIdParam,
  getEducatorEnrolledStudents
);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Public
 * @param   id - Student ObjectId
 */
router.get("/:id", validateId, getStudentById);

router.get(
  "/username/:username",
  studentUsernameValidation,
  getStudentByUsername
);

router.put("/:id", updateStudentValidation, updateStudent);

router.delete("/:id", validateId, deleteStudent);

// ======================= Student Course Management Routes =======================

router.post("/:id/enroll", studentEnrollmentValidation, enrollInCourse);

// ======================= Student Educator Management Routes =======================

router.post("/:id/follow", studentFollowValidation, followEducator);

router.delete("/:id/unfollow", studentFollowValidation, unfollowEducator);

// ======================= Student Webinar Management Routes =======================

router.post(
  "/:id/register-webinar",
  studentWebinarValidation,
  registerForWebinar
);

// ======================= Student Statistics and Analytics Routes =======================

router.get("/:id/statistics", validateId, getStudentStatistics);

router.get("/:id/notifications", validateId, getStudentNotifications);

// ======================= Specialization and Class Specific Routes =======================

router.get(
  "/specialization/:specialization",
  [studentSpecializationValidation, studentQueryValidation],
  getStudentsBySpecialization
);

router.get(
  "/class/:className",
  [studentClassValidation, studentQueryValidation],
  getStudentsByClass
);

// ======================= Password Management Routes =======================

router.put("/:id/password", studentPasswordValidation, updatePassword);

export default router;
