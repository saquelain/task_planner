const recurringTaskService = require('../services/recurringTaskService');
const Task = require('../models/Task');

/**
 * Create recurring task and generate instances
 */
const createRecurringTask = async (req, res) => {
  try {
    const { numberOfDays = 7 } = req.body;
    
    // Create the main recurring task
    const recurringTask = new Task(req.body);
    await recurringTask.save();
    
    // Generate instances
    const result = await recurringTaskService.createRecurringInstances(
      recurringTask,
      numberOfDays
    );
    
    res.status(201).json({
      status: 'success',
      message: result.message,
      data: {
        recurringTask: recurringTask,
        instances: result.instances
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createRecurringTask
};