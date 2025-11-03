module.exports = {
  WORKING_HOURS: {
    START: parseInt(process.env.WORKING_HOURS_START) || 9, // 9 AM
    END: parseInt(process.env.WORKING_HOURS_END) || 18 // 6 PM
  },
  PRIORITY_ORDER: {
    High: 1,
    Medium: 2,
    Low: 3
  },
  TASK_STATUS: {
    PENDING: 'Pending',
    COMPLETED: 'Completed'
  },
  PRIORITY_LEVELS: ['High', 'Medium', 'Low']
};