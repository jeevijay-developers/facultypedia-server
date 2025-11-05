import mongoose from "mongoose";


const webinarSchema = new mongoose.Schema({
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
    maxlength: 1000,
  },
  webinarType: {
    type: String,
    required: true,
    enum: ["one-to-one", "one-to-all"],
    default: "one-to-all",
  },
  timing: {
    type: Date,
    required: true,
  },
  subject: [
    {
      type: String,
      enum: ["Physics", "Biology", "Mathematics", "Chemistry", "Hindi"],
      required: true,
    },
  ],
  fees: {
    type: Number,
    required: true,
    min: 0,
  },
  duration: {
    type: String,
    required: true,
    trim: true,
  },
  specialization: [
    {
      type: String,
      enum: ["IIT-JEE", "NEET", "CBSE"],
      required: true,
    },
  ],
  seatLimit: {
    type: Number,
    required: true,
    min: 1,
    max: 1000,
  },
  class: [
    {
      type: String,
      enum: [
        "Class 6th",
        "Class 7th",
        "Class 8th",
        "Class 9th",
        "Class 10th",
        "Class 11th",
        "Class 12th",
        "Dropper",
      ],
      required: true,
    },
  ],
  image: {
    type: String,
    required: false,
    trim: true,
  },
  educatorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Educator",
    required: true,
  },
  studentEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  webinarLink: {
    type: String,
    required: false,
    trim: true,
  },
  assetsLink: [
    {
      type: String,
      trim: true,
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

// Create index for better performance
// Note: slug index is already created by unique: true in schema
webinarSchema.index({ timing: 1 });
webinarSchema.index({ educatorID: 1 });
webinarSchema.index({ subject: 1 });
webinarSchema.index({ specialization: 1 });

// Pre-save middleware to update the updatedAt field
webinarSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate slug from title
webinarSchema.methods.generateSlug = function () {
  return this.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Static method to find webinars by educator
webinarSchema.statics.findByEducator = function (educatorId) {
  return this.find({ educatorID: educatorId, isActive: true });
};

// Static method to find upcoming webinars
webinarSchema.statics.findUpcoming = function () {
  return this.find({
    timing: { $gte: new Date() },
    isActive: true,
  }).sort({ timing: 1 });
};

// Virtual to get enrolled student count
webinarSchema.virtual("enrolledCount").get(function () {
  return this.studentEnrolled.length;
});

// Virtual to check if seats are available
webinarSchema.virtual("seatsAvailable").get(function () {
  return this.seatLimit - this.studentEnrolled.length;
});

// Virtual to check if webinar is full
webinarSchema.virtual("isFull").get(function () {
  return this.studentEnrolled.length >= this.seatLimit;
});

// Ensure virtual fields are included in JSON output
webinarSchema.set("toJSON", { virtuals: true });
webinarSchema.set("toObject", { virtuals: true });

export default mongoose.model("Webinar", webinarSchema);
