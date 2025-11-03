const Task = require('../models/Task');

/**
 * Generate instances of recurring tasks
 */
const generateRecurringInstances = async (task, numberOfDays = 7) => {
  if (!task.isRecurring || !task.recurringPattern) {
    return [];
  }

  const instances = [];
  const baseDate = new Date();
  
  for (let i = 1; i <= numberOfDays; i++) {
    let nextDate = new Date(baseDate);
    
    switch (task.recurringPattern) {
      case 'daily':
        nextDate.setDate(baseDate.getDate() + i);
        break;
      
      case 'weekly':
        nextDate.setDate(baseDate.getDate() + (i * 7));
        break;
      
      case 'monthly':
        nextDate.setMonth(baseDate.getMonth() + i);
        break;
      
      default:
        continue;
    }
    
    // Set deadline to end of that day
    const deadline = new Date(nextDate);
    deadline.setHours(18, 0, 0, 0);
    
    instances.push({
      title: `${task.title} (${nextDate.toDateString()})`,
      estimatedDuration: task.estimatedDuration,
      priority: task.priority,
      deadline: deadline,
      status: 'Pending',
      isFixed: false,
      isRecurring: false, // Individual instances are not recurring
      parentTaskId: task._id
    });
  }
  
  return instances;
};

/**
 * Create recurring task instances in database
 */
const createRecurringInstances = async (recurringTask, numberOfDays = 7) => {
  try {
    const instances = await generateRecurringInstances(recurringTask, numberOfDays);
    
    if (instances.length === 0) {
      return { success: false, message: 'No recurring pattern defined' };
    }
    
    // Create all instances
    const createdTasks = await Task.insertMany(instances);
    
    return {
      success: true,
      message: `Created ${createdTasks.length} instances of recurring task`,
      instances: createdTasks
    };
  } catch (error) {
    throw new Error(`Failed to create recurring instances: ${error.message}`);
  }
};

module.exports = {
  generateRecurringInstances,
  createRecurringInstances
};