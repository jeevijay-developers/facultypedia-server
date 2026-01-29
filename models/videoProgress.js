import mongoose from 'mongoose';

const videoProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    // videoId can be either embedded video URL/link or Video model _id
    videoId: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique progress entry per student-course-video
videoProgressSchema.index(
  { studentId: 1, courseId: 1, videoId: 1 },
  { unique: true }
);

// Index for efficient querying by student and course
videoProgressSchema.index({ studentId: 1, courseId: 1 });

export default mongoose.model('VideoProgress', videoProgressSchema);
