import express from "express";
import {
  createPaymentOrder,
  getPaymentStatus,
  handleRazorpayWebhook,
} from "../controllers/payment.controller.js";
import {
  createPaymentOrderValidation,
  validatePaymentIntentIdParam,
} from "../util/validation.js";

const router = express.Router();

router.post("/orders", createPaymentOrderValidation, createPaymentOrder);
router.get("/:id", validatePaymentIntentIdParam, getPaymentStatus);
router.post("/webhook", handleRazorpayWebhook);

export default router;
