import express from "express";
import { createShareLink } from "../controllers/share.controller.js";

const router = express.Router();

router.post("/share-links", createShareLink);

export default router;
