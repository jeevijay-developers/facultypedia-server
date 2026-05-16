import { createFlinkuLink } from "../services/flinku.service.js";

const allowedTypes = new Set(["educator", "course"]);

export const createShareLink = async (req, res, next) => {
  try {
    const { type, id, title } = req.body || {};

    if (!type || !id) {
      return res.status(400).json({
        success: false,
        message: "type and id are required",
      });
    }

    if (!allowedTypes.has(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be educator or course",
      });
    }

    const deepLink = `facultypedia://${type}/${id}`;
    const linkData = await createFlinkuLink({
      title: title || `FacultyPedia ${type}`,
      deepLink,
      params: { type, id },
    });

    const shortUrl =
      linkData?.shortUrl || linkData?.short_url || linkData?.url || null;

    if (!shortUrl) {
      return res.status(502).json({
        success: false,
        message: "Flinku link creation failed",
      });
    }

    return res.json({
      success: true,
      shortUrl,
      slug: linkData?.slug || null,
      deepLink,
    });
  } catch (error) {
    console.error("[share] createShareLink error:", error?.message ?? error);
    return next(error);
  }
};
