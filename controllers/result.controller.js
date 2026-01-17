import mongoose from "mongoose";
import Student from "../models/student.js";

const maybeObjectId = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return value;
};

const sanitizeBreakdown = (items) => {
  if (!Array.isArray(items)) return [];

  return items.slice(0, 200).map((item) => {
    const correctArray = Array.isArray(item?.correct)
      ? item.correct
          .map((c) => Number(c))
          .filter((c) => Number.isFinite(c))
      : [];

    const questionId = item?.questionId || item?.id;
    const resolvedQuestionId = maybeObjectId(questionId);

    return {
      questionId: resolvedQuestionId,
      selected: Number.isFinite(Number(item?.selected))
        ? Number(item.selected)
        : null,
      correct: correctArray,
      isCorrect: Boolean(item?.isCorrect),
      text:
        typeof item?.text === "string"
          ? item.text.slice(0, 1000)
          : undefined,
    };
  });
};

const sanitizeSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return undefined;

  return subjects.slice(0, 10).map((subj) => ({
    name: typeof subj?.name === "string" ? subj.name : undefined,
    score: Number(subj?.score) || 0,
    totalMarks: Number(subj?.totalMarks) || 0,
  }));
};

export const submitTestResult = async (req, res) => {
  try {
    const {
      studentId,
      testId,
      testSeriesId,
      testTitle,
      correct,
      incorrect,
      unattempted,
      questionBreakdown,
      submittedAt,
      totalMarks,
      obtained,
      score,
      percentage,
      rank,
      timeTaken,
      subjects,
    } = req.body || {};

    if (!studentId || !testId) {
      return res.status(400).json({
        success: false,
        message: "studentId and testId are required",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const now = submittedAt ? new Date(submittedAt) : new Date();
    const numericTotalMarks = Number(totalMarks ?? 0) || 0;
    const numericScore = Number(obtained ?? score ?? 0) || 0;
    const numericPercentage = Number.isFinite(Number(percentage))
      ? Number(percentage)
      : numericTotalMarks
      ? Math.max(0, Math.round((numericScore / numericTotalMarks) * 100))
      : 0;

    const breakdown = sanitizeBreakdown(questionBreakdown);
    const subjectScores = sanitizeSubjects(subjects);

    const resultData = {
      testId: maybeObjectId(testId) || testId,
      testSeriesId: maybeObjectId(testSeriesId),
      testTitle: typeof testTitle === "string" ? testTitle.slice(0, 200) : undefined,
      score: numericScore,
      totalMarks: numericTotalMarks,
      percentage: numericPercentage,
      rank: Number.isFinite(Number(rank)) ? Number(rank) : undefined,
      correct: Number(correct) || 0,
      incorrect: Number(incorrect) || 0,
      unattempted: Number(unattempted) || 0,
      questionBreakdown: breakdown,
      submittedAt: now,
      completedAt: now,
      subjects: subjectScores,
    };

    const existingResultIndex = student.results.findIndex(
      (item) => item.testId && item.testId.toString() === resultData.testId.toString()
    );

    if (existingResultIndex >= 0) {
      const existing = student.results[existingResultIndex].toObject
        ? student.results[existingResultIndex].toObject()
        : student.results[existingResultIndex];
      student.results[existingResultIndex] = {
        ...existing,
        ...resultData,
      };
    } else {
      student.results.unshift(resultData);
    }

    const testSummary = {
      testId: resultData.testId,
      attemptedAt: now,
      score: numericScore,
      totalMarks: numericTotalMarks,
      percentage: numericPercentage,
      status: "completed",
      timeTaken: Number.isFinite(Number(timeTaken)) ? Number(timeTaken) : undefined,
    };

    const existingTestIndex = student.tests.findIndex(
      (item) => item.testId && item.testId.toString() === resultData.testId.toString()
    );

    if (existingTestIndex >= 0) {
      const existing = student.tests[existingTestIndex].toObject
        ? student.tests[existingTestIndex].toObject()
        : student.tests[existingTestIndex];
      student.tests[existingTestIndex] = {
        ...existing,
        ...testSummary,
      };
    } else {
      student.tests.unshift(testSummary);
    }

    student.progress.testsTaken = student.results.length;
    const aggregatePercent = student.results.reduce((sum, item) => {
      return sum + (Number(item.percentage) || 0);
    }, 0);
    student.progress.avgScore = student.results.length
      ? aggregatePercent / student.results.length
      : 0;

    await student.save();

    const savedResult = student.results.find(
      (item) => item.testId && item.testId.toString() === resultData.testId.toString()
    );

    return res.status(existingResultIndex >= 0 ? 200 : 201).json({
      success: true,
      message: existingResultIndex >= 0 ? "Result updated" : "Result created",
      data: savedResult,
    });
  } catch (error) {
    console.error("Error submitting test result:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getResultsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "studentId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studentId",
      });
    }

    const student = await Student.findById(studentId)
      .select("results tests progress name username")
      .populate("results.testId", "title slug overallMarks")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Results retrieved successfully",
      data: {
        results: student.results || [],
        tests: student.tests || [],
        progress: student.progress || {},
        student: {
          id: student._id,
          name: student.name,
          username: student.username,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching student results:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default { submitTestResult, getResultsByStudent };
