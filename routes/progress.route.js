import { Router } from 'express';
import {
  toggleVideoComplete,
  getCourseProgress,
} from '../controllers/progress.controller.js';

const router = Router();

/**
 * @route   POST /api/progress/video/complete
 * @desc    Toggle video completion status for a student
 * @access  Private (Student)
 * @body    { studentId, courseId, videoId, isCompleted? }
 */
router.post('/video/complete', toggleVideoComplete);

/**
 * @route   GET /api/progress/course/:courseId/student/:studentId
 * @desc    Get all video progress for a student in a course
 * @access  Private (Student)
 */
router.get('/course/:courseId/student/:studentId', getCourseProgress);

export default router;
