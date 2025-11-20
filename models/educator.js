import mongoose from "mongoose";
import bcrypt from "bcrypt";

const educatorSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't include password in queries by default
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    specialization: [
      {
        type: String,
        enum: {
          values: ["IIT-JEE", "NEET", "CBSE"],
          message: "{VALUE} is not a valid specialization",
        },
        required: [true, "At least one specialization is required"],
      },
    ],
    class: [
      {
        type: String,
        enum: {
          values: [
            "Class 6th",
            "Class 7th",
            "Class 8th",
            "Class 9th",
            "Class 10th",
            "Class 11th",
            "Class 12th",
            "Dropper",
          ],
          message: "{VALUE} is not a valid class",
        },
        required: [true, "At least one class is required"],
      },
    ],
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please provide a valid 10-digit Indian mobile number",
      ],
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
    introVideo: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    payPerHourFee: {
      type: Number,
      min: [0, "Fee cannot be negative"],
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "{VALUE} is not a valid status",
      },
      default: "active",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
      },
      count: {
        type: Number,
        default: 0,
        min: [0, "Rating count cannot be negative"],
      },
    },
    subject: [
      {
        type: String,
        enum: {
          values: ["Biology", "Physics", "Mathematics", "Chemistry", "English"],
          message: "{VALUE} is not a valid subject",
        },
        required: [true, "At least one subject is required"],
        lowercase: true,
        trim: true,
      },
    ],
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    webinars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Webinar",
      },
    ],
    testSeries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestSeries",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    yoe: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      max: [50, "Years of experience cannot exceed 50"],
      default: 0,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
        default: "",
      },
      accountNumber: {
        type: String,
        trim: true,
        default: "",
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please provide a valid IFSC code"],
        default: "",
      },
      bankName: {
        type: String,
        trim: true,
        default: "",
      },
    },
    revenue: {
      totalIncome: {
        type: Number,
        default: 0,
        min: [0, "Total income cannot be negative"],
      },
      incomePerCourse: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    refreshTokens: {
      type: [
        {
          token: {
            type: String,
            required: true,
          },
          expiresAt: {
            type: Date,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
// Note: username, email, and slug indexes are already created by unique: true in schema
educatorSchema.index({ specialization: 1 });
educatorSchema.index({ subject: 1 });
educatorSchema.index({ class: 1 });
educatorSchema.index({ status: 1 });
educatorSchema.index({ "rating.average": -1 });
educatorSchema.index({ fullName: "text", username: "text" });

// Pre-save middleware to hash password
educatorSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate slug
educatorSchema.pre("save", function (next) {
  if (!this.slug && this.username) {
    this.slug = this.username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Method to compare password
educatorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to generate slug from username
educatorSchema.methods.generateSlug = function () {
  return this.username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Static method to find educators by specialization
educatorSchema.statics.findBySpecialization = function (specialization) {
  return this.find({
    specialization: {
      $in: Array.isArray(specialization) ? specialization : [specialization],
    },
    status: "active",
  });
};

// Static method to find educators by subject
educatorSchema.statics.findBySubject = function (subject) {
  return this.find({
    subject: { $in: Array.isArray(subject) ? subject : [subject] },
    status: "active",
  });
};

// Static method to find educators by class
educatorSchema.statics.findByClass = function (className) {
  return this.find({
    class: { $in: Array.isArray(className) ? className : [className] },
    status: "active",
  });
};

// Static method to find educators by minimum rating
educatorSchema.statics.findByMinRating = function (minRating) {
  return this.find({
    "rating.average": { $gte: minRating },
    status: "active",
  }).sort({ "rating.average": -1 });
};

// Static method to search educators by name or username
educatorSchema.statics.searchByName = function (searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    status: "active",
  }).select("score", { score: { $meta: "textScore" } });
};

// Virtual to get follower count
educatorSchema.virtual("followerCount").get(function () {
  return this.followers.length;
});

// Virtual to get total courses count
educatorSchema.virtual("courseCount").get(function () {
  return this.courses.length;
});

// Virtual to get total webinars count
educatorSchema.virtual("webinarCount").get(function () {
  return this.webinars.length;
});

// Virtual to get total test series count
educatorSchema.virtual("testSeriesCount").get(function () {
  return this.testSeries.length;
});

// Virtual to get total tests count
educatorSchema.virtual("testCount").get(function () {
  return this.tests.length;
});

// Virtual to get total questions count
educatorSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

export default mongoose.model("Educator", educatorSchema);
