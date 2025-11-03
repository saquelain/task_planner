const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get all notifications
router.get('/', notificationController.getNotifications);

// Trigger reminder generation
router.post('/reminders', notificationController.triggerReminders);

// Check for overdue tasks
router.post('/check-overdue', notificationController.checkOverdue);

// Mark notification as read
router.patch('/:id/read', notificationController.markRead);

module.exports = router;