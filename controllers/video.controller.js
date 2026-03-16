import { validationResult } from "express-validator";
import Video from "../models/video.js";
import { uploadVideoAndResolve } from "../util/vimeo.js";
import fs from "fs";

const normalizeBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
    return true;
  }
  return false;
};

export const createVideo = async (req, res) => {
  try {
    if (handleValidation(req, res)) {
      return;
    }

    const { title, links, courseId, courseIds, educatorID } = req.body;
    const isCourseSpecific = normalizeBoolean(req.body.isCourseSpecific);
    const resolvedCourseId =
      courseId || (Array.isArray(courseIds) && courseIds.length > 0 ? courseIds[0] : undefined);

    const video = await Video.create({
      title: title.trim(),
      links,
      isCourseSpecific,
      courseId: isCourseSpecific ? resolvedCourseId : undefined,
      educatorID: educatorID || undefined,
      uploadedBy: req.educator._id,
    });

    res.status(201).json({
      success: true,
      message: "Video created successfully",
      data: video,
    });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create video",
      error: error.message,
    });
  }
};

export const getVideos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isCourseSpecific,
      courseId,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {
      uploadedBy: req.educator._id,
    };
    if (typeof isCourseSpecific !== "undefined") {
      filter.isCourseSpecific = normalizeBoolean(isCourseSpecific);
    }
    if (courseId) {
      filter.courseId = courseId;
    }
    if (search) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("courseId", "title")
        .populate("educatorID", "fullName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Video.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      data: {
        videos,
        pagination: {
          currentPage: parsedPage,
          totalPages: Math.ceil(total / parsedLimit) || 1,
          totalItems: total,
          pageSize: parsedLimit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch videos",
      error: error.message,
    });
  }
};

export const getCourseVideosPublic = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 200, search } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {
      isCourseSpecific: true,
      courseId,
    };

    if (search) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate("courseId", "title")
        .populate("educatorID", "fullName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Video.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Course videos fetched successfully",
      data: {
        videos,
        pagination: {
          currentPage: parsedPage,
          totalPages: Math.ceil(total / parsedLimit) || 1,
          totalItems: total,
          pageSize: parsedLimit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching public course videos:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch course videos",
      error: error.message,
    });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      uploadedBy: req.educator._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Video fetched successfully",
      data: video,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch video",
      error: error.message,
    });
  }
};

export const updateVideo = async (req, res) => {
  try {
    if (handleValidation(req, res)) {
      return;
    }

    const video = await Video.findOne({
      _id: req.params.id,
      uploadedBy: req.educator._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const { title, links, courseId, courseIds } = req.body;
    const resolvedCourseId =
      courseId || (Array.isArray(courseIds) && courseIds.length > 0 ? courseIds[0] : undefined);

    if (typeof title === "string" && title.trim()) {
      video.title = title.trim();
    }

    if (typeof links !== "undefined") {
      video.links = links;
    }

    if (typeof req.body.isCourseSpecific !== "undefined") {
      video.isCourseSpecific = normalizeBoolean(req.body.isCourseSpecific);
    }

    if (video.isCourseSpecific) {
      if (typeof resolvedCourseId !== "undefined") {
        video.courseId = resolvedCourseId;
      }
    } else {
      video.courseId = undefined;
    }

    await video.save();

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update video",
      error: error.message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
      uploadedBy: req.educator._id,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete video",
      error: error.message,
    });
  }
};

export const uploadVideoToVimeoController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video file uploaded",
      });
    }

    const { title, courseId, courseIds } = req.body;
    const isCourseSpecific = normalizeBoolean(req.body.isCourseSpecific);
    const resolvedCourseId =
      courseId || (Array.isArray(courseIds) && courseIds.length > 0 ? courseIds[0] : undefined);

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Video title is required",
      });
    }

    // Upload video to Vimeo
    const vimeoResult = await uploadVideoAndResolve(req.file.path, {
      name: title,
      description: `Demo video: ${title}`,
    });

    // Delete the temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error("Error deleting temporary file:", err);
    }

    // Create video entry in database with Vimeo embed URL
    const video = await Video.create({
      title: title.trim(),
      links: [vimeoResult.embedUrl],
      isCourseSpecific,
      courseId: isCourseSpecific ? resolvedCourseId : undefined,
      uploadedBy: req.educator._id,
    });

    res.status(201).json({
      success: true,
      message: "Video uploaded to Vimeo successfully",
      data: {
        video,
        vimeo: {
          uri: vimeoResult.uri,
          status: vimeoResult.status,
          embedUrl: vimeoResult.embedUrl,
        },
      },
    });
  } catch (error) {
    console.error("Error uploading video to Vimeo:", error);

    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("Error deleting temporary file:", err);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload video to Vimeo",
      error: error.message,
    });
  }
};
