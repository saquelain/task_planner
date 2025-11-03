const Task = require('../models/Task');
const { findAvailableSlot, calculateIdleTime } = require('../utils/timeHelper');

/**
 * Optimize task order to minimize idle gaps
 */
const optimizeTaskOrder = (tasks) => {
  // Group tasks by priority
  const highPriority = tasks.filter(t => t.priority === 'High');
  const mediumPriority = tasks.filter(t => t.priority === 'Medium');
  const lowPriority = tasks.filter(t => t.priority === 'Low');
  
  // Within each priority group, sort by duration (shorter first to fill gaps)
  const sortByDuration = (a, b) => a.estimatedDuration - b.estimatedDuration;
  
  highPriority.sort(sortByDuration);
  mediumPriority.sort(sortByDuration);
  lowPriority.sort(sortByDuration);
  
  // Combine back: High -> Medium -> Low
  return [...highPriority, ...mediumPriority, ...lowPriority];
};

/**
 * Main scheduling algorithm - Greedy approach with idle optimization
 */
const generateSchedule = async (startDate = new Date(), optimizeIdle = true) => {
  try {
    // Get all pending tasks sorted by priority and deadline
    let pendingTasks = await Task.getPendingTasksSorted();
    
    if (pendingTasks.length === 0) {
      return {
        success: true,
        message: 'No pending tasks to schedule',
        scheduled: [],
        failed: []
      };
    }
    
    // Apply idle optimization if enabled (Bonus feature)
    if (optimizeIdle) {
      pendingTasks = optimizeTaskOrder(pendingTasks);
    }
    
    // Clear existing allocations for pending tasks
    await Task.updateMany(
      { status: 'Pending' },
      { 
        $set: { 
          'allocatedSlot.startTime': null,
          'allocatedSlot.endTime': null
        }
      }
    );
    
    const scheduledTasks = [];
    const failedTasks = [];
    const occupiedSlots = [];
    
    // First, get all fixed time slots (meetings)
    const fixedTasks = pendingTasks.filter(task => task.isFixed && task.isAllocated());
    fixedTasks.forEach(task => {
      occupiedSlots.push({
        startTime: task.allocatedSlot.startTime,
        endTime: task.allocatedSlot.endTime
      });
    });
    
    // Schedule each task
    for (const task of pendingTasks) {
      // Skip fixed tasks as they already have slots
      if (task.isFixed && task.isAllocated()) {
        scheduledTasks.push(task);
        continue;
      }
      
      // Find available slot
      const slot = findAvailableSlot(
        task.estimatedDuration,
        task.deadline,
        occupiedSlots,
        startDate
      );
      
      if (slot) {
        // Allocate the slot
        task.allocatedSlot.startTime = slot.startTime;
        task.allocatedSlot.endTime = slot.endTime;
        await task.save();
        
        // Add to occupied slots
        occupiedSlots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          taskId: task._id
        });
        
        scheduledTasks.push(task);
      } else {
        failedTasks.push({
          task: task,
          reason: 'No available time slot before deadline'
        });
      }
    }
    
    // Calculate idle time (Bonus feature)
    const idleMinutes = calculateIdleTime(occupiedSlots);
    
    return {
      success: true,
      message: `Successfully scheduled ${scheduledTasks.length} out of ${pendingTasks.length} tasks`,
      scheduled: scheduledTasks,
      failed: failedTasks,
      stats: {
        totalTasks: pendingTasks.length,
        scheduled: scheduledTasks.length,
        failed: failedTasks.length,
        totalIdleTime: `${idleMinutes} minutes`,
        idleOptimized: optimizeIdle
      }
    };
    
  } catch (error) {
    throw new Error(`Scheduling failed: ${error.message}`);
  }
};

/**
 * Reallocate schedule when a new urgent task is added
 */
const reallocateSchedule = async (newTaskId) => {
  try {
    const newTask = await Task.findById(newTaskId);
    
    if (!newTask) {
      throw new Error('Task not found');
    }
    
    if (newTask.status !== 'Pending') {
      throw new Error('Only pending tasks can be scheduled');
    }
    
    // Get all allocated tasks
    const allocatedTasks = await Task.find({
      status: 'Pending',
      'allocatedSlot.startTime': { $ne: null }
    });
    
    // Get occupied slots
    const occupiedSlots = allocatedTasks
      .filter(task => task._id.toString() !== newTaskId.toString())
      .map(task => ({
        startTime: task.allocatedSlot.startTime,
        endTime: task.allocatedSlot.endTime,
        taskId: task._id,
        priority: task.priority
      }));
    
    // Try to fit the new task
    const slot = findAvailableSlot(
      newTask.estimatedDuration,
      newTask.deadline,
      occupiedSlots,
      new Date()
    );
    
    if (slot) {
      // Simple case: new task fits without conflicts
      newTask.allocatedSlot.startTime = slot.startTime;
      newTask.allocatedSlot.endTime = slot.endTime;
      await newTask.save();
      
      return {
        success: true,
        message: 'Task scheduled successfully without conflicts',
        task: newTask,
        rescheduled: []
      };
    } else {
      // Complex case: need to bump lower priority tasks
      // If new task is high priority, regenerate entire schedule
      if (newTask.priority === 'High') {
        const result = await generateSchedule(new Date(), true); // With optimization
        return {
          success: true,
          message: 'Schedule regenerated to accommodate high priority task',
          task: newTask,
          rescheduled: result.scheduled.filter(t => t._id.toString() !== newTaskId.toString())
        };
      } else {
        return {
          success: false,
          message: 'Unable to schedule task without affecting higher priority tasks',
          task: newTask,
          suggestion: 'Consider extending working hours or adjusting deadline'
        };
      }
    }
    
  } catch (error) {
    throw new Error(`Reallocation failed: ${error.message}`);
  }
};

/**
 * Get today's schedule
 */
const getTodaySchedule = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await Task.find({
      status: 'Pending',
      'allocatedSlot.startTime': {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ 'allocatedSlot.startTime': 1 });
    
    return tasks;
  } catch (error) {
    throw new Error(`Failed to get today's schedule: ${error.message}`);
  }
};

module.exports = {
  generateSchedule,
  reallocateSchedule,
  getTodaySchedule
};