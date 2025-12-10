import { validationResult } from "express-validator";
import Educator from "../models/educator.js";
import Student from "../models/student.js";
import Course from "../models/course.js";
import Webinar from "../models/webinar.js";
import TestSeries from "../models/testSeries.js";
import Test from "../models/test.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";

// ==================== Educator Management ====================

// Get all educators with filtering and pagination
export const getAllEducators = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      specialization,
      subject,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (specialization) {
      filter.specialization = specialization;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const educators = await Educator.find(filter)
      .select("-password -refreshTokens")
      .populate("followers", "name email")
      .populate("courses", "title slug fees")
      .populate("webinars", "title scheduledDate")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalEducators = await Educator.countDocuments(filter);
    const totalPages = Math.ceil(totalEducators / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Educators retrieved successfully",
      data: {
        educators,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEducators,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching educators:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update educator status
export const updateEducatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const educator = await Educator.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");

    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Educator status updated to ${status}`,
      data: educator,
    });
  } catch (error) {
    console.error("Error updating educator status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete educator (hard delete with cascade)
export const deleteEducator = async (req, res) => {
  try {
    const { id } = req.params;

    const educator = await Educator.findById(id);
    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found",
      });
    }

    // Delete associated content
    await Course.deleteMany({ educatorID: id });
    await Webinar.deleteMany({ educatorID: id });
    await TestSeries.deleteMany({ educatorId: id });
    await Test.deleteMany({ educatorId: id });
    await Post.deleteMany({ educatorId: id });
    await Notification.deleteMany({ sender: id });

    // Remove from student's following lists
    await Student.updateMany(
      { "followingEducators.educatorId": id },
      { $pull: { followingEducators: { educatorId: id } } }
    );

    // Delete educator
    await Educator.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Educator and associated content deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting educator:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Student Management ====================

// Get all students with filtering and pagination
export const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      specialization,
      class: className,
      isActive,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (specialization) {
      filter.specialization = specialization;
    }

    if (className) {
      filter.class = className;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const students = await Student.find(filter)
      .select("-password")
      .populate("followingEducators.educatorId", "fullName username")
      .populate("courses.courseId", "title")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalStudents,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update student status
export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Student status updated`,
      data: student,
    });
  } catch (error) {
    console.error("Error updating student status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete student (hard delete)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Remove from educators' followers
    await Educator.updateMany({ followers: id }, { $pull: { followers: id } });

    // Delete notifications for this student
    await Notification.deleteMany({ recipient: id });

    // Delete student
    await Student.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Course Management ====================

// Get all courses across all educators
export const getAllCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const courses = await Course.find(filter)
      .populate("educatorID", "fullName username email")
      .populate("enrolledStudents", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCourses,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove course from educator's courses array
    await Educator.updateOne(
      { _id: course.educatorID },
      { $pull: { courses: id } }
    );

    // Remove course from students' enrolled courses
    await Student.updateMany(
      { "courses.courseId": id },
      { $pull: { courses: { courseId: id } } }
    );

    // Delete course
    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Webinar Management ====================

// Get all webinars across all educators
export const getAllWebinars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const webinars = await Webinar.find(filter)
      .populate("educatorID", "fullName username email")
      .populate("studentEnrolled", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalWebinars = await Webinar.countDocuments(filter);
    const totalPages = Math.ceil(totalWebinars / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Webinars retrieved successfully",
      data: {
        webinars,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalWebinars,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching webinars:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete webinar
export const deleteWebinar = async (req, res) => {
  try {
    const { id } = req.params;

    const webinar = await Webinar.findById(id);
    if (!webinar) {
      return res.status(404).json({
        success: false,
        message: "Webinar not found",
      });
    }

    // Remove webinar from educator's webinars array
    await Educator.updateOne(
      { _id: webinar.educatorID },
      { $pull: { webinars: id } }
    );

    // Remove webinar from students' enrolled webinars
    await Student.updateMany(
      { "webinars.webinarId": id },
      { $pull: { webinars: { webinarId: id } } }
    );

    // Delete webinar
    await Webinar.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Webinar deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting webinar:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Analytics ====================

// Get platform-wide analytics
export const getPlatformAnalytics = async (req, res) => {
  try {
    // Count totals
    const totalEducators = await Educator.countDocuments({ status: "active" });
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalCourses = await Course.countDocuments();
    const totalWebinars = await Webinar.countDocuments();
    const totalTests = await Test.countDocuments();
    const totalTestSeries = await TestSeries.countDocuments();

    // Educator statistics
    const educatorsBySpecialization = await Educator.aggregate([
      { $match: { status: "active" } },
      { $unwind: "$specialization" },
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
    ]);

    // Student statistics
    const studentsBySpecialization = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$specialization", count: { $sum: 1 } } },
    ]);

    const studentsByClass = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$class", count: { $sum: 1 } } },
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEducators = await Educator.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const recentCourses = await Course.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Top educators by followers
    const topEducators = await Educator.find({ status: "active" })
      .select("fullName username followers rating")
      .sort({ "followers.length": -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: "Platform analytics retrieved successfully",
      data: {
        totals: {
          educators: totalEducators,
          students: totalStudents,
          courses: totalCourses,
          webinars: totalWebinars,
          tests: totalTests,
          testSeries: totalTestSeries,
        },
        distributions: {
          educatorsBySpecialization,
          studentsBySpecialization,
          studentsByClass,
        },
        recentActivity: {
          educators: recentEducators,
          students: recentStudents,
          courses: recentCourses,
        },
        topEducators,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default {
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
};
