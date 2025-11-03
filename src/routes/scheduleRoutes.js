const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Generate schedule for all pending tasks
router.post('/generate', scheduleController.generateSchedule);

// Reallocate schedule when new urgent task arrives
router.post('/reallocate', scheduleController.reallocateSchedule);

// Get today's schedule
router.get('/today', scheduleController.getTodaySchedule);

// Get full schedule (all allocated tasks)
router.get('/full', scheduleController.getFullSchedule);

// Clear all schedules
router.delete('/clear', scheduleController.clearSchedule);

module.exports = router;