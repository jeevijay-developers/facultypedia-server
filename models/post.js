import mongoose from "mongoose";

const { Schema } = mongoose;

const postSchema = new Schema(
  {
    educatorId: {
      type: Schema.Types.ObjectId,
      ref: "Educator",
      required: true,
      index: true,
    },
    subject: [
      {
        type: String,
        enum: {
          values: [
            "biology",
            "physics",
            "mathematics",
            "chemistry",
            "english",
            "hindi",
          ],
          message: "{VALUE} is not a valid subject",
        },
        required: true,
        lowercase: true,
        trim: true,
      },
    ],
    specialization: [
      {
        type: String,
        enum: {
          values: ["IIT-JEE", "NEET", "CBSE"],
          message: "{VALUE} is not a valid specialization",
        },
        required: true,
        trim: true,
      },
    ],
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
      maxlength: 4000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

postSchema.index({ specialization: 1 });
postSchema.index({ subject: 1 });
postSchema.index({ title: "text", description: "text" });

export default mongoose.model("Post", postSchema);
