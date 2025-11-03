const notificationService = require('../services/notificationService');

/**
 * Get all notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { includeRead } = req.query;
    const notifications = await notificationService.getAllNotifications(
      includeRead === 'true'
    );
    
    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Generate reminders for upcoming tasks
 */
const triggerReminders = async (req, res) => {
  try {
    const reminders = await notificationService.generateReminders();
    
    res.status(200).json({
      status: 'success',
      message: `Generated ${reminders.length} reminders`,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Check for overdue tasks
 */
const checkOverdue = async (req, res) => {
  try {
    const notifications = await notificationService.checkOverdueTasks();
    
    res.status(200).json({
      status: 'success',
      message: `Found ${notifications.length} overdue tasks`,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Mark notification as read
 */
const markRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getNotifications,
  triggerReminders,
  checkOverdue,
  markRead
};