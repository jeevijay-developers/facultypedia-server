import Student from "../models/student.js";
import { validationResult } from "express-validator";
import bcrypt from "bcrypt";

// Create a new student
export const createStudent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      name,
      username,
      password,
      mobileNumber,
      email,
      address,
      image,
      specialization,
      class: studentClass,
      deviceToken,
      preferences,
    } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { username }, { mobileNumber }],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message:
          "Student with this email, username, or mobile number already exists",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new student
    const newStudent = new Student({
      name,
      username,
      password: hashedPassword,
      mobileNumber,
      email,
      address,
      image,
      specialization,
      class: studentClass,
      deviceToken,
      preferences,
    });

    const savedStudent = await newStudent.save();

    // Remove password from response
    const studentResponse = savedStudent.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: studentResponse,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all students with filtering and pagination
export const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      class: className,
      isActive = true,
      search,
      sortBy = "joinedAt",
      sortOrder = "desc",
    } = req.query;

    console.log("getAllStudents called with query:", req.query);

    // Build filter object
    const filter = { isActive: isActive === "true" };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (className) {
      filter.class = className;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get students with population
    const students = await Student.find(filter)
      .populate({
        path: "courses.courseId",
        select: "title description",
        strictPopulate: false,
      })
      .populate({
        path: "followingEducators.educatorId",
        select: "name email subjects",
        strictPopulate: false,
      })
      .select("-password") // Exclude password field
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    console.log(
      "Found students:",
      students.length,
      "Total students:",
      totalStudents
    );

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: {
        students: students || [],
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

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate("courses.courseId", "title description image duration")
      .populate("testSeries.testSeriesId", "title description totalTests")
      .populate("webinars.webinarId", "title scheduledDate duration")
      .populate(
        "followingEducators.educatorId",
        "name email subjects specialization"
      )
      .populate("tests.testId", "title duration overallMarks")
      .select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student retrieved successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get student by username
export const getStudentByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const student = await Student.findOne({ username, isActive: true })
      .populate("courses.courseId", "title description")
      .populate("followingEducators.educatorId", "name email subjects")
      .select("-password");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student retrieved successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.joinedAt;
    delete updateData.tests;
    delete updateData.results;

    // If email, username, or mobile is being updated, check for duplicates
    if (updateData.email || updateData.username || updateData.mobileNumber) {
      const duplicateFilter = { _id: { $ne: id } };
      const orConditions = [];

      if (updateData.email) orConditions.push({ email: updateData.email });
      if (updateData.username)
        orConditions.push({ username: updateData.username });
      if (updateData.mobileNumber)
        orConditions.push({ mobileNumber: updateData.mobileNumber });

      duplicateFilter.$or = orConditions;

      const existingStudent = await Student.findOne(duplicateFilter);
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Email, username, or mobile number already exists",
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("courses.courseId", "title description")
      .populate("followingEducators.educatorId", "name email")
      .select("-password");

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete student (soft delete)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

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

// Enroll student in course
export const enrollInCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.enrollInCourse(courseId);

    res.status(200).json({
      success: true,
      message: "Student enrolled in course successfully",
      data: {
        totalCourses: student.courses.length,
      },
    });
  } catch (error) {
    console.error("Error enrolling student in course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Follow educator
export const followEducator = async (req, res) => {
  try {
    const { id } = req.params;
    const { educatorId } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.followEducator(educatorId);

    res.status(200).json({
      success: true,
      message: "Educator followed successfully",
      data: {
        totalFollowing: student.followingEducators.length,
      },
    });
  } catch (error) {
    console.error("Error following educator:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Unfollow educator
export const unfollowEducator = async (req, res) => {
  try {
    const { id } = req.params;
    const { educatorId } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.unfollowEducator(educatorId);

    res.status(200).json({
      success: true,
      message: "Educator unfollowed successfully",
      data: {
        totalFollowing: student.followingEducators.length,
      },
    });
  } catch (error) {
    console.error("Error unfollowing educator:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Register for webinar
export const registerForWebinar = async (req, res) => {
  try {
    const { id } = req.params;
    const { webinarId } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await student.registerForWebinar(webinarId);

    res.status(200).json({
      success: true,
      message: "Registered for webinar successfully",
      data: {
        totalWebinars: student.webinars.length,
      },
    });
  } catch (error) {
    console.error("Error registering for webinar:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get student statistics
export const getStudentStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const statistics = student.getStudentStats();

    res.status(200).json({
      success: true,
      message: "Student statistics retrieved successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error fetching student statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get students by specialization
export const getStudentsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.findBySpecialization(specialization)
      .select("-password")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments({
      specialization,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Students by specialization retrieved successfully",
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStudents / parseInt(limit)),
          totalStudents,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching students by specialization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get students by class
export const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const students = await Student.findByClass(className)
      .select("-password")
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalStudents = await Student.countDocuments({
      class: className,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Students by class retrieved successfully",
      data: {
        students,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStudents / parseInt(limit)),
          totalStudents,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching students by class:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update student password
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      student.password
    );
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    student.password = hashedNewPassword;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all students enrolled in educator's courses
export const getEnrolledStudentsByEducator = async (req, res) => {
  try {
    const { educatorId } = req.params;

    // Import Course model
    const Course = (await import("../models/course.js")).default;

    // Get all courses by this educator
    const courses = await Course.find({
      educatorID: educatorId,
      isActive: true,
    }).select("_id title courseType enrolledStudents fees discount");

    if (!courses || courses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No courses found for this educator",
        data: [],
        totalStudents: 0,
      });
    }

    // Collect all enrolled students with course info
    const enrollmentData = [];
    const uniqueStudentIds = new Set();

    for (const course of courses) {
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        for (const studentId of course.enrolledStudents) {
          enrollmentData.push({
            studentId: studentId.toString(),
            courseId: course._id,
            courseTitle: course.title,
            courseType: course.courseType,
            courseFees: course.fees,
            courseDiscount: course.discount || 0,
          });
          uniqueStudentIds.add(studentId.toString());
        }
      }
    }

    if (enrollmentData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No enrolled students found",
        data: [],
        totalStudents: 0,
      });
    }

    // Fetch all unique students
    const studentIds = Array.from(uniqueStudentIds);
    const students = await Student.find({
      _id: { $in: studentIds },
      isActive: true,
    }).select("-password");

    // Create a map of students by ID for quick lookup
    const studentMap = new Map();
    students.forEach((student) => {
      studentMap.set(student._id.toString(), student);
    });

    // Combine enrollment data with student details
    const enrolledStudents = enrollmentData
      .map((enrollment) => {
        const student = studentMap.get(enrollment.studentId);
        if (!student) return null;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          mobileNumber: student.mobileNumber,
          username: student.username,
          specialization: student.specialization,
          class: student.class,
          address: student.address,
          image: student.image,
          joinedAt: student.joinedAt,
          isEmailVerified: student.isEmailVerified,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          courseType: enrollment.courseType,
          courseFees: enrollment.courseFees,
          courseDiscount: enrollment.courseDiscount,
          amountPaid:
            enrollment.courseFees -
            (enrollment.courseFees * enrollment.courseDiscount) / 100,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Enrolled students fetched successfully",
      data: enrolledStudents,
      totalStudents: uniqueStudentIds.size,
      totalEnrollments: enrolledStudents.length,
    });
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default {
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
};
