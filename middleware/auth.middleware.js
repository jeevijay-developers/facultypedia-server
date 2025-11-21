import Educator from "../models/educator.js";
import { verifyAccessToken } from "../util/token.js";

const buildErrorResponse = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const authenticateEducator = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return buildErrorResponse(res, 401, "Authorization header missing");
    }

    const token = authHeader.split(" ")[1];
    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return buildErrorResponse(res, 401, "Invalid or expired token");
    }

    if (payload.role !== "educator") {
      return buildErrorResponse(res, 403, "Educator access required");
    }

    const educator = await Educator.findById(payload.sub);
    if (!educator) {
      return buildErrorResponse(res, 404, "Educator not found");
    }

    req.educator = educator;
    req.auth = {
      educatorId: educator._id,
      tokenPayload: payload,
    };

    next();
  } catch (error) {
    console.error("Educator auth middleware error:", error);
    buildErrorResponse(res, 500, "Authentication failed");
  }
};
