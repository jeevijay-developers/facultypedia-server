# Fix Video Assignment to Course

This guide helps you assign videos to the "IIT JEE Mastery: Conceptual Clarity to Rank Excellence" course.

## Problem

Videos are showing as assigned to the course in the dashboard, but the database doesn't have the correct assignment. This script will:
1. Find the target course in the database
2. Locate the 3 videos mentioned in your screenshot
3. Assign them to the course by setting `isCourseSpecific: true` and `courseId`
4. Add `educatorID` to videos if missing

## Changes Made to Backend

### 1. Updated Video Model
Added `educatorID` field to the Video schema so videos can be filtered by educator.

**File**: `models/video.js`
- Added `educatorID` field (ObjectId reference to Educator)

### 2. Updated Video Controller
Modified video creation and retrieval to handle `educatorID`.

**File**: `controllers/video.controller.js`
- `createVideo`: Now accepts and saves `educatorID` from request
- `getVideos`: Now populates both `courseId` and `educatorID` for better data display

## How to Run the Fix Script

### Method 1: Using Node.js (Recommended)

```bash
cd facultypedia-server
node scripts/assign_videos_to_course.js
```

### What the Script Does

1. **Connects to MongoDB** using your environment variables
2. **Finds the course** "IIT JEE Mastery: Conceptual Clarity to Rank Excellence"
3. **Searches for videos** matching these titles:
   - "How to Build Authentication with Supabase Auth + Next.js 16 (Full Step-by-Step Tutorial)"
   - "React Authentication - Sign In With Google (Supabase)"
   - "Supabase Full Course 2025 Hindi | Become a Supabase Master in Just 1.8 Hours!"
4. **Updates each video** to:
   - Set `isCourseSpecific: true`
   - Set `courseId` to the found course ID
   - Add `educatorID` from the course's educator
5. **Verifies** all videos are correctly assigned

### Expected Output

```
Connecting to MongoDB...
✓ Connected to MongoDB

✓ Found course: IIT JEE Mastery: Conceptual Clarity to Rank Excellence
  Course ID: 65a1b2c3d4e5f6g7h8i9j0k1
  Educator ID: 65a1b2c3d4e5f6g7h8i9j0k2

📹 Looking for videos to assign...
  ✓ "How to Build Authentication with Supabase Auth + Next.js 16 (Full Step-by-Step Tutorial)" - Assigned to course
  ✓ "React Authentication - Sign In With Google (Supabase)" - Assigned to course
  ✓ "Supabase Full Course 2025 Hindi | Become a Supabase Master in Just 1.8 Hours!" - Assigned to course

📊 Summary:
  ✓ Videos assigned: 3
  ❌ Videos not found: 0

🔍 Verifying assignment...
Found 3 videos assigned to "IIT JEE Mastery: Conceptual Clarity to Rank Excellence":
  1. How to Build Authentication with Supabase Auth + Next.js 16 (Full Step-by-Step Tutorial)
  2. React Authentication - Sign In With Google (Supabase)
  3. Supabase Full Course 2025 Hindi | Become a Supabase Master in Just 1.8 Hours!

✅ Done!

✓ MongoDB connection closed
```

## Method 2: Manual MongoDB Query (Alternative)

If you prefer to update manually using MongoDB Compass or mongosh:

```javascript
// 1. Find the course ID
db.courses.findOne(
  { title: /IIT JEE Mastery/i },
  { _id: 1, title: 1, educatorID: 1 }
);

// 2. Get the course ID and educator ID from above, then update videos
const courseId = ObjectId("YOUR_COURSE_ID_HERE");
const educatorId = ObjectId("YOUR_EDUCATOR_ID_HERE");

// 3. Update each video by title
db.videos.updateOne(
  { title: /How to Build Authentication with Supabase Auth/i },
  {
    $set: {
      isCourseSpecific: true,
      courseId: courseId,
      educatorID: educatorId
    }
  }
);

db.videos.updateOne(
  { title: /React Authentication - Sign In With Google/i },
  {
    $set: {
      isCourseSpecific: true,
      courseId: courseId,
      educatorID: educatorId
    }
  }
);

db.videos.updateOne(
  { title: /Supabase Full Course 2025 Hindi/i },
  {
    $set: {
      isCourseSpecific: true,
      courseId: courseId,
      educatorID: educatorId
    }
  }
);

// 4. Verify the assignment
db.videos.find(
  { isCourseSpecific: true, courseId: courseId },
  { title: 1, courseId: 1, educatorID: 1 }
);
```

## After Running the Script

1. **Restart your backend server** to apply the model changes:
   ```bash
   cd facultypedia-server
   npm run dev
   ```

2. **Refresh your dashboard** in the browser

3. **Verify the assignment** in the Videos page - all 3 videos should now be correctly assigned

## Troubleshooting

### "Course not found"
- The script will list all available courses
- Try searching for the course by a different part of its name

### "Video not found"
- Video titles in the database might be slightly different
- The script uses fuzzy matching (first 5 words) to find videos
- You can manually check video titles in your database

### Videos still not showing correctly
- Make sure you restarted the backend server
- Clear browser cache and refresh
- Check the browser console for any API errors

## Future Prevention

When creating new videos through the dashboard:
1. Make sure to include `educatorID` in the request
2. Set `isCourseSpecific: true` if assigning to a specific course
3. Include the `courseId` when creating course-specific videos

The updated backend code now handles this automatically when you use the "Assign to Course" feature in the Videos page.
