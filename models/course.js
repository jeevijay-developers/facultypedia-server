import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  courseType: {
    type: String,
    required: true,
    enum: ["OTO", "OTA"], // One-to-One, One-to-All
    default: "OTA",
  },
  educatorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Educator",
    required: true,
  },
  specialization: [
    {
      type: String,
      enum: ["IIT-JEE", "NEET", "CBSE"],
      required: true,
    },
  ],
  class: [
    {
      type: String,
      enum: [
        "class-6th",
        "class-7th",
        "class-8th",
        "class-9th",
        "class-10th",
        "class-11th",
        "class-12th",
        "dropper",
      ],
      required: true,
    },
  ],
  subject: [
    {
      type: String,
      enum: [
        "biology",
        "physics",
        "mathematics",
        "chemistry",
        "english",
        "hindi",
      ],
      required: true,
    },
  ],
  fees: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  image: {
    type: String,
    required: false,
    trim: true,
  },
  courseThumbnail: {
    type: String,
    required: false,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  courseDuration: {
    type: String,
    required: true,
    trim: true,
  },
  validDate: {
    type: Date,
    required: true,
  },
  videos: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      link: {
        type: String,
        required: true,
        trim: true,
      },
      duration: {
        type: String,
        trim: true,
      },
      sequenceNumber: {
        type: Number,
        required: true,
      },
    },
  ],
  introVideo: {
    type: String,
    required: false,
    trim: true,
  },
  studyMaterials: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      link: {
        type: String,
        required: true,
        trim: true,
      },
      fileType: {
        type: String,
        enum: ["PDF", "DOC", "PPT", "EXCEL", "OTHER"],
        default: "PDF",
      },
    },
  ],
  courseObjectives: [
    {
      type: String,
      trim: true,
      maxlength: 500,
    },
  ],
  prerequisites: [
    {
      type: String,
      trim: true,
      maxlength: 500,
    },
  ],
  language: {
    type: String,
    default: "English",
    trim: true,
  },
  certificateAvailable: {
    type: Boolean,
    default: false,
  },
  maxStudents: {
    type: Number,
    min: 1,
    default: 100,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  purchase: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  liveClass: [
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
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for better performance
courseSchema.index({ educatorID: 1 });
courseSchema.index({ specialization: 1 });
courseSchema.index({ subject: 1 });
courseSchema.index({ class: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ startDate: 1 });
courseSchema.index({ endDate: 1 });
courseSchema.index({ fees: 1 });

// Pre-save middleware to update the updatedAt field
courseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to generate slug if not provided
courseSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("title")) {
    this.slug = this.generateSlug();
  }
  next();
});

// Method to generate slug from title
courseSchema.methods.generateSlug = function () {
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${baseSlug}-${Date.now()}`;
};

// Static method to find courses by educator
courseSchema.statics.findByEducator = function (educatorId) {
  return this.find({ educatorID: educatorId, isActive: true });
};

// Static method to find courses by specialization
courseSchema.statics.findBySpecialization = function (specialization) {
  return this.find({ specialization: specialization, isActive: true });
};

// Static method to find courses by subject
courseSchema.statics.findBySubject = function (subject) {
  return this.find({ subject: subject, isActive: true });
};

// Static method to find courses by class
courseSchema.statics.findByClass = function (className) {
  return this.find({ class: className, isActive: true });
};

// Static method to find courses by minimum rating
courseSchema.statics.findByMinRating = function (minRating) {
  return this.find({ rating: { $gte: minRating }, isActive: true });
};

// Static method to find courses within date range
courseSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
    isActive: true,
  });
};

// Static method to find ongoing courses
courseSchema.statics.findOngoing = function () {
  const now = new Date();
  return this.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
  });
};

// Static method to find upcoming courses
courseSchema.statics.findUpcoming = function () {
  return this.find({
    startDate: { $gt: new Date() },
    isActive: true,
  }).sort({ startDate: 1 });
};

// Virtual to get enrolled student count
courseSchema.virtual("enrolledCount").get(function () {
  return this.enrolledStudents.length;
});

// Virtual to get purchase count
courseSchema.virtual("purchaseCount").get(function () {
  return this.purchase.length;
});

// Virtual to check if course is full
courseSchema.virtual("isFull").get(function () {
  return this.enrolledStudents.length >= this.maxStudents;
});

// Virtual to get seats available
courseSchema.virtual("seatsAvailable").get(function () {
  return this.maxStudents - this.enrolledStudents.length;
});

// Virtual to calculate discounted price
courseSchema.virtual("discountedPrice").get(function () {
  return this.fees - (this.fees * this.discount) / 100;
});

// Virtual to check if course is ongoing
courseSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Virtual to check if course is completed
courseSchema.virtual("isCompleted").get(function () {
  return this.endDate < new Date();
});

// Virtual to check if course is upcoming
courseSchema.virtual("isUpcoming").get(function () {
  return this.startDate > new Date();
});

// Virtual to check if course access is valid
courseSchema.virtual("isAccessValid").get(function () {
  return this.validDate >= new Date();
});

// Virtual to get total video count
courseSchema.virtual("videoCount").get(function () {
  return this.videos.length;
});

// Virtual to get total live class count
courseSchema.virtual("liveClassCount").get(function () {
  return this.liveClass.length;
});

// Virtual to get total test series count
courseSchema.virtual("testSeriesCount").get(function () {
  return this.testSeries.length;
});

// Ensure virtual fields are included in JSON output
courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

export default mongoose.model("Course", courseSchema);
