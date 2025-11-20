import { validationResult } from "express-validator";
import Post from "../models/post.js";
import Educator from "../models/educator.js";

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

export const createPost = async (req, res) => {
  try {
    if (handleValidation(req, res)) {
      return;
    }

    const { educatorId, subject, specialization, title, description } =
      req.body;

    const educator = await Educator.findById(educatorId);

    if (!educator || educator.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Educator not found",
      });
    }

    const post = await Post.create({
      educatorId,
      subject,
      specialization,
      title,
      description,
    });

    await Educator.findByIdAndUpdate(educatorId, {
      $addToSet: { posts: post._id },
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      specialization,
      educatorId,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (subject) {
      filter.subject = subject;
    }

    if (specialization) {
      filter.specialization = specialization;
    }

    if (educatorId) {
      filter.educatorId = educatorId;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const posts = await Post.find(filter)
      .populate("educatorId", "fullName username slug profilePicture")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate(
      "educatorId",
      "fullName username slug profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getPostsByEducator = async (req, res) => {
  try {
    const { educatorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find({ educatorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments({ educatorId });

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / parseInt(limit)),
          totalPosts,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching educator posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    if (handleValidation(req, res)) {
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const post = await Post.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await Educator.findByIdAndUpdate(post.educatorId, {
      $pull: { posts: post._id },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
