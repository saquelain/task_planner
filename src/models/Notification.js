const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    type: {
      type: String,
      enum: ['reminder', 'overdue', 'rescheduled', 'upcoming'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    scheduledFor: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
notificationSchema.index({ taskId: 1, type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;