import Notification from "../models/notification.js";
import Educator from "../models/educator.js";
import Student from "../models/student.js";

class NotificationService {
  constructor() {
    // This will be set by the socket handler
    this.io = null;
  }

  // Set Socket.io instance
  setSocketIO(io) {
    this.io = io;
  }

  // Get socket.io instance
  getSocketIO() {
    return this.io;
  }

  // Create notification templates
  getNotificationTemplate(type, educatorName, contentData) {
    const templates = {
      course: {
        title: `New Course Launched!`,
        message: `${educatorName} has launched a new course: "${contentData.title}"`,
      },
      webinar: {
        title: `Upcoming Webinar!`,
        message: `Join ${educatorName}'s webinar "${
          contentData.title
        }" on ${this.formatDate(
          contentData.timing || contentData.scheduledDate
        )}`,
      },
      post: {
        title: `New Post!`,
        message: `${educatorName} shared: "${contentData.title}"`,
      },
      test_series: {
        title: `New Test Series Available!`,
        message: `${educatorName} has created a new test series: "${contentData.title}"`,
      },
      live_class: {
        title: `New Live Class Scheduled!`,
        message: `${educatorName} has scheduled a live class: "${
          contentData.title
        }" on ${this.formatDate(contentData.classTiming)}`,
      },
    };

    return templates[type] || { title: "New Update", message: "Check it out!" };
  }

  // Format date for display
  formatDate(date) {
    if (!date) return "soon";
    const dateObj = new Date(date);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return dateObj.toLocaleDateString("en-US", options);
  }

  // Create a single notification
  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Notify all followers of an educator
  async notifyFollowers(educatorId, type, contentData) {
    try {
      // Fetch educator with followers populated
      const educator = await Educator.findById(educatorId)
        .select("fullName username followers")
        .populate({
          path: "followers",
          select: "preferences deviceToken",
        });

      if (!educator) {
        throw new Error("Educator not found");
      }

      if (!educator.followers || educator.followers.length === 0) {
        console.log("No followers to notify");
        return { success: true, notificationsSent: 0 };
      }

      // Generate notification template
      const template = this.getNotificationTemplate(
        type,
        educator.fullName,
        contentData
      );

      // Prepare metadata based on type
      const metadata = {
        contentTitle: contentData.title,
        contentSlug: contentData.slug,
      };

      if (type === "course") {
        metadata.courseId = contentData._id;
      } else if (type === "webinar") {
        metadata.webinarId = contentData._id;
        metadata.scheduledDate =
          contentData.timing || contentData.scheduledDate;
      } else if (type === "post") {
        metadata.postId = contentData._id;
      } else if (type === "test_series") {
        metadata.testSeriesId = contentData._id;
      } else if (type === "live_class") {
        metadata.liveClassId = contentData._id;
        metadata.scheduledDate = contentData.classTiming;
      }

      // Create notifications for all followers
      const notifications = [];
      const onlineStudents = [];

      for (const follower of educator.followers) {
        // Check if student has push notifications enabled
        const pushEnabled = follower.preferences?.notifications?.push !== false;

        if (!pushEnabled) {
          console.log(
            `Push notifications disabled for student: ${follower._id}`
          );
          continue;
        }

        // Create notification in database
        const notification = await this.createNotification({
          recipient: follower._id,
          sender: educatorId,
          type,
          title: template.title,
          message: template.message,
          metadata,
        });

        notifications.push(notification);

        // Check if student is online and emit real-time notification
        if (this.io) {
          const studentSocketId = this.getSocketIdByUserId(
            follower._id.toString()
          );
          if (studentSocketId) {
            this.io.to(studentSocketId).emit("notification", {
              type,
              notification: {
                _id: notification._id,
                title: template.title,
                message: template.message,
                type,
                metadata,
                isRead: false,
                createdAt: notification.createdAt,
                sender: {
                  _id: educatorId,
                  fullName: educator.fullName,
                  username: educator.username,
                },
              },
            });

            // Mark as delivered
            notification.deliveredAt = new Date();
            await notification.save();

            onlineStudents.push(follower._id);
          }
        }
      }

      console.log(
        `Sent ${notifications.length} notifications (${onlineStudents.length} delivered in real-time)`
      );

      return {
        success: true,
        notificationsSent: notifications.length,
        deliveredInRealTime: onlineStudents.length,
        notifications,
      };
    } catch (error) {
      console.error("Error notifying followers:", error);
      throw error;
    }
  }

  // Get socket ID by user ID (this will be maintained by socket handler)
  getSocketIdByUserId(userId) {
    if (!this.io) return null;

    // Access the userSockets Map from the socket handler
    const userSockets = this.io.userSockets || new Map();
    return userSockets.get(userId);
  }

  // Get notifications for a student
  async getNotificationsByStudent(studentId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false, type = null } = options;

      const filter = { recipient: studentId };

      if (unreadOnly) {
        filter.isRead = false;
      }

      if (type) {
        filter.type = type;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const notifications = await Notification.find(filter)
        .populate("sender", "fullName username profilePicture slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalNotifications = await Notification.countDocuments(filter);
      const totalPages = Math.ceil(totalNotifications / parseInt(limit));

      return {
        success: true,
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalNotifications,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(studentId) {
    try {
      const count = await Notification.getUnreadCount(studentId);
      return { success: true, unreadCount: count };
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, studentId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: studentId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.isRead) {
        return {
          success: true,
          message: "Notification already read",
          notification,
        };
      }

      await notification.markAsRead();

      return {
        success: true,
        message: "Notification marked as read",
        notification,
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(studentId) {
    try {
      const result = await Notification.markAllAsRead(studentId);

      return {
        success: true,
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, studentId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: studentId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      return { success: true, message: "Notification deleted" };
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Clean up old notifications (can be run as a cron job)
  async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications();
      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
      throw error;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
