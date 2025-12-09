# Live Notification System - Implementation Complete

## Overview

A real-time notification system using WebSocket (Socket.io) that notifies students when educators they follow create new content (courses, webinars, posts, test series).

## Architecture

### Backend Components Created

1. **Notification Model** (`models/notification.js`)

   - Stores notification history
   - Fields: recipient, sender, type, title, message, metadata, isRead, timestamps
   - Indexes for performance optimization

2. **Notification Service** (`services/notification.service.js`)

   - Business logic for creating and managing notifications
   - Template generation for different notification types
   - Integration with Socket.io for real-time delivery

3. **Socket Authentication Middleware** (`middleware/socket.auth.middleware.js`)

   - Verifies JWT tokens in WebSocket handshake
   - Attaches user data to socket connection
   - Role-based access control

4. **Socket Handlers** (`sockets/notification.socket.js`)

   - Manages WebSocket connections at `/notifications` namespace
   - Maintains user-to-socket mapping
   - Handles events: mark_as_read, mark_all_as_read, get_notifications

5. **Notification Controller** (`controllers/notification.controller.js`)

   - REST API endpoints for notification management
   - CRUD operations for notifications

6. **Notification Routes** (`routes/notification.route.js`)

   - RESTful endpoints for notifications

7. **Integration Hooks** (Updated Controllers)
   - `course.controller.js` - Notifies on course creation
   - `webinar.controller.js` - Notifies on webinar creation
   - `post.controller.js` - Notifies on post creation
   - `testSeries.controller.js` - Notifies on test series creation

## API Endpoints

### REST API

#### Get Notifications

```
GET /api/notifications/:studentId
Query Params:
  - page (default: 1)
  - limit (default: 20)
  - unreadOnly (boolean)
  - type (course|webinar|post|test_series)
```

#### Get Unread Count

```
GET /api/notifications/:studentId/unread-count
```

#### Mark as Read

```
PUT /api/notifications/:id/read
Body: { studentId: ObjectId }
```

#### Mark All as Read

```
PUT /api/notifications/:studentId/read-all
```

#### Delete Notification

```
DELETE /api/notifications/:id
Body: { studentId: ObjectId }
```

#### Cleanup Old Notifications (Admin)

```
POST /api/notifications/cleanup
```

### WebSocket Events

**Namespace:** `/notifications`

#### Client → Server Events

1. **Authentication**

   ```javascript
   // Sent during handshake
   socket.auth = { token: "your-jwt-token" };
   // OR
   socket.io.opts.query = { token: "your-jwt-token" };
   ```

2. **Mark as Read**

   ```javascript
   socket.emit("mark_as_read", { notificationId: "xxx" });
   ```

3. **Mark All as Read**

   ```javascript
   socket.emit("mark_all_as_read");
   ```

4. **Get Notifications**
   ```javascript
   socket.emit("get_notifications", {
     page: 1,
     limit: 20,
     unreadOnly: false,
     type: "course",
   });
   ```

#### Server → Client Events

1. **Connected**

   ```javascript
   socket.on("connected", (data) => {
     console.log(data.message, data.userId);
   });
   ```

2. **Unread Count**

   ```javascript
   socket.on("unread_count", (data) => {
     console.log("Unread:", data.count);
   });
   ```

3. **New Notification**

   ```javascript
   socket.on("notification", (data) => {
     console.log("New notification:", data.notification);
     // data.type: 'course' | 'webinar' | 'post' | 'test_series'
     // data.notification: { _id, title, message, metadata, sender, ... }
   });
   ```

4. **Notification Read**

   ```javascript
   socket.on("notification_read", (data) => {
     console.log("Marked as read:", data.notificationId);
   });
   ```

5. **All Notifications Read**

   ```javascript
   socket.on("all_notifications_read", (data) => {
     console.log(data.message, data.modifiedCount);
   });
   ```

6. **Notifications List**

   ```javascript
   socket.on("notifications_list", (data) => {
     console.log("Notifications:", data.notifications);
     console.log("Pagination:", data.pagination);
   });
   ```

7. **Error**
   ```javascript
   socket.on("error", (data) => {
     console.error("Error:", data.message);
   });
   ```

## Client-Side Integration Examples

### React Example

```javascript
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

function NotificationSystem() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get JWT token from your auth context/storage
    const token = localStorage.getItem("accessToken");

    // Connect to socket
    const newSocket = io("http://localhost:5000/notifications", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    // Connection success
    newSocket.on("connected", (data) => {
      console.log("Connected to notifications:", data.message);
    });

    // Listen for unread count
    newSocket.on("unread_count", (data) => {
      setUnreadCount(data.count);
    });

    // Listen for new notifications
    newSocket.on("notification", (data) => {
      console.log("New notification:", data.notification);

      // Add to notifications list
      setNotifications((prev) => [data.notification, ...prev]);

      // Show toast/alert
      showNotificationToast(data.notification);

      // Update unread count
      setUnreadCount((prev) => prev + 1);
    });

    // Handle errors
    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = (notificationId) => {
    socket?.emit("mark_as_read", { notificationId });
  };

  const markAllAsRead = () => {
    socket?.emit("mark_all_as_read");
    setUnreadCount(0);
  };

  const showNotificationToast = (notification) => {
    // Implement your toast/notification UI
    alert(`${notification.title}\n${notification.message}`);
  };

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map((notif) => (
        <div key={notif._id} onClick={() => markAsRead(notif._id)}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          {!notif.isRead && <span>NEW</span>}
        </div>
      ))}
      <button onClick={markAllAsRead}>Mark All as Read</button>
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
// Connect to notification socket
const token = localStorage.getItem("accessToken");
const socket = io("http://localhost:5000/notifications", {
  auth: { token },
  transports: ["websocket", "polling"],
});

// Connection established
socket.on("connected", (data) => {
  console.log("Connected:", data.message);
});

// Listen for new notifications
socket.on("notification", (data) => {
  const { notification } = data;

  // Update UI
  displayNotification(notification);

  // Update badge count
  updateBadgeCount();

  // Play sound or show browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.message,
      icon: "/logo.png",
    });
  }
});

// Listen for unread count
socket.on("unread_count", (data) => {
  document.getElementById("notif-badge").textContent = data.count;
});

// Mark notification as read
function markAsRead(notificationId) {
  socket.emit("mark_as_read", { notificationId });
}

// Mark all as read
function markAllAsRead() {
  socket.emit("mark_all_as_read");
}

// Get notifications
function loadNotifications(page = 1) {
  socket.emit("get_notifications", { page, limit: 20 });
}

// Listen for notifications list
socket.on("notifications_list", (data) => {
  displayNotificationsList(data.notifications);
  setupPagination(data.pagination);
});
```

### Next.js Example with Context

```javascript
// contexts/NotificationContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext"; // Your auth context

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { accessToken, user } = useAuth();

  useEffect(() => {
    if (!accessToken || user?.role !== "student") return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connected", () => {
      console.log("Notification socket connected");
    });

    newSocket.on("unread_count", (data) => {
      setUnreadCount(data.count);
    });

    newSocket.on("notification", (data) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast.success(data.notification.title);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [accessToken, user]);

  const markAsRead = (notificationId) => {
    socket?.emit("mark_as_read", { notificationId });
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    socket?.emit("mark_all_as_read");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
```

## Notification Templates

### Course Notification

```
Title: "New Course Launched!"
Message: "{educatorName} has launched a new course: "{courseTitle}""
```

### Webinar Notification

```
Title: "Upcoming Webinar!"
Message: "Join {educatorName}'s webinar "{webinarTitle}" on {date}"
```

### Post Notification

```
Title: "New Post!"
Message: "{educatorName} shared: "{postTitle}""
```

### Test Series Notification

```
Title: "New Test Series Available!"
Message: "{educatorName} has created a new test series: "{testSeriesTitle}""
```

## Security Considerations

1. **JWT Authentication**: All WebSocket connections require valid JWT tokens
2. **Role-Based Access**: Only students can connect to notification namespace
3. **Authorization**: Students can only access their own notifications
4. **CORS**: Configured to allow only specified origins
5. **Token Expiry**: Expired tokens are rejected at connection time

## Performance Optimizations

1. **Indexes**: Database indexes on recipient, sender, type, isRead, createdAt
2. **Pagination**: REST API supports pagination to limit data transfer
3. **Targeted Emission**: Notifications sent only to connected students
4. **Async Processing**: Notification sending doesn't block content creation
5. **Cleanup Job**: Automatic cleanup of old read notifications (30+ days)

## Testing

### Test WebSocket Connection

```javascript
// In browser console
const socket = io("http://localhost:5000/notifications", {
  auth: { token: "your-jwt-token-here" },
});

socket.on("connected", (data) => console.log("Connected:", data));
socket.on("notification", (data) => console.log("Notification:", data));
socket.on("connect_error", (err) => console.error("Error:", err.message));
```

### Test REST API

```bash
# Get notifications
curl http://localhost:5000/api/notifications/{studentId}

# Get unread count
curl http://localhost:5000/api/notifications/{studentId}/unread-count

# Mark as read
curl -X PUT http://localhost:5000/api/notifications/{notificationId}/read \
  -H "Content-Type: application/json" \
  -d '{"studentId": "xxx"}'
```

## Future Enhancements

1. **Push Notifications**: Integrate Firebase Cloud Messaging for mobile push
2. **Email Notifications**: Send email for offline users
3. **Redis Adapter**: Scale across multiple servers
4. **Notification Preferences**: Per-category notification settings
5. **Batch Notifications**: Group multiple notifications from same educator
6. **Read Receipts**: Track when notifications are actually viewed
7. **Priority Levels**: Urgent vs normal notifications
8. **Rich Media**: Support images/videos in notifications

## Troubleshooting

### Connection Issues

- Ensure JWT token is valid and not expired
- Check CORS configuration matches your frontend URL
- Verify Socket.io client version compatibility
- Check network/firewall settings

### Notifications Not Received

- Confirm student is following the educator
- Check student's notification preferences (push enabled)
- Verify WebSocket connection is established
- Check browser console for errors

### Performance Issues

- Run cleanup job regularly to remove old notifications
- Consider pagination for large notification lists
- Implement virtual scrolling for notification UI
- Use Redis adapter for multiple server instances

## Support

For issues or questions, check:

- Server logs for error messages
- Browser console for client-side errors
- MongoDB for notification records
- Socket.io documentation: https://socket.io/docs/
