import { body, param, query } from "express-validator";

// ==================== Common Validators ====================

// MongoDB ObjectId validator
export const validateObjectId = (field = "id") => [
  param(field).isMongoId().withMessage(`Invalid ${field} format`),
];

// Slug validator
export const validateSlug = [
  param("slug")
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Invalid slug format"),
];

// Username validator
export const validateUsername = [
  param("username")
    .notEmpty()
    .withMessage("Username is required")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Invalid username format"),
];

// ==================== Enums ====================

export const VALID_SPECIALIZATIONS = ["IIT-JEE", "NEET", "CBSE"];
export const VALID_SUBJECTS = [
  "Biology",
  "Physics",
  "Mathematics",
  "Chemistry",
  "English",
  "Hindi",
];
export const VALID_CLASSES = [
  "Class 6th",
  "Class 7th",
  "Class 8th",
  "Class 9th",
  "Class 10th",
  "Class 11th",
  "Class 12th",
  "Dropper",
];
export const VALID_WEBINAR_TYPES = ["one-to-one", "one-to-all"];
export const VALID_STATUS = ["active", "inactive"];

// ==================== Custom Validators ====================

// Validate specialization array
export const validateSpecialization = (isOptional = false) => {
  const validator = body("specialization");

  if (isOptional) {
    return validator
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one specialization must be selected")
      .custom((specializations) => {
        if (specializations && specializations.length > 0) {
          const invalidSpecializations = specializations.filter(
            (spec) => !VALID_SPECIALIZATIONS.includes(spec)
          );
          if (invalidSpecializations.length > 0) {
            throw new Error(
              `Invalid specializations: ${invalidSpecializations.join(", ")}`
            );
          }
        }
        return true;
      });
  }

  return validator
    .isArray({ min: 1 })
    .withMessage("At least one specialization must be selected")
    .custom((specializations) => {
      const invalidSpecializations = specializations.filter(
        (spec) => !VALID_SPECIALIZATIONS.includes(spec)
      );
      if (invalidSpecializations.length > 0) {
        throw new Error(
          `Invalid specializations: ${invalidSpecializations.join(", ")}`
        );
      }
      return true;
    });
};

// Validate subject array
export const validateSubject = (isOptional = false) => {
  const validator = body("subject");

  if (isOptional) {
    return validator
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one subject must be selected")
      .custom((subjects) => {
        if (subjects && subjects.length > 0) {
          const invalidSubjects = subjects.filter(
            (sub) => !VALID_SUBJECTS.includes(sub)
          );
          if (invalidSubjects.length > 0) {
            throw new Error(`Invalid subjects: ${invalidSubjects.join(", ")}`);
          }
        }
        return true;
      });
  }

  return validator
    .isArray({ min: 1 })
    .withMessage("At least one subject must be selected")
    .custom((subjects) => {
      const invalidSubjects = subjects.filter(
        (sub) => !VALID_SUBJECTS.includes(sub)
      );
      if (invalidSubjects.length > 0) {
        throw new Error(`Invalid subjects: ${invalidSubjects.join(", ")}`);
      }
      return true;
    });
};

// Validate class array
export const validateClass = (isOptional = false) => {
  const validator = body("class");

  if (isOptional) {
    return validator
      .optional()
      .isArray({ min: 1 })
      .withMessage("At least one class must be selected")
      .custom((classes) => {
        if (classes && classes.length > 0) {
          const invalidClasses = classes.filter(
            (cls) => !VALID_CLASSES.includes(cls)
          );
          if (invalidClasses.length > 0) {
            throw new Error(`Invalid classes: ${invalidClasses.join(", ")}`);
          }
        }
        return true;
      });
  }

  return validator
    .isArray({ min: 1 })
    .withMessage("At least one class must be selected")
    .custom((classes) => {
      const invalidClasses = classes.filter(
        (cls) => !VALID_CLASSES.includes(cls)
      );
      if (invalidClasses.length > 0) {
        throw new Error(`Invalid classes: ${invalidClasses.join(", ")}`);
      }
      return true;
    });
};

// Validate mobile number
export const validateMobileNumber = (isOptional = false) => {
  const validator = body("mobileNumber")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian mobile number");

  if (isOptional) {
    return validator.optional();
  }

  return validator
    .notEmpty()
    .withMessage("Mobile number is required")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please provide a valid 10-digit Indian mobile number");
};

// Validate email
export const validateEmail = (isOptional = false) => {
  const validator = body("email")
    .isEmail()
    .withMessage("Please provide a valid email address");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Email is required");
};

// Validate password with strong requirements
export const validatePassword = (isOptional = false) => {
  const validator = body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Password is required");
};

// Validate URL
export const validateURL = (field, isOptional = true) => {
  const validator = body(field)
    .isURL()
    .withMessage(`${field} must be a valid URL`);

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage(`${field} is required`);
};

// Validate username field
export const validateUsernameField = (isOptional = false) => {
  const validator = body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-z0-9_]+$/)
    .withMessage(
      "Username can only contain lowercase letters, numbers, and underscores"
    );

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Username is required");
};

// Validate full name
export const validateFullName = (isOptional = false) => {
  const validator = body("fullName")
    .isLength({ min: 3, max: 100 })
    .withMessage("Full name must be between 3 and 100 characters");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Full name is required");
};

// Validate description
export const validateDescription = [
  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
];

// Validate rating
export const validateRating = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
];

// Validate status
export const validateStatus = [
  body("status")
    .optional()
    .isIn(VALID_STATUS)
    .withMessage("Status must be either active or inactive"),
];

// Validate years of experience
export const validateYOE = (isOptional = false) => {
  const validator = body("yoe")
    .isInt({ min: 0, max: 50 })
    .withMessage("Years of experience must be between 0 and 50");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Years of experience is required");
};

// Validate pay per hour fee
export const validatePayPerHourFee = (isOptional = false) => {
  const validator = body("payPerHourFee")
    .isNumeric()
    .withMessage("Fee must be a number")
    .isFloat({ min: 0 })
    .withMessage("Fee must be greater than or equal to 0");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Pay per hour fee is required");
};

// Validate bank details
export const validateBankDetails = [
  body("bankDetails.accountHolderName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Account holder name cannot exceed 100 characters"),

  body("bankDetails.accountNumber")
    .optional()
    .trim()
    .matches(/^\d{9,18}$/)
    .withMessage("Account number must be between 9 and 18 digits"),

  body("bankDetails.ifscCode")
    .optional()
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage("Please provide a valid IFSC code"),

  body("bankDetails.bankName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Bank name cannot exceed 100 characters"),
];

// Validate student ID in body
export const validateStudentId = [
  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .isMongoId()
    .withMessage("Invalid student ID format"),
];

// ==================== Webinar Validators ====================

// Validate webinar title
export const validateWebinarTitle = (isOptional = false) => {
  const validator = body("title")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Title is required");
};

// Validate webinar description
export const validateWebinarDescription = (isOptional = false) => {
  const validator = body("description")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters");

  if (isOptional) {
    return validator.optional();
  }

  return validator.notEmpty().withMessage("Description is required");
};

// Validate webinar type
export const validateWebinarType = (isOptional = false) => {
  const validator = body("webinarType")
    .isIn(VALID_WEBINAR_TYPES)
    .withMessage('Webinar type must be either "one-to-one" or "one-to-all"');

  if (isOptional) {
    return validator.optional();
  }

  return validator;
};

// Validate webinar timing
export const validateWebinarTiming = (isOptional = false) => {
  const validator = body("timing")
    .isISO8601()
    .withMessage("Invalid date format for timing")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("Webinar timing must be in the future");
      }
      return true;
    });

  if (isOptional) {
    return validator.optional();
  }

  return validator;
};

// Validate webinar fees
export const validateWebinarFees = (isOptional = false) => {
  const validator = body("fees")
    .isNumeric()
    .withMessage("Fees must be a number")
    .isFloat({ min: 0 })
    .withMessage("Fees must be greater than or equal to 0");

  if (isOptional) {
    return validator.optional();
  }

  return validator;
};

// Validate webinar duration
export const validateWebinarDuration = [
  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Duration must be between 1 and 50 characters"),
];

// Validate seat limit
export const validateSeatLimit = (isOptional = false) => {
  const validator = body("seatLimit")
    .isInt({ min: 1, max: 1000 })
    .withMessage("Seat limit must be between 1 and 1000");

  if (isOptional) {
    return validator.optional();
  }

  return validator;
};

// Validate educator ID
export const validateEducatorId = [
  body("educatorID")
    .notEmpty()
    .withMessage("Educator ID is required")
    .isMongoId()
    .withMessage("Invalid educator ID format"),
];

// Validate webinar image
export const validateWebinarImage = [
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
];

// Validate webinar link
export const validateWebinarLink = [
  body("webinarLink")
    .optional()
    .isURL()
    .withMessage("Webinar link must be a valid URL"),
];

// Validate assets link
export const validateAssetsLink = [
  body("assetsLink")
    .optional()
    .isArray()
    .withMessage("Assets link must be an array")
    .custom((links) => {
      if (links && links.length > 0) {
        const invalidLinks = links.filter(
          (link) => !/^https?:\/\/.+/.test(link)
        );
        if (invalidLinks.length > 0) {
          throw new Error("All asset links must be valid URLs");
        }
      }
      return true;
    }),
];

// ==================== Param Validators ====================

// Validate specialization param
export const validateSpecializationParam = [
  param("specialization")
    .isIn(VALID_SPECIALIZATIONS)
    .withMessage("Invalid specialization"),
];

// Validate subject param
export const validateSubjectParam = [
  param("subject").isIn(VALID_SUBJECTS).withMessage("Invalid subject"),
];

// Validate class param
export const validateClassParam = [
  param("className").isIn(VALID_CLASSES).withMessage("Invalid class"),
];

// Validate rating param
export const validateRatingParam = [
  param("minRating")
    .isFloat({ min: 0, max: 5 })
    .withMessage("Rating must be between 0 and 5"),
];

// Validate educator ID param
export const validateEducatorIdParam = [
  param("educatorId").isMongoId().withMessage("Invalid educator ID format"),
];

// ==================== Revenue Validator ====================

export const validateRevenue = [
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0 })
    .withMessage("Amount must be greater than 0"),
  body("courseId")
    .optional()
    .isMongoId()
    .withMessage("Invalid course ID format"),
];
