import mongoose from "mongoose";

const REVIEWABLE_TYPES = ["course", "webinar", "testSeries"];

const reviewSchema = new mongoose.Schema(
  {
    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Educator",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    itemType: {
      type: String,
      enum: REVIEWABLE_TYPES,
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ student: 1, itemType: 1, itemId: 1 }, { unique: true });
reviewSchema.index({ educator: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
