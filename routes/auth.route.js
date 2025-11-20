import express from "express";
import {
  loginEducator,
  logoutEducator,
  refreshEducatorToken,
  signupEducator,
} from "../controllers/auth.controller.js";
import {
  educatorLoginValidation,
  educatorSignupValidation,
  validateRefreshTokenBody,
} from "../util/validation.js";

const router = express.Router();

router.post("/ed-signup", educatorSignupValidation, signupEducator);
router.post("/ed-login", educatorLoginValidation, loginEducator);
router.post("/ed-refresh", validateRefreshTokenBody, refreshEducatorToken);
router.post("/ed-logout", validateRefreshTokenBody, logoutEducator);

export default router;
