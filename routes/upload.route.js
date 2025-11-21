import express from "express";
import { uploadGenericImage } from "../config/cloudinary.js";

const router = express.Router();

router.post("/image", uploadGenericImage.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided" });
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Image upload failed",
        error: error.message,
      });
  }
});

export default router;
