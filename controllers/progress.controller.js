import VideoProgress from '../models/videoProgress.js';
import Student from '../models/student.js';
import Course from '../models/course.js';
import Video from '../models/video.js';

/**
 * Toggle video completion status for a student
 * POST /api/progress/video/complete
 */
export const toggleVideoComplete = async (req, res) => {
  try {
    const { studentId, courseId, videoId, isCompleted } = req.body;

    if (!studentId || !courseId || !videoId) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, and videoId are required',
      });
    }

    // Find existing progress or create new one
    let progress = await VideoProgress.findOne({
      studentId,
      courseId,
      videoId,
    });

    if (progress) {
      // Toggle or set the completion status
      progress.isCompleted = typeof isCompleted === 'boolean' ? isCompleted : !progress.isCompleted;
      progress.completedAt = progress.isCompleted ? new Date() : null;
      await progress.save();
    } else {
      // Create new progress entry
      progress = await VideoProgress.create({
        studentId,
        courseId,
        videoId,
        isCompleted: typeof isCompleted === 'boolean' ? isCompleted : true,
        completedAt: (typeof isCompleted === 'boolean' ? isCompleted : true) ? new Date() : null,
      });
    }

    // Update student's course progress percentage
    await updateCourseProgressPercentage(studentId, courseId);

    return res.status(200).json({
      success: true,
      message: progress.isCompleted ? 'Video marked as completed' : 'Video marked as incomplete',
      data: {
        videoId: progress.videoId,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
      },
    });
  } catch (error) {
    console.error('Error toggling video completion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update video progress',
      error: error.message,
    });
  }
};

/**
 * Get course progress for a student
 * GET /api/progress/course/:courseId/student/:studentId
 */
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and courseId are required',
      });
    }

    // Get all video progress entries for this student-course combination
    const progressEntries = await VideoProgress.find({
      studentId,
      courseId,
    });

    // Create a map of videoId -> completion status
    const completedVideos = {};
    let completedCount = 0;

    progressEntries.forEach((entry) => {
      completedVideos[entry.videoId] = {
        isCompleted: entry.isCompleted,
        completedAt: entry.completedAt,
      };
      if (entry.isCompleted) {
        completedCount++;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        courseId,
        studentId,
        completedVideos,
        completedCount,
        totalTracked: progressEntries.length,
      },
    });
  } catch (error) {
    console.error('Error getting course progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get course progress',
      error: error.message,
    });
  }
};

/**
 * Helper function to update the progressPercentage in Student's courses array
 */
const updateCourseProgressPercentage = async (studentId, courseId) => {
  try {
    // Get total videos for the course
    const course = await Course.findById(courseId);
    if (!course) return;

    // Count embedded videos
    const embeddedVideosCount = Array.isArray(course.videos) ? course.videos.length : 0;

    // Count assigned videos from Video model
    const assignedVideosCount = await Video.countDocuments({
      courseId: courseId,
      isCourseSpecific: true,
    });

    const totalVideos = embeddedVideosCount + assignedVideosCount;
    if (totalVideos === 0) return;

    // Get completed videos count
    const completedVideosCount = await VideoProgress.countDocuments({
      studentId,
      courseId,
      isCompleted: true,
    });

    // Calculate percentage
    const progressPercentage = Math.round((completedVideosCount / totalVideos) * 100);

    // Determine completion status
    let completionStatus = 'enrolled';
    if (progressPercentage > 0 && progressPercentage < 100) {
      completionStatus = 'in-progress';
    } else if (progressPercentage === 100) {
      completionStatus = 'completed';
    }

    // Update student's course progress
    await Student.updateOne(
      { _id: studentId, 'courses.courseId': courseId },
      {
        $set: {
          'courses.$.progressPercentage': progressPercentage,
          'courses.$.completionStatus': completionStatus,
        },
      }
    );
  } catch (error) {
    console.error('Error updating course progress percentage:', error);
  }
};
