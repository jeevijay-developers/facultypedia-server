import { validationResult } from "express-validator";
import TestSeries from "../models/testSeries.js";

// ==================== CRUD Operations ====================

// Create a new test series
export const createTestSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      price,
      validity,
      numberOfTests,
      image,
      educatorId,
      subject,
      specialization,
      isCourseSpecific,
      courseId,
    } = req.body;

    // Check if test series with same title exists for this educator
    const existingTestSeries = await TestSeries.findOne({
      title,
      educatorId,
      isActive: true,
    });

    if (existingTestSeries) {
      return res.status(400).json({
        message:
          "A test series with this title already exists for this educator",
      });
    }

    // If course specific, courseId is required
    if (isCourseSpecific && !courseId) {
      return res.status(400).json({
        message: "Course ID is required for course-specific test series",
      });
    }

    const testSeries = new TestSeries({
      title,
      description,
      price,
      validity,
      numberOfTests,
      image,
      educatorId,
      subject,
      specialization,
      isCourseSpecific: isCourseSpecific || false,
      courseId: isCourseSpecific ? courseId : null,
    });

    // Generate slug
    testSeries.slug = testSeries.generateSlug();

    await testSeries.save();

    res.status(201).json({
      message: "Test series created successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error creating test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all test series with filters and pagination
export const getAllTestSeries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      subject,
      minPrice,
      maxPrice,
      minRating,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      isCourseSpecific,
      educatorId,
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (specialization) {
      query.specialization = specialization;
    }

    if (subject) {
      query.subject = subject;
    }

    if (minPrice) {
      query.price = { ...query.price, $gte: parseFloat(minPrice) };
    }

    if (maxPrice) {
      query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (isCourseSpecific !== undefined) {
      query.isCourseSpecific = isCourseSpecific === "true";
    }

    if (educatorId) {
      query.educatorId = educatorId;
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const testSeries = await TestSeries.find(query)
      .populate("educatorId", "fullName username email profilePicture")
      .populate("courseId", "title slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TestSeries.countDocuments(query);

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
        testSeriesPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by ID
export const getTestSeriesById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true })
      .populate(
        "educatorId",
        "fullName username email profilePicture specialization"
      )
      .populate("enrolledStudents", "fullName email")
      .populate("tests", "title description duration totalMarks")
      .populate("courseId", "title slug");

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    res.status(200).json({ testSeries });
  } catch (error) {
    console.error("Error fetching test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by slug
export const getTestSeriesBySlug = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;

    const testSeries = await TestSeries.findOne({ slug, isActive: true })
      .populate(
        "educatorId",
        "fullName username email profilePicture specialization"
      )
      .populate("enrolledStudents", "fullName email")
      .populate("tests", "title description duration totalMarks")
      .populate("courseId", "title slug");

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    res.status(200).json({ testSeries });
  } catch (error) {
    console.error("Error fetching test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update test series
export const updateTestSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.enrolledStudents;
    delete updateData.tests;
    delete updateData.rating;
    delete updateData.ratingCount;

    const testSeries = await TestSeries.findOneAndUpdate(
      { _id: id, isActive: true },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate("educatorId", "fullName username email");

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    res.status(200).json({
      message: "Test series updated successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error updating test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete test series (soft delete)
export const deleteTestSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const testSeries = await TestSeries.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    res.status(200).json({ message: "Test series deleted successfully" });
  } catch (error) {
    console.error("Error deleting test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== Additional Controllers ====================

// Get test series by educator
export const getTestSeriesByEducator = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { educatorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.findByEducator(educatorId)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TestSeries.countDocuments({
      educatorId: educatorId,
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error fetching test series by educator:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by specialization
export const getTestSeriesBySpecialization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { specialization } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.findBySpecialization(specialization)
      .populate("educatorId", "fullName username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await TestSeries.countDocuments({
      specialization: specialization,
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error fetching test series by specialization:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by subject
export const getTestSeriesBySubject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.findBySubject(subject)
      .populate("educatorId", "fullName username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await TestSeries.countDocuments({
      subject: subject,
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error fetching test series by subject:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by rating
export const getTestSeriesByRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { minRating } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.findByMinRating(parseFloat(minRating))
      .populate("educatorId", "fullName username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await TestSeries.countDocuments({
      rating: { $gte: parseFloat(minRating) },
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error fetching test series by rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Search test series by title
export const searchTestSeriesByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    const { page = 1, limit = 10 } = req.query;

    if (!title) {
      return res.status(400).json({ message: "Title parameter is required" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.find({
      title: { $regex: title, $options: "i" },
      isActive: true,
    })
      .populate("educatorId", "fullName username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await TestSeries.countDocuments({
      title: { $regex: title, $options: "i" },
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error searching test series:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series by course
export const getTestSeriesByCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const testSeries = await TestSeries.findByCourse(courseId)
      .populate("educatorId", "fullName username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TestSeries.countDocuments({
      courseId: courseId,
      isCourseSpecific: true,
      isActive: true,
    });

    res.status(200).json({
      testSeries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTestSeries: total,
      },
    });
  } catch (error) {
    console.error("Error fetching test series by course:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Enroll student in test series
export const enrollStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { studentId } = req.body;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    // Check if student is already enrolled
    if (testSeries.enrolledStudents.includes(studentId)) {
      return res.status(400).json({
        message: "Student is already enrolled in this test series",
      });
    }

    testSeries.enrolledStudents.push(studentId);
    testSeries.updatedAt = Date.now();
    await testSeries.save();

    res.status(200).json({
      message: "Student enrolled successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove student from test series
export const removeStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { studentId } = req.body;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    testSeries.enrolledStudents = testSeries.enrolledStudents.filter(
      (student) => student.toString() !== studentId
    );
    testSeries.updatedAt = Date.now();
    await testSeries.save();

    res.status(200).json({
      message: "Student removed successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error removing student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add test to test series
export const addTest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { testId } = req.body;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    // Check if test is already added
    if (testSeries.tests.includes(testId)) {
      return res.status(400).json({
        message: "Test already added to this test series",
      });
    }

    testSeries.tests.push(testId);
    testSeries.updatedAt = Date.now();
    await testSeries.save();

    res.status(200).json({
      message: "Test added successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error adding test:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove test from test series
export const removeTest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { testId } = req.body;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    testSeries.tests = testSeries.tests.filter(
      (test) => test.toString() !== testId
    );
    testSeries.updatedAt = Date.now();
    await testSeries.save();

    res.status(200).json({
      message: "Test removed successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Error removing test:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update test series rating
export const updateTestSeriesRating = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating } = req.body;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    // Calculate new average rating
    const totalRating = testSeries.rating * testSeries.ratingCount + rating;
    testSeries.ratingCount += 1;
    testSeries.rating = totalRating / testSeries.ratingCount;
    testSeries.updatedAt = Date.now();

    await testSeries.save();

    res.status(200).json({
      message: "Rating updated successfully",
      testSeries: {
        id: testSeries._id,
        rating: testSeries.rating,
        ratingCount: testSeries.ratingCount,
      },
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get test series statistics
export const getTestSeriesStatistics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const testSeries = await TestSeries.findOne({ _id: id, isActive: true });

    if (!testSeries) {
      return res.status(404).json({ message: "Test series not found" });
    }

    const statistics = {
      testSeriesId: testSeries._id,
      title: testSeries.title,
      enrolledCount: testSeries.enrolledCount,
      testCount: testSeries.testCount,
      numberOfTests: testSeries.numberOfTests,
      rating: testSeries.rating,
      ratingCount: testSeries.ratingCount,
      price: testSeries.price,
      isExpired: testSeries.isExpired,
      isValid: testSeries.isValid,
      validity: testSeries.validity,
      isCourseSpecific: testSeries.isCourseSpecific,
    };

    res.status(200).json({ statistics });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get overall platform statistics
export const getOverallStatistics = async (req, res) => {
  try {
    const totalTestSeries = await TestSeries.countDocuments({ isActive: true });

    // Statistics by specialization
    const specializationStats = await TestSeries.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$specialization" },
      {
        $group: {
          _id: "$specialization",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          totalEnrolled: { $sum: { $size: "$enrolledStudents" } },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    // Statistics by subject
    const subjectStats = await TestSeries.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$subject" },
      {
        $group: {
          _id: "$subject",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    // Top rated test series
    const topRatedTestSeries = await TestSeries.find({ isActive: true })
      .sort({ rating: -1, ratingCount: -1 })
      .limit(10)
      .select("title rating ratingCount educatorId price")
      .populate("educatorId", "fullName username");

    // Most enrolled test series
    const mostEnrolledTestSeries = await TestSeries.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          title: 1,
          educatorId: 1,
          enrolledCount: { $size: "$enrolledStudents" },
          price: 1,
        },
      },
      { $sort: { enrolledCount: -1 } },
      { $limit: 10 },
    ]);

    // Course-specific vs standalone
    const courseSpecificCount = await TestSeries.countDocuments({
      isCourseSpecific: true,
      isActive: true,
    });

    const standaloneCount = await TestSeries.countDocuments({
      isCourseSpecific: false,
      isActive: true,
    });

    res.status(200).json({
      totalTestSeries,
      courseSpecificCount,
      standaloneCount,
      specializationStats,
      subjectStats,
      topRatedTestSeries,
      mostEnrolledTestSeries,
    });
  } catch (error) {
    console.error("Error fetching overall statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
