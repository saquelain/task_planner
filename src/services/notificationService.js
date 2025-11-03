const Notification = require('../models/Notification');
const Task = require('../models/Task');

/**
 * Create notification for a task
 */
const createNotification = async (taskId, type, message, scheduledFor) => {
  try {
    const notification = new Notification({
      taskId,
      type,
      message,
      scheduledFor
    });
    
    await notification.save();
    
    // Simulate notification (log to console)
    console.log(`📢 [${type.toUpperCase()}] ${message}`);
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Generate reminder notifications for upcoming tasks
 */
const generateReminders = async () => {
  try {
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
    
    // Find tasks starting in next 15 minutes
    const upcomingTasks = await Task.find({
      status: 'Pending',
      'allocatedSlot.startTime': {
        $gte: now,
        $lte: fifteenMinutesLater
      }
    });
    
    const notifications = [];
    
    for (const task of upcomingTasks) {
      const message = `Task "${task.title}" is starting in 15 minutes at ${task.allocatedSlot.startTime.toLocaleTimeString()}`;
      
      const notification = await createNotification(
        task._id,
        'reminder',
        message,
        task.allocatedSlot.startTime
      );
      
      if (notification) {
        notifications.push(notification);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Failed to generate reminders:', error.message);
    return [];
  }
};

/**
 * Check for overdue tasks and create notifications
 */
const checkOverdueTasks = async () => {
  try {
    const now = new Date();
    
    // Find overdue tasks
    const overdueTasks = await Task.find({
      status: 'Pending',
      deadline: { $lt: now }
    });
    
    const notifications = [];
    
    for (const task of overdueTasks) {
      const message = `Task "${task.title}" is overdue! Deadline was ${task.deadline.toLocaleString()}`;
      
      const notification = await createNotification(
        task._id,
        'overdue',
        message,
        now
      );
      
      if (notification) {
        notifications.push(notification);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Failed to check overdue tasks:', error.message);
    return [];
  }
};

/**
 * Notify when task is rescheduled
 */
const notifyRescheduled = async (taskId, oldSlot, newSlot) => {
  try {
    const task = await Task.findById(taskId);
    
    if (!task) return null;
    
    const message = `Task "${task.title}" has been rescheduled from ${new Date(oldSlot.startTime).toLocaleString()} to ${new Date(newSlot.startTime).toLocaleString()}`;
    
    return await createNotification(
      taskId,
      'rescheduled',
      message,
      new Date()
    );
  } catch (error) {
    console.error('Failed to create reschedule notification:', error.message);
    return null;
  }
};

/**
 * Get all notifications
 */
const getAllNotifications = async (includeRead = false) => {
  try {
    const filter = includeRead ? {} : { isRead: false };
    
    const notifications = await Notification.find(filter)
      .populate('taskId', 'title priority status')
      .sort({ createdAt: -1 });
    
    return notifications;
  } catch (error) {
    throw new Error(`Failed to get notifications: ${error.message}`);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    return notification;
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

module.exports = {
  createNotification,
  generateReminders,
  checkOverdueTasks,
  notifyRescheduled,
  getAllNotifications,
  markAsRead
};