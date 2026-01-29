import "dotenv/config";
import path from "path";
import multer from "multer";
import ImageKit from "imagekit";
import {
  MAX_STUDY_MATERIAL_FILE_COUNT,
  MAX_STUDY_MATERIAL_FILE_SIZE,
} from "../util/studyMaterial.js";

const { IMGKIT_NAME, IMGKIT_PUBLIC_KEY, IMGKIT_PRIVATE_KEY } = process.env;

if (!IMGKIT_NAME || !IMGKIT_PUBLIC_KEY || !IMGKIT_PRIVATE_KEY) {
  throw new Error(
    "ImageKit environment variables are missing. Please set IMGKIT_NAME, IMGKIT_PUBLIC_KEY, and IMGKIT_PRIVATE_KEY."
  );
}

// Initialize ImageKit SDK
const imagekit = new ImageKit({
  publicKey: IMGKIT_PUBLIC_KEY,
  privateKey: IMGKIT_PRIVATE_KEY,
  urlEndpoint: `https://ik.imagekit.io/${IMGKIT_NAME}`,
});

// ============================================
// Helper Functions
// ============================================

const buildPublicId = (originalName = "", prefix = "file") => {
  const baseName = path.parse(originalName).name || prefix;
  const normalized = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || prefix;
  return `${normalized}-${Date.now()}`;
};

const isAllowedImageMimeType = (mimeType) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  return allowed.includes((mimeType || "").toLowerCase());
};

// ============================================
// ImageKit Upload Functions
// ============================================

/**
 * Upload an image buffer to ImageKit
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Destination folder
 * @param {Object} transformation - Optional transformation object
 * @returns {Promise<Object>} - ImageKit upload response
 */
export const uploadImageToImageKit = async (
  buffer,
  fileName,
  folder = "facultypedia/misc",
  transformation = null
) => {
  const response = await imagekit.upload({
    file: buffer,
    fileName: buildPublicId(fileName, "image"),
    folder: folder,
    useUniqueFileName: true,
  });

  // Add transformed URL if transformation is specified
  if (transformation && response.url) {
    const transformParams = [];
    if (transformation.width) transformParams.push(`w-${transformation.width}`);
    if (transformation.height) transformParams.push(`h-${transformation.height}`);
    if (transformation.crop) transformParams.push(`c-at_max`);

    if (transformParams.length > 0) {
      const urlParts = response.url.split(`/${IMGKIT_NAME}/`);
      if (urlParts.length === 2) {
        response.transformedUrl = `${urlParts[0]}/${IMGKIT_NAME}/tr:${transformParams.join(",")}/${urlParts[1]}`;
      }
    }
  }

  return response;
};

/**
 * Upload a raw file (PDF, etc.) to ImageKit
 * @param {Buffer} buffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Destination folder
 * @returns {Promise<Object>} - ImageKit upload response
 */
export const uploadRawFileToImageKit = async (
  buffer,
  fileName,
  folder = "facultypedia/study-materials"
) => {
  const response = await imagekit.upload({
    file: buffer,
    fileName: buildPublicId(fileName, "document"),
    folder: folder,
    useUniqueFileName: true,
  });

  return response;
};

/**
 * Delete a file from ImageKit by fileId
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<void>}
 */
export const deleteImageKitAsset = async (fileId) => {
  if (!fileId) {
    return;
  }
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error("Failed to delete ImageKit asset", error);
  }
};

/**
 * Delete a file from ImageKit by URL (extracts fileId from URL or uses bulk delete)
 * @param {string} url - ImageKit file URL
 * @returns {Promise<void>}
 */
export const deleteImageKitAssetByUrl = async (url) => {
  if (!url) return;

  try {
    // Extract file path from URL for searching
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // Search for the file by name
    const files = await imagekit.listFiles({
      name: fileName,
      limit: 1,
    });

    if (files && files.length > 0) {
      await imagekit.deleteFile(files[0].fileId);
    }
  } catch (error) {
    console.error("Failed to delete ImageKit asset by URL", error);
  }
};

// ============================================
// Multer Middleware Configurations
// ============================================

// Memory storage for all uploads - we'll upload to ImageKit manually
const memoryStorage = multer.memoryStorage();

// Image file filter
const imageFileFilter = (_req, file, cb) => {
  if (!isAllowedImageMimeType(file.mimetype)) {
    cb(new Error("Only JPG, JPEG, PNG, and WebP images are allowed"));
    return;
  }
  cb(null, true);
};

// PDF file filter
const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
]);

const pdfFileFilter = (_req, file, cb) => {
  const mimeType = (file?.mimetype || "").toLowerCase();
  if (!PDF_MIME_TYPES.has(mimeType)) {
    cb(new Error("Only PDF files are allowed"));
    return;
  }
  cb(null, true);
};

// Educator image upload middleware
export const uploadEducatorImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: imageFileFilter,
});

// Course image upload middleware
export const uploadCourseImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: imageFileFilter,
});

// Generic image upload middleware (for tests, misc, etc.)
export const uploadGenericImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: imageFileFilter,
});

// Study material (PDF) upload middleware
export const uploadStudyMaterialDoc = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_STUDY_MATERIAL_FILE_SIZE,
    files: MAX_STUDY_MATERIAL_FILE_COUNT,
  },
  fileFilter: pdfFileFilter,
});

// ============================================
// Upload Processing Functions (Post-Multer)
// ============================================

/**
 * Process educator image upload after multer
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Upload result with url and fileId
 */
export const processEducatorImageUpload = async (file) => {
  if (!file?.buffer) {
    throw new Error("No file buffer provided");
  }

  const result = await uploadImageToImageKit(
    file.buffer,
    file.originalname,
    "facultypedia/educators",
    { width: 800, height: 800, crop: "limit" }
  );

  return {
    url: result.transformedUrl || result.url,
    fileId: result.fileId,
    publicId: result.fileId,
    originalUrl: result.url,
    name: result.name,
  };
};

/**
 * Process course image upload after multer
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} - Upload result with url and fileId
 */
export const processCourseImageUpload = async (file) => {
  if (!file?.buffer) {
    throw new Error("No file buffer provided");
  }

  const result = await uploadImageToImageKit(
    file.buffer,
    file.originalname,
    "facultypedia/courses",
    { width: 1280, height: 720, crop: "limit" }
  );

  return {
    url: result.transformedUrl || result.url,
    fileId: result.fileId,
    publicId: result.fileId,
    originalUrl: result.url,
    name: result.name,
  };
};

/**
 * Process generic image upload after multer (type-based folder selection)
 * @param {Object} file - Multer file object
 * @param {string} type - Upload type: 'educator', 'course', 'test', 'misc'
 * @returns {Promise<Object>} - Upload result with url and fileId
 */
export const processGenericImageUpload = async (file, type = "misc") => {
  if (!file?.buffer) {
    throw new Error("No file buffer provided");
  }

  let folder = "facultypedia/misc";
  let transformation = { width: 1280, height: 720, crop: "limit" };

  switch (type) {
    case "educator":
      folder = "facultypedia/educators";
      transformation = { width: 800, height: 800, crop: "limit" };
      break;
    case "course":
      folder = "facultypedia/courses";
      break;
    case "test":
      folder = "facultypedia/tests";
      break;
  }

  const result = await uploadImageToImageKit(
    file.buffer,
    file.originalname,
    folder,
    transformation
  );

  return {
    url: result.transformedUrl || result.url,
    fileId: result.fileId,
    publicId: result.fileId,
    originalUrl: result.url,
    name: result.name,
  };
};

/**
 * Process study material PDF upload after multer
 * @param {Object} file - Multer file object with buffer
 * @returns {Promise<Object>} - Upload result compatible with previous Cloudinary response
 */
export const uploadStudyMaterialPdfBuffer = async (file) => {
  if (!file?.buffer) {
    throw new Error("Invalid PDF buffer provided for upload");
  }

  const result = await uploadRawFileToImageKit(
    file.buffer,
    file.originalname,
    "facultypedia/study-materials"
  );

  // Return object compatible with previous Cloudinary response structure
  return {
    secure_url: result.url,
    url: result.url,
    public_id: result.fileId,
    fileId: result.fileId,
    original_filename: file.originalname,
    bytes: result.size,
    format: "pdf",
    resource_type: "raw",
  };
};

// ============================================
// Legacy Compatibility Aliases
// ============================================

// Alias for backward compatibility with Cloudinary delete function
export const deleteCloudinaryAsset = deleteImageKitAsset;

// Export the imagekit instance for direct access if needed
export default imagekit;
