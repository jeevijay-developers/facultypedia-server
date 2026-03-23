import Review from "../models/review.js";
import Student from "../models/student.js";
import Course from "../models/course.js";
import Webinar from "../models/webinar.js";
import TestSeries from "../models/testSeries.js";

const REVIEWABLE_TYPES = {
  course: "course",
  webinar: "webinar",
  testSeries: "testSeries",
};

const clampLimit = (value, fallback = 30, max = 100) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(num, max);
};

const toStringId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  try {
    return value.toString();
  } catch (_err) {
    return null;
  }
};

export const createItemReview = async (req, res) => {
  try {
    const { studentId, itemId, itemType, rating, reviewText } = req.body;

    if (!studentId || !itemId || !itemType) {
      return res.status(400).json({
        success: false,
        message: "studentId, itemId and itemType are required",
      });
    }

    const normalizedType = itemType.toString();
    if (!Object.values(REVIEWABLE_TYPES).includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "itemType must be one of course, webinar, or testSeries",
      });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    const student = await Student.findById(studentId).select(
      "name fullName username email courses webinars testSeries"
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let itemDoc = null;
    let educatorId = null;
    let isEnrolled = false;

    if (normalizedType === REVIEWABLE_TYPES.course) {
      itemDoc = await Course.findOne({
        _id: itemId,
        isActive: true,
        status: { $ne: "deleted" },
      }).select("title name courseTitle educatorID enrolledStudents purchase");

      if (itemDoc) {
        educatorId = itemDoc.educatorID;
        const studentIdStr = toStringId(studentId);
        const enrolledList = (itemDoc.enrolledStudents || []).map((entry) =>
          toStringId(entry?.studentId || entry)
        );
        const purchaseList = (itemDoc.purchase || []).map((entry) =>
          toStringId(entry)
        );
        isEnrolled = enrolledList.includes(studentIdStr) || purchaseList.includes(studentIdStr);
      }
    } else if (normalizedType === REVIEWABLE_TYPES.webinar) {
      itemDoc = await Webinar.findOne({
        _id: itemId,
        isActive: true,
      }).select("title webinarType educatorID studentEnrolled");

      if (itemDoc) {
        educatorId = itemDoc.educatorID;
        const studentIdStr = toStringId(studentId);
        const webinarEnrolled = (itemDoc.studentEnrolled || []).map(toStringId);
        isEnrolled = webinarEnrolled.includes(studentIdStr);
      }
    } else if (normalizedType === REVIEWABLE_TYPES.testSeries) {
      itemDoc = await TestSeries.findOne({
        _id: itemId,
        isActive: true,
      }).select("title educatorId enrolledStudents");

      if (itemDoc) {
        educatorId = itemDoc.educatorId;
        const studentIdStr = toStringId(studentId);
        const enrolled = (itemDoc.enrolledStudents || []).map(toStringId);
        isEnrolled = enrolled.includes(studentIdStr);
      }
    }

    if (!itemDoc) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this item to submit a review",
      });
    }

    const studentName =
      student.fullName || student.name || student.username || student.email || "Student";

    const review = await Review.findOneAndUpdate(
      {
        student: studentId,
        itemType: normalizedType,
        itemId,
      },
      {
        educator: educatorId,
        student: studentId,
        studentName,
        itemType: normalizedType,
        itemId,
        rating: numericRating,
        reviewText: reviewText?.toString()?.trim() || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Review saved",
      data: review,
    });
  } catch (error) {
    console.error("Error creating item review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

export const getEducatorItemReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = clampLimit(req.query.limit, 30, 100);

    const reviews = await Review.find({ educator: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const courseIds = [];
    const webinarIds = [];
    const testSeriesIds = [];

    reviews.forEach((review) => {
      if (review.itemType === REVIEWABLE_TYPES.course) {
        courseIds.push(review.itemId);
      } else if (review.itemType === REVIEWABLE_TYPES.webinar) {
        webinarIds.push(review.itemId);
      } else if (review.itemType === REVIEWABLE_TYPES.testSeries) {
        testSeriesIds.push(review.itemId);
      }
    });

    const [courses, webinars, testSeries] = await Promise.all([
      courseIds.length
        ? Course.find({ _id: { $in: courseIds } }).select("title name courseTitle")
        : [],
      webinarIds.length
        ? Webinar.find({ _id: { $in: webinarIds } }).select("title")
        : [],
      testSeriesIds.length
        ? TestSeries.find({ _id: { $in: testSeriesIds } }).select("title")
        : [],
    ]);

    const courseMap = new Map();
    courses.forEach((course) => {
      courseMap.set(toStringId(course._id), course.title || course.courseTitle || course.name);
    });

    const webinarMap = new Map();
    webinars.forEach((webinar) => {
      webinarMap.set(toStringId(webinar._id), webinar.title);
    });

    const testSeriesMap = new Map();
    testSeries.forEach((series) => {
      testSeriesMap.set(toStringId(series._id), series.title);
    });

    const response = reviews.map((review) => {
      const reviewId = toStringId(review.itemId);
      let itemTitle = "";
      if (review.itemType === REVIEWABLE_TYPES.course) {
        itemTitle = courseMap.get(reviewId) || "Course";
      } else if (review.itemType === REVIEWABLE_TYPES.webinar) {
        itemTitle = webinarMap.get(reviewId) || "Webinar";
      } else if (review.itemType === REVIEWABLE_TYPES.testSeries) {
        itemTitle = testSeriesMap.get(reviewId) || "Test Series";
      }
      return {
        ...review,
        itemTitle,
      };
    });

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching educator item reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};
