# Feature Ideas Notification System

## Overview
This document outlines the notification system for feature updates, including email notifications and in-app notifications.

## Notification Types

### 1. Feature Status Updates
- **Trigger**: When admin changes feature status (suggested → in_progress → done)
- **Recipients**: Feature author + subscribers
- **Channels**: Email + In-app

### 2. New Comments
- **Trigger**: When someone comments on a feature
- **Recipients**: Feature author + subscribers (excluding commenter)
- **Channels**: In-app (email optional)

### 3. Admin Responses
- **Trigger**: When admin adds a comment or admin note
- **Recipients**: Feature author + subscribers
- **Channels**: Email + In-app

### 4. Feature Completion
- **Trigger**: When feature status changes to "done"
- **Recipients**: All users who voted for the feature
- **Channels**: Email + In-app

## Implementation Guide

### Backend Service (Node.js)

```javascript
// services/NotificationService.js
class NotificationService {
  
  // Send notification when feature status changes
  async notifyStatusChange(featureId, oldStatus, newStatus, adminId) {
    const feature = await this.getFeature(featureId);
    const subscribers = await this.getFeatureSubscribers(featureId);
    
    const notification = {
      type: 'status_changed',
      title: `Feature "${feature.title}" is now ${newStatus.replace('_', ' ')}`,
      message: this.getStatusMessage(feature, oldStatus, newStatus),
      feature_id: featureId
    };

    // Send to all subscribers
    for (const subscriber of subscribers) {
      await this.createNotification(subscriber.user_id, notification);
      
      if (subscriber.notify_email) {
        await this.sendEmail(subscriber, notification, feature);
      }
    }

    // Special handling for completion
    if (newStatus === 'done') {
      await this.notifyFeatureCompletion(featureId);
    }
  }

  // Send notification to all voters when feature is completed
  async notifyFeatureCompletion(featureId) {
    const feature = await this.getFeature(featureId);
    const voters = await this.getFeatureVoters(featureId);
    
    const notification = {
      type: 'feature_completed',
      title: `✅ Feature you voted for is now live!`,
      message: `"${feature.title}" has been completed and is now available.`,
      feature_id: featureId
    };

    for (const voter of voters) {
      await this.createNotification(voter.user_id, notification);
      await this.sendCompletionEmail(voter, feature);
    }
  }

  // Create in-app notification
  async createNotification(userId, notification) {
    return await db.query(`
      INSERT INTO feature_notifications 
      (user_id, feature_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, notification.feature_id, notification.type, 
        notification.title, notification.message]);
  }

  // Send email notification
  async sendEmail(subscriber, notification, feature) {
    const emailContent = this.generateEmailContent(notification, feature);
    
    await emailService.send({
      to: subscriber.email,
      subject: notification.title,
      html: emailContent,
      template: 'feature-update',
      data: {
        feature,
        notification,
        subscriber,
        unsubscribe_url: `${process.env.BASE_URL}/unsubscribe/${subscriber.token}`
      }
    });
  }
}
```

### Email Templates

```html
<!-- templates/feature-update.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{notification.title}}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3c72; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .feature-title { color: #1e3c72; font-size: 1.2em; margin-bottom: 10px; }
    .status-badge { display: inline-block; padding: 5px 10px; border-radius: 15px; font-size: 0.8em; font-weight: bold; }
    .status-done { background: #d4edda; color: #155724; }
    .status-progress { background: #fff3cd; color: #856404; }
    .button { display: inline-block; padding: 12px 24px; background: #61dafb; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 BandVenueReview.ie</h1>
      <p>Feature Update Notification</p>
    </div>
    
    <div class="content">
      <h2>{{notification.title}}</h2>
      
      <div class="feature-title">{{feature.title}}</div>
      <span class="status-badge status-{{feature.status}}">{{feature.status}}</span>
      
      <p>{{notification.message}}</p>
      
      {{#if feature.admin_notes}}
      <div style="background: #e9ecef; padding: 15px; border-left: 4px solid #61dafb; margin: 20px 0;">
        <strong>Admin Note:</strong><br>
        {{feature.admin_notes}}
      </div>
      {{/if}}
      
      <p style="margin-top: 30px;">
        <a href="{{base_url}}/features/{{feature.id}}" class="button">
          View Feature Details
        </a>
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you're subscribed to updates for this feature.</p>
      <p>
        <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a> |
        <a href="{{base_url}}/settings/notifications" style="color: #666;">Manage Notifications</a>
      </p>
    </div>
  </div>
</body>
</html>
```

### React Notification Component

```javascript
// components/NotificationCenter.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Set up real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/notifications?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = await user.getIdToken();
      await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await user.getIdToken();
      await fetch('/api/user/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-center">
      <button
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <a href="/features" onClick={() => setIsOpen(false)}>
              View all features
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const getNotificationIcon = (type) => {
  const icons = {
    feature_completed: '✅',
    status_changed: '🔄',
    new_comment: '💬',
    admin_response: '👨‍💼'
  };
  return icons[type] || '📢';
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export default NotificationCenter;
```

## Recommended Libraries

### Email Service
- **SendGrid** or **Mailgun** for reliable email delivery
- **Nodemailer** for development/testing
- **Handlebars** for email templates

### Real-time Notifications
- **Socket.io** for real-time in-app notifications
- **Push.js** for browser push notifications
- **Service Workers** for offline notification support

### Notification Management
- **React Query** for efficient data fetching and caching
- **React Hot Toast** for toast notifications
- **React Notification System** for advanced notification UI

## Setup Instructions

1. **Email Configuration**:
   ```javascript
   // config/email.js
   const emailConfig = {
     service: 'sendgrid', // or 'mailgun'
     apiKey: process.env.EMAIL_API_KEY,
     from: 'noreply@bandvenuereview.ie',
     templates: {
       feature_update: 'feature-update-template-id',
       feature_completion: 'feature-completion-template-id'
     }
   };
   ```

2. **Environment Variables**:
   ```
   EMAIL_API_KEY=your-email-service-api-key
   BASE_URL=https://bandvenuereview.ie
   NOTIFICATION_SECRET=your-notification-secret
   ```

3. **Database Indexes**:
   ```sql
   CREATE INDEX idx_notifications_user_unread ON feature_notifications(user_id, is_read);
   CREATE INDEX idx_notifications_created ON feature_notifications(created_at DESC);
   ```

This notification system will keep users engaged and informed about the features they care about!
