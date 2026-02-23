import express from "express";
import { createItemReview, getEducatorItemReviews } from "../controllers/review.controller.js";

const router = express.Router();

// Submit or update a review for a course, webinar, or test series
router.post("/", createItemReview);

// Get all item reviews for a specific educator
router.get("/educator/:id", getEducatorItemReviews);

export default router;
