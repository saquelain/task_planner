const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Task Scheduler API is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Task Scheduler API - Available Endpoints',
    version: '1.0.0',
    endpoints: {
      tasks: {
        'POST /api/tasks': 'Create a new task',
        'GET /api/tasks': 'Get all tasks (query: status, priority)',
        'GET /api/tasks/pending': 'Get all pending tasks sorted',
        'GET /api/tasks/:id': 'Get task by ID',
        'PUT /api/tasks/:id': 'Update task',
        'DELETE /api/tasks/:id': 'Delete task',
        'POST /api/tasks/recurring': 'Create recurring task'
      },
      schedule: {
        'POST /api/schedule/generate': 'Generate schedule for all pending tasks',
        'POST /api/schedule/reallocate': 'Reallocate schedule for new task',
        'GET /api/schedule/today': 'Get today\'s schedule',
        'GET /api/schedule/full': 'Get full schedule (all allocated tasks)',
        'DELETE /api/schedule/clear': 'Clear all schedules'
      },
      notifications: {
        'GET /api/notifications': 'Get all notifications (query: includeRead)',
        'POST /api/notifications/reminders': 'Generate reminders for upcoming tasks',
        'POST /api/notifications/check-overdue': 'Check for overdue tasks',
        'PATCH /api/notifications/:id/read': 'Mark notification as read'
      }
    }
  });
});

// API Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);

// Development utility: Clear all data
app.delete('/api/dev/clear-all', async (req, res) => {
  try {
    const Task = require('./models/Task');
    const Notification = require('./models/Notification');
    
    await Task.deleteMany({});
    await Notification.deleteMany({});
    
    res.status(200).json({
      status: 'success',
      message: 'All data cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

module.exports = app;