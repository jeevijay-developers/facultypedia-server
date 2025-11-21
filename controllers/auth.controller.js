import { validationResult } from "express-validator";
import Educator from "../models/educator.js";
import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../util/token.js";

const MAX_REFRESH_TOKENS = 5;

const sanitizeEducator = (educator) => {
  const data =
    typeof educator.toObject === "function"
      ? educator.toObject()
      : { ...educator };
  delete data.password;
  delete data.refreshTokens;
  return data;
};

const purgeExpiredTokens = async (educatorId) => {
  await Educator.findByIdAndUpdate(educatorId, {
    $pull: { refreshTokens: { expiresAt: { $lte: new Date() } } },
  });
};

const storeRefreshToken = async (educatorId, refreshToken) => {
  const decoded = decodeToken(refreshToken);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const tokenHash = hashToken(refreshToken);

  await Educator.findByIdAndUpdate(educatorId, {
    $pull: { refreshTokens: { token: tokenHash } },
  });

  await Educator.findByIdAndUpdate(educatorId, {
    $push: {
      refreshTokens: {
        $each: [
          {
            token: tokenHash,
            expiresAt,
          },
        ],
        $slice: -MAX_REFRESH_TOKENS,
      },
    },
  });
};

const issueTokens = async (educatorId) => {
  await purgeExpiredTokens(educatorId);

  const accessToken = generateAccessToken({
    sub: educatorId.toString(),
    role: "educator",
  });
  const refreshToken = generateRefreshToken({
    sub: educatorId.toString(),
    role: "educator",
  });

  await storeRefreshToken(educatorId, refreshToken);

  return { accessToken, refreshToken };
};

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
    return true;
  }
  return false;
};

export const signupEducator = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const {
      fullName,
      username,
      email,
      password,
      description,
      specialization,
      class: classes,
      mobileNumber,
      profilePicture,
      introVideo,
      payPerHourFee,
      subject,
      yoe,
      bankDetails,
    } = req.body;

    const existingEducator = await Educator.findOne({
      $or: [{ email }, { username }, { mobileNumber }],
    });

    if (existingEducator) {
      let field = "educator";
      if (existingEducator.email === email) field = "email";
      else if (existingEducator.username === username) field = "username";
      else if (existingEducator.mobileNumber === mobileNumber)
        field = "mobile number";

      return res.status(400).json({
        success: false,
        message: `An educator with this ${field} already exists`,
      });
    }

    const educatorData = {
      fullName,
      username,
      email,
      password,
      specialization,
      class: classes,
      mobileNumber,
      subject,
    };

    if (typeof description !== "undefined") {
      educatorData.description = description;
    }
    if (typeof yoe !== "undefined") {
      educatorData.yoe = yoe;
    }
    if (profilePicture) {
      educatorData.profilePicture = profilePicture;
    }
    if (introVideo) {
      educatorData.introVideo = introVideo;
    }
    if (typeof payPerHourFee !== "undefined") {
      educatorData.payPerHourFee = payPerHourFee;
    }
    if (bankDetails) {
      educatorData.bankDetails = bankDetails;
    }

    const educator = new Educator(educatorData);

    await educator.save();

    const tokens = await issueTokens(educator._id);
    const educatorDataResponse = sanitizeEducator(educator);

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: {
        educator: educatorDataResponse,
        tokens,
      },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const loginEducator = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const { email, password } = req.body;

    const educator = await Educator.findOne({ email }).select("+password");

    if (!educator) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await educator.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const tokens = await issueTokens(educator._id);
    const educatorData = sanitizeEducator(educator);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        educator: educatorData,
        tokens,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const refreshEducatorToken = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const hashedToken = hashToken(refreshToken);
    const educator = await Educator.findById(payload.sub).select(
      "+refreshTokens"
    );

    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found",
      });
    }

    const storedToken = (educator.refreshTokens || []).find(
      (item) => item.token === hashedToken
    );

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      await purgeExpiredTokens(educator._id);
      return res.status(401).json({
        success: false,
        message: "Refresh token expired or invalid",
      });
    }

    await Educator.findByIdAndUpdate(educator._id, {
      $pull: { refreshTokens: { token: hashedToken } },
    });

    const tokens = await issueTokens(educator._id);
    const educatorData = sanitizeEducator(educator);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        educator: educatorData,
        tokens,
      },
    });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const logoutEducator = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const { refreshToken } = req.body;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(200).json({
        success: true,
        message: "Logged out",
      });
    }

    const hashedToken = hashToken(refreshToken);

    await Educator.findByIdAndUpdate(payload.sub, {
      $pull: { refreshTokens: { token: hashedToken } },
    });

    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCurrentEducatorProfile = async (req, res) => {
  try {
    const educator = req.educator;

    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Educator profile fetched",
      data: {
        educator: sanitizeEducator(educator),
      },
    });
  } catch (error) {
    console.error("Error fetching educator profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
