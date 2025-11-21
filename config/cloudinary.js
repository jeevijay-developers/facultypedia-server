import "dotenv/config";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
  throw new Error(
    "Cloudinary environment variables are missing. Please set CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET."
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
  secure: true,
});

const educatorImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "facultypedia/educators",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

const courseImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "facultypedia/courses",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1280, height: 720, crop: "limit" }],
  },
});

export const uploadEducatorImage = multer({
  storage: educatorImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export const uploadCourseImage = multer({
  storage: courseImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

const dynamicStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const type = req.query.type || "misc";
    let folder = "facultypedia/misc";
    let transformation = [{ width: 1280, height: 720, crop: "limit" }];

    switch (type) {
      case "educator":
        folder = "facultypedia/educators";
        transformation = [{ width: 800, height: 800, crop: "limit" }];
        break;
      case "course":
        folder = "facultypedia/courses";
        break;
      case "test":
        folder = "facultypedia/tests";
        break;
    }

    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation,
    };
  },
});

export const uploadGenericImage = multer({
  storage: dynamicStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) {
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete Cloudinary asset", error);
  }
};

export default cloudinary;
