const { body, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Task validation rules
const taskValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('estimatedDuration')
      .isInt({ min: 1, max: 480 })
      .withMessage('Duration must be between 1 and 480 minutes'),
    
    body('priority')
      .isIn(['High', 'Medium', 'Low'])
      .withMessage('Priority must be High, Medium, or Low'),
    
    body('deadline')
      .isISO8601()
      .withMessage('Deadline must be a valid date')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('Deadline cannot be in the past');
        }
        return true;
      }),
    
    body('isFixed')
      .optional()
      .isBoolean()
      .withMessage('isFixed must be a boolean'),
    
    body('isRecurring')
      .optional()
      .isBoolean()
      .withMessage('isRecurring must be a boolean'),
    
    body('recurringPattern')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Recurring pattern must be daily, weekly, or monthly'),
    
    handleValidationErrors
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    
    body('estimatedDuration')
      .optional()
      .isInt({ min: 1, max: 480 })
      .withMessage('Duration must be between 1 and 480 minutes'),
    
    body('priority')
      .optional()
      .isIn(['High', 'Medium', 'Low'])
      .withMessage('Priority must be High, Medium, or Low'),
    
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    
    body('status')
      .optional()
      .isIn(['Pending', 'Completed'])
      .withMessage('Status must be Pending or Completed'),
    
    body('isFixed')
      .optional()
      .isBoolean()
      .withMessage('isFixed must be a boolean'),
    
    handleValidationErrors
  ],

  id: [
    param('id')
      .isMongoId()
      .withMessage('Invalid task ID'),
    
    handleValidationErrors
  ]
};

module.exports = {
  taskValidationRules,
  handleValidationErrors
};