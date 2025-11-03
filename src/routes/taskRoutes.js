const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const recurringTaskController = require('../controllers/recurringTaskController');
const { taskValidationRules } = require('../middleware/validators');

router.post(
  '/recurring',
  taskValidationRules.create,
  recurringTaskController.createRecurringTask
);

// Task CRUD routes
router.post(
  '/',
  taskValidationRules.create,
  taskController.createTask
);

router.get(
  '/',
  taskController.getAllTasks
);

router.get(
  '/pending',
  taskController.getPendingTasks
);

router.get(
  '/:id',
  taskValidationRules.id,
  taskController.getTaskById
);

router.put(
  '/:id',
  taskValidationRules.id,
  taskValidationRules.update,
  taskController.updateTask
);

router.delete(
  '/:id',
  taskValidationRules.id,
  taskController.deleteTask
);

module.exports = router;