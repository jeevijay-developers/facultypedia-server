import mongoose from "mongoose";

const { Schema } = mongoose;

const MAX_LINK_LENGTH = 500;

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    links: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: MAX_LINK_LENGTH,
        },
      ],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one video link is required",
      },
    },
    educatorID: {
      type: Schema.Types.ObjectId,
      ref: "Educator",
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "Educator",
      required: true,
      index: true,
    },
    isCourseSpecific: {
      type: Boolean,
      default: false,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required() {
        const hasArrayIds = Array.isArray(this.courseIds) && this.courseIds.length > 0;
        return this.isCourseSpecific && !hasArrayIds;
      },
      index: true,
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        index: true,
      },
    ],
    default: [],
  },
  {
    timestamps: true,
  }
);

videoSchema.index({ title: "text" });

export default mongoose.model("Video", videoSchema);
