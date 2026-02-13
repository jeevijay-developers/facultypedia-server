import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function assignVideosToCoreCourse() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URL or MONGODB_URI is missing in .env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    // Import models
    const Video = mongoose.model("Video");
    const Course = mongoose.model("Course");
    const Educator = mongoose.model("Educator");

    // Find the IIT JEE Mastery course
    const course = await Course.findOne({
      title: { $regex: "IIT JEE Mastery", $options: "i" },
    });

    if (!course) {
      console.log("❌ Course 'IIT JEE Mastery: Conceptual Clarity to Rank Excellence' not found");
      console.log("\nSearching for all courses to help identify the correct one...");
      const allCourses = await Course.find({}, "title _id").limit(10);
      console.log("Available courses:");
      allCourses.forEach((c) => console.log(`  - ${c.title} (ID: ${c._id})`));
      return;
    }

    console.log(`\n✓ Found course: ${course.title}`);
    console.log(`  Course ID: ${course._id}`);
    console.log(`  Educator ID: ${course.educatorID}`);

    // Get the educator for this course
    const educatorId = course.educatorID;

    // Video titles from the screenshot
    const videoTitles = [
      "How to Build Authentication with Supabase Auth + Next.js 16 (Full Step-by-Step Tutorial)",
      "React Authentication - Sign In With Google (Supabase)",
      "Supabase Full Course 2025 Hindi | Become a Supabase Master in Just 1.8 Hours!",
    ];

    console.log("\n📹 Looking for videos to assign...");

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const title of videoTitles) {
      // Try exact match first
      let video = await Video.findOne({ title: title });

      // If not found, try fuzzy match (first few words)
      if (!video) {
        const firstWords = title.split(" ").slice(0, 5).join(" ");
        video = await Video.findOne({
          title: { $regex: firstWords, $options: "i" },
        });
      }

      if (video) {
        // Check current assignment
        const wasAssigned = video.isCourseSpecific && video.courseId;
        const isSameCourse = wasAssigned && video.courseId.toString() === course._id.toString();

        if (isSameCourse) {
          console.log(`  ✓ "${video.title}" - Already assigned to this course`);
          
          // Ensure educatorID is set
          if (!video.educatorID && educatorId) {
            video.educatorID = educatorId;
            await video.save();
            console.log(`    (Added educator ID)`);
          }
        } else {
          // Update video to assign it to the course
          video.isCourseSpecific = true;
          video.courseId = course._id;
          if (!video.educatorID && educatorId) {
            video.educatorID = educatorId;
          }
          await video.save();
          
          updatedCount++;
          console.log(`  ✓ "${video.title}" - Assigned to course`);
          if (wasAssigned) {
            console.log(`    (Previously assigned to: ${video.courseId})`);
          }
        }
      } else {
        notFoundCount++;
        console.log(`  ❌ "${title}" - Not found in database`);
      }
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(`  ✓ Videos assigned: ${updatedCount}`);
    console.log(`  ❌ Videos not found: ${notFoundCount}`);

    // Verify the assignment
    console.log("\n🔍 Verifying assignment...");
    const assignedVideos = await Video.find({
      isCourseSpecific: true,
      courseId: course._id,
    });

    console.log(`Found ${assignedVideos.length} videos assigned to "${course.title}":`);
    assignedVideos.forEach((video, index) => {
      console.log(`  ${index + 1}. ${video.title}`);
    });

    console.log("\n✅ Done!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✓ MongoDB connection closed");
  }
}

// Run the script
assignVideosToCoreCourse();
