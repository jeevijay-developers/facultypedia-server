import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  getPostsByEducator,
  updatePost,
} from "../controllers/post.controller.js";
import {
  createPostValidation,
  updatePostValidation,
  validateEducatorIdParam,
  validateObjectId,
} from "../util/validation.js";

const router = express.Router();

router.post("/", createPostValidation, createPost);
router.get("/", getAllPosts);
router.get(
  "/educator/:educatorId",
  validateEducatorIdParam,
  getPostsByEducator
);
router.get("/:id", validateObjectId(), getPostById);
router.put(
  "/:id",
  [...validateObjectId(), ...updatePostValidation],
  updatePost
);
router.delete("/:id", validateObjectId(), deletePost);

export default router;
