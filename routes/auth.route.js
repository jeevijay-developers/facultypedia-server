import express from "express";
import {
  loginEducator,
  loginStudent,
  logoutEducator,
  refreshEducatorToken,
  signupEducator,
  getCurrentEducatorProfile,
} from "../controllers/auth.controller.js";
import {
  educatorLoginValidation,
  educatorSignupValidation,
  studentLoginValidation,
  validateRefreshTokenBody,
} from "../util/validation.js";
import { authenticateEducator } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/ed-signup", educatorSignupValidation, signupEducator);
router.post("/ed-login", educatorLoginValidation, loginEducator);
router.post("/ed-refresh", validateRefreshTokenBody, refreshEducatorToken);
router.post("/ed-logout", validateRefreshTokenBody, logoutEducator);

// Friendly aliases expected by the frontend
router.post("/signup-educator", educatorSignupValidation, signupEducator);
router.post("/login-educator", educatorLoginValidation, loginEducator);
router.post("/refresh-educator", validateRefreshTokenBody, refreshEducatorToken);
router.post("/logout-educator", validateRefreshTokenBody, logoutEducator);

router.post("/login-student", studentLoginValidation, loginStudent);
router.get("/educator/me", authenticateEducator, getCurrentEducatorProfile);

export default router;
