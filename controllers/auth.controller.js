import { validationResult } from "express-validator";
import bcrypt from "bcrypt";
import Educator from "../models/educator.js";
import Student from "../models/student.js";
import {
  decodeToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../util/token.js";
import {
  VALID_CLASSES,
  VALID_SPECIALIZATIONS,
  VALID_SUBJECTS,
} from "../util/validation.js";

const MAX_REFRESH_TOKENS = 5;

const sanitizeEducator = (educator) => {
  const data =
    typeof educator.toObject === "function"
      ? educator.toObject()
      : { ...educator };
  delete data.password;
  delete data.refreshTokens;
  if (typeof data.introVideo !== "undefined") {
    data.introVideoLink = data.introVideo;
  }
  return data;
};

const sanitizeStudent = (student) => {
  const data =
    typeof student.toObject === "function"
      ? student.toObject()
      : { ...student };
  delete data.password;
  return data;
};

const SOCIAL_LINK_FIELDS = [
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "youtube",
  "website",
];

const DEFAULT_CLASS_OPTIONS = ["class-11th", "class-12th", "dropper"];

const normalizeString = (value = "") =>
  typeof value === "string" ? value.trim() : "";

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return value
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeSpecializations = (value) => {
  const values = toArray(value).map((item) => item.toUpperCase());
  const invalid = values.filter(
    (item) => item && !VALID_SPECIALIZATIONS.includes(item)
  );
  return { values, invalid };
};

const normalizeSubjects = (value) => {
  const values = toArray(value).map((item) => item.toLowerCase());
  const invalid = values.filter(
    (item) => item && !VALID_SUBJECTS.includes(item)
  );
  return { values, invalid };
};

const normalizeClasses = (value) => {
  const values = toArray(value).map((item) => item.toLowerCase());
  const normalized = values.filter((item) => VALID_CLASSES.includes(item));
  const invalid = values.filter(
    (item) => item && !VALID_CLASSES.includes(item)
  );
  return { values: normalized, invalid };
};

const normalizeUsernameInput = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/(^_|_$)/g, "");

const generateUniqueUsername = async ({
  preferred,
  firstName,
  lastName,
  email,
}) => {
  const preferredNormalized = normalizeUsernameInput(preferred || "");
  if (preferredNormalized.length >= 3 && preferredNormalized.length <= 30) {
    const exists = await Educator.exists({ username: preferredNormalized });
    if (!exists) {
      return preferredNormalized;
    }
  }

  const baseCandidates = [
    `${firstName || ""}_${lastName || ""}`,
    email?.split("@")[0],
    "educator",
  ].map((candidate) => normalizeUsernameInput(candidate || ""));

  let base = baseCandidates.find((candidate) => candidate.length >= 3) ||
    `mentor_${Date.now()}`;
  base = base.slice(0, 20);

  let attempt = base;
  let counter = 0;
  while (await Educator.exists({ username: attempt })) {
    counter += 1;
    const suffix = counter.toString();
    const trimmedBase = base.slice(0, Math.max(1, 30 - suffix.length));
    attempt = `${trimmedBase}${suffix}`;
  }

  return attempt;
};

const parseDateValue = (value) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitizeExperienceArray = (entries = []) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry = {}) => ({
      title: normalizeString(entry.title),
      company: normalizeString(entry.company),
      startDate: parseDateValue(entry.startDate),
      endDate: parseDateValue(entry.endDate),
      description: normalizeString(entry.description),
    }))
    .filter((entry) =>
      entry.title ||
      entry.company ||
      entry.description ||
      entry.startDate ||
      entry.endDate
    );
};

const sanitizeQualificationArray = (entries = []) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry = {}) => ({
      title: normalizeString(entry.title),
      institute: normalizeString(entry.institute),
      startDate: parseDateValue(entry.startDate),
      endDate: parseDateValue(entry.endDate),
      description: normalizeString(entry.description),
    }))
    .filter((entry) =>
      entry.title || entry.institute || entry.description || entry.startDate
    );
};

const sanitizeSocialLinks = (socials = {}) => {
  if (typeof socials !== "object" || socials === null) {
    return {};
  }

  return SOCIAL_LINK_FIELDS.reduce((acc, key) => {
    const value = normalizeString(socials[key]);
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const calculateYOE = (experiences = []) => {
  const ranges = experiences
    .map((exp) => {
      if (!exp.startDate) {
        return null;
      }
      const start = exp.startDate instanceof Date ? exp.startDate : null;
      if (!start) {
        return null;
      }
      const end = exp.endDate instanceof Date ? exp.endDate : new Date();
      return { start, end };
    })
    .filter(Boolean);

  if (!ranges.length) {
    return 0;
  }

  const totalMonths = ranges.reduce((sum, range) => {
    const diff = range.end.getTime() - range.start.getTime();
    if (diff <= 0) {
      return sum;
    }
    return sum + diff / (1000 * 60 * 60 * 24 * 30.44);
  }, 0);

  return Math.min(50, Math.max(0, Math.round(totalMonths / 12)));
};

const buildFullName = (firstName, lastName) =>
  [firstName, lastName].filter(Boolean).join(" ").trim();

const respondWithValidationError = (res, message, errors = []) =>
  res.status(400).json({
    success: false,
    message,
    errors,
  });

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
      firstName,
      lastName,
      email,
      password,
      bio,
      specialization,
      class: classesInput,
      mobileNumber,
      introVideoLink,
      subject,
      workExperience,
      qualification,
      socials,
      username: preferredUsername,
    } = req.body;

    const normalizedFirstName = normalizeString(firstName);
    const normalizedLastName = normalizeString(lastName);
    const normalizedEmail = normalizeString(email).toLowerCase();
    const normalizedMobile = normalizeString(mobileNumber);
    const normalizedPreferredUsername = normalizeUsernameInput(
      preferredUsername || ""
    );

    const duplicateQuery = [
      { email: normalizedEmail },
      { mobileNumber: normalizedMobile },
    ];

    if (normalizedPreferredUsername) {
      duplicateQuery.push({ username: normalizedPreferredUsername });
    }

    const existingEducator = await Educator.findOne({
      $or: duplicateQuery,
    });

    if (existingEducator) {
      let field = "educator";
      if (existingEducator.email === normalizedEmail) field = "email";
      else if (
        normalizedPreferredUsername &&
        existingEducator.username === normalizedPreferredUsername
      )
        field = "username";
      else if (existingEducator.mobileNumber === normalizedMobile)
        field = "mobile number";

      return respondWithValidationError(
        res,
        `An educator with this ${field} already exists`
      );
    }

    const { values: specializationValues, invalid: invalidSpecializations } =
      normalizeSpecializations(specialization);

    if (invalidSpecializations.length) {
      return respondWithValidationError(
        res,
        "Invalid specialization provided",
        invalidSpecializations
      );
    }

    if (!specializationValues.length) {
      return respondWithValidationError(
        res,
        "At least one specialization is required"
      );
    }

    const { values: subjectValues, invalid: invalidSubjects } =
      normalizeSubjects(subject);

    if (invalidSubjects.length) {
      return respondWithValidationError(
        res,
        "Invalid subjects provided",
        invalidSubjects
      );
    }

    if (!subjectValues.length) {
      return respondWithValidationError(
        res,
        "At least one subject is required"
      );
    }

    const { values: classValues, invalid: invalidClasses } =
      normalizeClasses(classesInput);

    if (invalidClasses.length) {
      return respondWithValidationError(
        res,
        "Invalid classes provided",
        invalidClasses
      );
    }

    const sanitizedWorkExperience = sanitizeExperienceArray(workExperience);
    const sanitizedQualification = sanitizeQualificationArray(qualification);
    const sanitizedSocials = sanitizeSocialLinks(socials);

    const username = await generateUniqueUsername({
      preferred: normalizedPreferredUsername,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
    });

    const fullName = buildFullName(normalizedFirstName, normalizedLastName) ||
      username;

    const normalizedBio = normalizeString(bio);

    const educatorData = {
      firstName: normalizedFirstName || undefined,
      lastName: normalizedLastName || undefined,
      fullName,
      username,
      email: normalizedEmail,
      password,
      specialization: specializationValues,
      class: classValues.length ? classValues : DEFAULT_CLASS_OPTIONS,
      mobileNumber: normalizedMobile,
      bio: normalizedBio,
      description: normalizedBio,
      subject: subjectValues,
      workExperience: sanitizedWorkExperience,
      qualification: sanitizedQualification,
    };

    if (Object.keys(sanitizedSocials).length) {
      educatorData.socials = sanitizedSocials;
    }

    const calculatedYOE = calculateYOE(sanitizedWorkExperience);
    if (calculatedYOE > 0) {
      educatorData.yoe = calculatedYOE;
    }

    if (introVideoLink) {
      educatorData.introVideo = normalizeString(introVideoLink);
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

export const loginStudent = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();

    const student = await Student.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact support.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateAccessToken({
      sub: student._id.toString(),
      role: "student",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: sanitizeStudent(student),
      TOKEN: token,
    });
  } catch (error) {
    console.error("Error during student login:", error);
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
