const schedulerService = require('../services/schedulerService');
const Task = require('../models/Task');
const { formatTimeSlot } = require('../utils/timeHelper');

/**
 * Generate schedule for all pending tasks
 */
const generateSchedule = async (req, res) => {
  try {
    const { startDate } = req.body;
    const start = startDate ? new Date(startDate) : new Date();
    
    const result = await schedulerService.generateSchedule(start);
    
    // Format the response
    const formattedSchedule = result.scheduled.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority,
      duration: task.estimatedDuration + ' minutes',
      deadline: task.deadline,
      slot: task.isAllocated() 
        ? formatTimeSlot(task.allocatedSlot.startTime, task.allocatedSlot.endTime)
        : null
    }));
    
    const formattedFailed = result.failed.map(item => ({
      id: item.task._id,
      title: item.task.title,
      priority: item.task.priority,
      deadline: item.task.deadline,
      reason: item.reason
    }));
    
    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        schedule: formattedSchedule,
        failed: formattedFailed,
        stats: result.stats
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Reallocate schedule when new task is added
 */
const reallocateSchedule = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({
        status: 'error',
        message: 'Task ID is required'
      });
    }
    
    const result = await schedulerService.reallocateSchedule(taskId);
    
    res.status(200).json({
      status: result.success ? 'success' : 'warning',
      message: result.message,
      data: {
        newTask: {
          id: result.task._id,
          title: result.task.title,
          slot: result.task.isAllocated()
            ? formatTimeSlot(result.task.allocatedSlot.startTime, result.task.allocatedSlot.endTime)
            : null
        },
        rescheduledTasks: result.rescheduled ? result.rescheduled.length : 0,
        suggestion: result.suggestion || null
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get today's schedule
 */
const getTodaySchedule = async (req, res) => {
  try {
    const tasks = await schedulerService.getTodaySchedule();
    
    const formattedSchedule = tasks.map(task => ({
      id: task._id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      duration: task.estimatedDuration + ' minutes',
      slot: formatTimeSlot(task.allocatedSlot.startTime, task.allocatedSlot.endTime),
      isOverdue: task.isOverdue
    }));
    
    res.status(200).json({
      status: 'success',
      results: formattedSchedule.length,
      data: formattedSchedule
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get full schedule (all allocated tasks)
 */
const getFullSchedule = async (req, res) => {
  try {
    const tasks = await Task.find({
      status: 'Pending',
      'allocatedSlot.startTime': { $ne: null }
    }).sort({ 'allocatedSlot.startTime': 1 });
    
    // Group by date
    const scheduleByDate = {};
    
    tasks.forEach(task => {
      const dateKey = new Date(task.allocatedSlot.startTime).toDateString();
      
      if (!scheduleByDate[dateKey]) {
        scheduleByDate[dateKey] = [];
      }
      
      scheduleByDate[dateKey].push({
        id: task._id,
        title: task.title,
        priority: task.priority,
        duration: task.estimatedDuration + ' minutes',
        slot: formatTimeSlot(task.allocatedSlot.startTime, task.allocatedSlot.endTime),
        isFixed: task.isFixed
      });
    });
    
    res.status(200).json({
      status: 'success',
      data: scheduleByDate
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Clear all schedules (reset allocations)
 */
const clearSchedule = async (req, res) => {
  try {
    await Task.updateMany(
      { status: 'Pending' },
      { 
        $set: { 
          'allocatedSlot.startTime': null,
          'allocatedSlot.endTime': null
        }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'All schedules cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  generateSchedule,
  reallocateSchedule,
  getTodaySchedule,
  getFullSchedule,
  clearSchedule
};