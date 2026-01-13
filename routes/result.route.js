import { Router } from "express";
import { submitTestResult, getResultsByStudent } from "../controllers/result.controller.js";

const router = Router();

// Upsert a student's test result (overwrites if the student re-attempts the same test)
router.post("/results/submit-test", submitTestResult);

// Fetch results for a student
router.get("/results/student/:studentId", getResultsByStudent);

// Legacy path for existing frontend calls (/api/test/results/:studentId)
router.get("/test/results/:studentId", getResultsByStudent);

export default router;
