import express from "express";
import {
  createPaymentOrder,
  getPaymentStatus,
  handleRazorpayWebhook,
  verifyPaymentSignature,
} from "../controllers/payment.controller.js";
import {
  createPaymentOrderValidation,
  validatePaymentIntentIdParam,
} from "../util/validation.js";
import { rateLimit } from "express-rate-limit";

const router = express.Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many webhook requests",
});

router.post("/orders", createPaymentOrderValidation, createPaymentOrder);
router.get("/:id", validatePaymentIntentIdParam, getPaymentStatus);
router.post("/webhook", webhookLimiter, handleRazorpayWebhook);
router.post("/verify", verifyPaymentSignature);

export default router;
