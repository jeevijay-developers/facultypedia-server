import { validationResult } from "express-validator";
import mongoose from "mongoose";
import Educator from "../models/educator.js";
import Student from "../models/student.js";
import Course from "../models/course.js";
import Webinar from "../models/webinar.js";
import TestSeries from "../models/testSeries.js";
import Test from "../models/test.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import LiveClass from "../models/liveClass.js";

// ==================== Shared helpers (admin CRUD) ====================

// Returns false (and sends a 400) if express-validator found problems.
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return false;
  }
  return true;
};

// Normalizes a status payload to a boolean isActive. Accepts either
// { isActive: boolean } or { status: "active" | "inactive" }.
const resolveIsActive = (body) => {
  if (typeof body.isActive === "boolean") return body.isActive;
  if (body.status === "active") return true;
  if (body.status === "inactive") return false;
  return undefined;
};

// Builds an update object from only the whitelisted keys present in the body.
const pickFields = (body, whitelist) =>
  whitelist.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

// Editable field whitelists per entity (excludes refs, slug, enrolment
// arrays, isActive/status, and timestamps — those are managed elsewhere).
const EDUCATOR_UPDATE_FIELDS = [
  "firstName",
  "lastName",
  "fullName",
  "username",
  "email",
  "description",
  "bio",
  "specialization",
  "class",
  "subject",
  "experience",
];
const STUDENT_UPDATE_FIELDS = [
  "name",
  "email",
  "class",
  "specialization",
  "mobileNumber",
];
const COURSE_UPDATE_FIELDS = [
  "title",
  "description",
  "courseType",
  "specialization",
  "class",
  "subject",
  "fees",
  "discount",
  "image",
  "courseThumbnail",
  "startDate",
  "endDate",
  "courseDuration",
  "classesPerWeek",
  "testFrequency",
  "classDuration",
  "classTiming",
  "validDate",
  "language",
  "certificateAvailable",
  "maxStudents",
  "courseObjectives",
  "prerequisites",
];
const TEST_UPDATE_FIELDS = [
  "title",
  "description",
  "subjects",
  "class",
  "specialization",
  "duration",
  "overallMarks",
  "markingType",
  "instructions",
  "passingMarks",
  "negativeMarking",
  "negativeMarkingRatio",
  "shuffleQuestions",
  "showResult",
  "allowReview",
];
const TEST_SERIES_UPDATE_FIELDS = [
  "title",
  "description",
  "price",
  "validity",
  "numberOfTests",
  "image",
  "subject",
  "specialization",
];
const WEBINAR_UPDATE_FIELDS = [
  "title",
  "description",
  "webinarType",
  "timing",
  "subject",
  "fees",
  "duration",
  "specialization",
  "seatLimit",
  "class",
  "image",
  "webinarLink",
];
const LIVE_CLASS_UPDATE_FIELDS = [
  "liveClassTitle",
  "subject",
  "liveClassSpecification",
  "classTiming",
  "classDuration",
  "class",
  "description",
  "maxStudents",
  "liveClassLink",
];

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
      .select(
        "fullName username email specialization rating status followers courses"
      )
      .populate({
        path: "courses",
        select: "enrolledStudents",
        options: { strictPopulate: false },
      })
      .populate({
        path: "followers",
        select: "_id",
        options: { strictPopulate: false },
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const educatorIds = Array.isArray(educators)
      ? educators
          .map((educator) => educator?._id)
          .filter((id) => Boolean(id))
      : [];

    const courseCounts = educatorIds.length
      ? await Course.aggregate([
          { $match: { educatorID: { $in: educatorIds } } },
          { $group: { _id: "$educatorID", totalCourses: { $sum: 1 } } },
        ])
      : [];

    const courseCountMap = new Map(
      courseCounts.map((entry) => [String(entry._id), entry.totalCourses || 0])
    );

    const totalEducators = await Educator.countDocuments(filter);
    const totalPages = Math.ceil(totalEducators / parseInt(limit));

    const normalizedEducators = Array.isArray(educators)
      ? educators
          .map((educator) => {
            const id = educator?._id?.toString();
            if (!id) {
              return null;
            }

            const specializationValues = Array.isArray(educator?.specialization)
              ? educator.specialization.filter(Boolean)
              : [];

            const courseList = Array.isArray(educator?.courses)
              ? educator.courses
              : [];

            const totalCourses = courseCountMap.get(id) ?? courseList.length;

            const enrolledStudentIds = new Set();
            courseList.forEach((course) => {
              if (course && Array.isArray(course.enrolledStudents)) {
                course.enrolledStudents.forEach((studentId) => {
                  if (studentId) {
                    enrolledStudentIds.add(String(studentId));
                  }
                });
              }
            });

            const followersCount = Array.isArray(educator?.followers)
              ? educator.followers.length
              : 0;

            const totalStudents = enrolledStudentIds.size || followersCount;

            const ratingValue = (() => {
              const rawRating = educator?.rating;
              if (typeof rawRating === "number") {
                return rawRating;
              }
              if (
                rawRating &&
                typeof rawRating === "object" &&
                typeof rawRating.average === "number"
              ) {
                return rawRating.average;
              }
              return 0;
            })();

            const normalizedRating = Number.isFinite(ratingValue)
              ? Math.round(ratingValue * 100) / 100
              : 0;

            return {
              id,
              fullName: educator?.fullName ?? "",
              username: educator?.username ?? "",
              email: educator?.email ?? "",
              specialization: specializationValues,
              rating: normalizedRating,
              status: educator?.status ?? "inactive",
              totalCourses,
              totalStudents,
              followersCount,
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Educators retrieved successfully",
      data: {
        educators: normalizedEducators,
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

// Update educator status — cascades to all associated content
// On deactivate: marks only currently-active content with `deactivatedByAdmin: true`
// On reactivate: restores only content that was flagged (skips content already inactive before the ban)
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

    // Use Model.collection (raw MongoDB driver) to bypass Mongoose strict mode,
    // which silently strips non-schema fields like `deactivatedByAdmin` from $set.
    const oid = new mongoose.Types.ObjectId(id);

    if (status === "inactive") {
      // Deactivating: only touch currently-active content and stamp it
      // with deactivatedByAdmin so we can restore exactly those on re-activation.
      // Note ref-field casing differs: TestSeries uses educatorId, the rest
      // use educatorID. Course.status (active/deleted) is left untouched — only
      // isActive gates visibility here.
      await Promise.all([
        Course.collection.updateMany(
          { educatorID: oid, isActive: true },
          { $set: { isActive: false, deactivatedByAdmin: true } }
        ),
        Webinar.collection.updateMany(
          { educatorID: oid, isActive: true },
          { $set: { isActive: false, deactivatedByAdmin: true } }
        ),
        TestSeries.collection.updateMany(
          { educatorId: oid, isActive: true },
          { $set: { isActive: false, deactivatedByAdmin: true } }
        ),
        Test.collection.updateMany(
          { educatorID: oid, isActive: true },
          { $set: { isActive: false, deactivatedByAdmin: true } }
        ),
        LiveClass.collection.updateMany(
          { educatorID: oid, isActive: true },
          { $set: { isActive: false, deactivatedByAdmin: true } }
        ),
      ]);
    } else {
      // Reactivating: restore only content stamped by us, then clear the stamp.
      await Promise.all([
        Course.collection.updateMany(
          { educatorID: oid, deactivatedByAdmin: true },
          { $set: { isActive: true }, $unset: { deactivatedByAdmin: "" } }
        ),
        Webinar.collection.updateMany(
          { educatorID: oid, deactivatedByAdmin: true },
          { $set: { isActive: true }, $unset: { deactivatedByAdmin: "" } }
        ),
        TestSeries.collection.updateMany(
          { educatorId: oid, deactivatedByAdmin: true },
          { $set: { isActive: true }, $unset: { deactivatedByAdmin: "" } }
        ),
        Test.collection.updateMany(
          { educatorID: oid, deactivatedByAdmin: true },
          { $set: { isActive: true }, $unset: { deactivatedByAdmin: "" } }
        ),
        LiveClass.collection.updateMany(
          { educatorID: oid, deactivatedByAdmin: true },
          { $set: { isActive: true }, $unset: { deactivatedByAdmin: "" } }
        ),
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Educator ${status === "inactive" ? "deactivated" : "activated"} — associated content updated`,
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

    // Delete associated content (note ref-field casing: TestSeries uses
    // educatorId, the rest use educatorID).
    await Course.deleteMany({ educatorID: id });
    await Webinar.deleteMany({ educatorID: id });
    await TestSeries.deleteMany({ educatorId: id });
    await Test.deleteMany({ educatorID: id });
    await LiveClass.deleteMany({ educatorID: id });
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
      .limit(parseInt(limit))
      .lean();

    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    const normalizedStudents = Array.isArray(students)
      ? students
          .map((student) => {
            const id = student?._id?.toString();
            if (!id) {
              return null;
            }

            const specializationList = Array.isArray(student?.specialization)
              ? student.specialization.filter(Boolean)
              : student?.specialization
              ? [student.specialization]
              : student?.examPreference
              ? [student.examPreference]
              : [];

            const totalCourses = Array.isArray(student?.courses)
              ? student.courses.length
              : Number(student?.totalCourses ?? 0);

            const isActive = student?.isActive !== false;

            return {
              id,
              name: student?.name || student?.fullName || "Unknown",
              email: student?.email || "—",
              class: student?.class || student?.grade || "—",
              specialization: specializationList,
              enrolledCourses: totalCourses,
              status: isActive ? "active" : "inactive",
              joinedAt: student?.createdAt || null,
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: {
        students: normalizedStudents,
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
      .limit(parseInt(limit))
      .lean();

    const totalCourses = await Course.countDocuments(filter);
    const totalPages = Math.ceil(totalCourses / parseInt(limit));

    const normalizedCourses = Array.isArray(courses)
      ? courses
          .map((course) => {
            const id = course?._id?.toString();
            if (!id) {
              return null;
            }

            const educator = course?.educatorID;
            const educatorName =
              (educator && typeof educator === "object" && !Buffer.isBuffer(educator) && (educator.fullName || educator.username || educator.email))
                ? (educator.fullName || educator.username || educator.email)
                : "Deleted Educator";

            const subjectList = Array.isArray(course?.subject)
              ? course.subject.filter(Boolean)
              : course?.subject
              ? [course.subject]
              : [];

            const enrolledCount = Array.isArray(course?.enrolledStudents)
              ? course.enrolledStudents.length
              : Number(course?.enrolledCount ?? 0);

            const fees = Number.isFinite(Number(course?.fees))
              ? Number(course.fees)
              : 0;
            const status = course?.isActive === false ? "inactive" : "active";

            return {
              id,
              title: course?.title || "Untitled course",
              educatorName,
              subject: subjectList,
              enrolled: enrolledCount,
              fees,
              status,
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses: normalizedCourses,
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

// ==================== Test Management ====================

// Get all tests across all educators
export const getAllTests = async (req, res) => {
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

    const tests = await Test.find(filter)
      .populate("educatorID", "fullName username email")
      .populate("questions", "_id")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalTests = await Test.countDocuments(filter);
    const totalPages = Math.ceil(totalTests / parseInt(limit));

    const normalizedTests = Array.isArray(tests)
      ? tests
          .map((test) => {
            const id = test?._id?.toString();
            if (!id) {
              return null;
            }

            const subjectList = Array.isArray(test?.subjects)
              ? test.subjects.filter(Boolean)
              : test?.subjects
              ? [test.subjects]
              : [];

            const durationMinutes = Number.isFinite(Number(test?.duration))
              ? Number(test.duration)
              : 0;

            const marks = Number.isFinite(Number(test?.overallMarks))
              ? Number(test.overallMarks)
              : 0;

            const questionsCount = Array.isArray(test?.questions)
              ? test.questions.length
              : Number(test?.questionCount ?? 0);

            const enrolledCount = Array.isArray(test?.enrolledStudents)
              ? test.enrolledStudents.length
              : Array.isArray(test?.attempts)
              ? test.attempts.length
              : Number(test?.enrolled ?? 0);

            const educator = test?.educatorID;
            const educatorName =
              (educator && typeof educator === "object" && !Buffer.isBuffer(educator) && (educator.fullName || educator.username || educator.email))
                ? (educator.fullName || educator.username || educator.email)
                : "Deleted Educator";

            return {
              id,
              title: test?.title || "Untitled test",
              educatorName,
              subject: subjectList,
              duration: durationMinutes,
              marks,
              questions: questionsCount,
              enrolled: enrolledCount,
              status: test?.isActive === false ? "inactive" : "active",
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Tests retrieved successfully",
      data: {
        tests: normalizedTests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTests,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Test Series Management ====================

// Get all test series across all educators
export const getAllTestSeries = async (req, res) => {
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

    const testSeriesList = await TestSeries.find(filter)
      .populate("educatorId", "fullName username email")
      .populate("tests", "_id")
      .populate("enrolledStudents", "_id")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalTestSeries = await TestSeries.countDocuments(filter);
    const totalPages = Math.ceil(totalTestSeries / parseInt(limit));

    const normalizedTestSeries = Array.isArray(testSeriesList)
      ? testSeriesList
          .map((series) => {
            const id = series?._id?.toString();
            if (!id) {
              return null;
            }

            const educator = series?.educatorId;
            const educatorName =
              (educator && typeof educator === "object" && !Buffer.isBuffer(educator) && (educator.fullName || educator.username || educator.email))
                ? (educator.fullName || educator.username || educator.email)
                : "Deleted Educator";

            const testsCount = Array.isArray(series?.tests)
              ? series.tests.length
              : Number(series?.numberOfTests ?? series?.testCount ?? 0);

            const enrolledCount = Array.isArray(series?.enrolledStudents)
              ? series.enrolledStudents.length
              : Number(series?.enrolledCount ?? 0);

            const price = Number.isFinite(Number(series?.price))
              ? Number(series.price)
              : 0;

            return {
              id,
              title: series?.title || "Untitled test series",
              educatorName,
              tests: testsCount,
              price,
              validity: series?.validity || null,
              enrolled: enrolledCount,
              status: series?.isActive === false ? "inactive" : "active",
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Test series retrieved successfully",
      data: {
        testSeries: normalizedTestSeries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTestSeries,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
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
      .limit(parseInt(limit))
      .lean();

    const totalWebinars = await Webinar.countDocuments(filter);
    const totalPages = Math.ceil(totalWebinars / parseInt(limit));

    const normalizedWebinars = Array.isArray(webinars)
      ? webinars
          .map((webinar) => {
            const id = webinar?._id?.toString();
            if (!id) {
              return null;
            }

            const educator = webinar?.educatorID;
            const educatorName =
              (educator && typeof educator === "object" && !Buffer.isBuffer(educator) && (educator.fullName || educator.username || educator.email))
                ? (educator.fullName || educator.username || educator.email)
                : "Deleted Educator";

            const subjectList = Array.isArray(webinar?.subject)
              ? webinar.subject.filter(Boolean)
              : webinar?.subject
              ? [webinar.subject]
              : [];

            const enrolledCount = Array.isArray(webinar?.studentEnrolled)
              ? webinar.studentEnrolled.length
              : Number(webinar?.enrolledCount ?? 0);

            const capacity = Number.isFinite(Number(webinar?.seatLimit))
              ? Number(webinar.seatLimit)
              : 0;
            const fees = Number.isFinite(Number(webinar?.fees))
              ? Number(webinar.fees)
              : 0;

            return {
              id,
              title: webinar?.title || "Untitled webinar",
              educatorName,
              subject: subjectList,
              date: webinar?.timing || webinar?.createdAt || null,
              capacity,
              enrolled: enrolledCount,
              fees,
              status: webinar?.isActive === false ? "inactive" : "active",
            };
          })
          .filter(Boolean)
      : [];

    res.status(200).json({
      success: true,
      message: "Webinars retrieved successfully",
      data: {
        webinars: normalizedWebinars,
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
    const { range } = req.query;

    const RANGE_TO_DAYS = {
      "7d": 7,
      "30d": 30,
      "365d": 365,
      "1y": 365,
    };

    const lookbackDays = RANGE_TO_DAYS[String(range)] || 7;
    const rangeLabel =
      range && RANGE_TO_DAYS[String(range)] ? String(range) : "7d";

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

    // Recent activity for selected range
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - lookbackDays);

    const recentEducators = await Educator.countDocuments({
      createdAt: { $gte: rangeStart },
    });

    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: rangeStart },
    });

    const recentCourses = await Course.countDocuments({
      createdAt: { $gte: rangeStart },
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
          range: rangeLabel,
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

// ==================== Generic entity edit (PUT) ====================

// Educator edit — whitelisted fields only; never exposes password/tokens.
export const updateEducator = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, EDUCATOR_UPDATE_FIELDS);
    const doc = await Educator.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Educator not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Educator updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating educator:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Student edit — whitelisted fields only; never exposes password.
export const updateStudent = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, STUDENT_UPDATE_FIELDS);
    const doc = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Student updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, COURSE_UPDATE_FIELDS);
    const doc = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Course updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateWebinar = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, WEBINAR_UPDATE_FIELDS);
    const doc = await Webinar.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Webinar not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Webinar updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating webinar:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTest = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, TEST_UPDATE_FIELDS);
    const doc = await Test.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }
    res.status(200).json({ success: true, message: "Test updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTestSeries = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, TEST_SERIES_UPDATE_FIELDS);
    const doc = await TestSeries.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Test series not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Test series updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating test series:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateLiveClass = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const updates = pickFields(req.body, LIVE_CLASS_UPDATE_FIELDS);
    const doc = await LiveClass.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Live class not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Live class updated", data: doc });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Error updating live class:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Content status toggles ====================
// Each sets only isActive. Course.status (active/deleted soft-delete) and
// LiveClass.isCompleted are intentionally left untouched.

export const updateCourseStatus = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const isActive = resolveIsActive(req.body);
    if (isActive === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Provide isActive or status" });
    }
    const doc = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.status(200).json({
      success: true,
      message: `Course ${isActive ? "activated" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error updating course status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateWebinarStatus = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const isActive = resolveIsActive(req.body);
    if (isActive === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Provide isActive or status" });
    }
    const doc = await Webinar.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Webinar not found" });
    }
    res.status(200).json({
      success: true,
      message: `Webinar ${isActive ? "activated" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error updating webinar status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTestStatus = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const isActive = resolveIsActive(req.body);
    if (isActive === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Provide isActive or status" });
    }
    const doc = await Test.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }
    res.status(200).json({
      success: true,
      message: `Test ${isActive ? "activated" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error updating test status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateTestSeriesStatus = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const isActive = resolveIsActive(req.body);
    if (isActive === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Provide isActive or status" });
    }
    const doc = await TestSeries.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Test series not found" });
    }
    res.status(200).json({
      success: true,
      message: `Test series ${isActive ? "activated" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error updating test series status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateLiveClassStatus = async (req, res) => {
  try {
    if (!handleValidation(req, res)) return;
    const isActive = resolveIsActive(req.body);
    if (isActive === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Provide isActive or status" });
    }
    const doc = await LiveClass.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Live class not found" });
    }
    res.status(200).json({
      success: true,
      message: `Live class ${isActive ? "activated" : "deactivated"}`,
      data: doc,
    });
  } catch (error) {
    console.error("Error updating live class status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ==================== Content deletes ====================
// Mirror deleteCourse/deleteWebinar: guard, detach parent refs, delete.

export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }
    // Detach from any test series that references it.
    await TestSeries.updateMany({ tests: id }, { $pull: { tests: id } });
    await Test.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const series = await TestSeries.findById(id);
    if (!series) {
      return res
        .status(404)
        .json({ success: false, message: "Test series not found" });
    }
    // Detach from courses that reference it.
    await Course.updateMany({ testSeries: id }, { $pull: { testSeries: id } });
    // Detach child tests (they remain, but lose the series link).
    await Test.updateMany(
      { testSeriesID: id },
      { $set: { isTestSeriesSpecific: false }, $unset: { testSeriesID: "" } }
    );
    await TestSeries.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Test series deleted successfully" });
  } catch (error) {
    console.error("Error deleting test series:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res
        .status(404)
        .json({ success: false, message: "Live class not found" });
    }
    // Detach from courses that reference it.
    await Course.updateMany({ liveClass: id }, { $pull: { liveClass: id } });
    await LiveClass.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Live class deleted successfully" });
  } catch (error) {
    console.error("Error deleting live class:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default {
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
  getPlatformAnalytics,
};
