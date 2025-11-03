const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: [true, 'Estimated duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [480, 'Duration cannot exceed 8 hours (480 minutes)']
    },
    priority: {
      type: String,
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: '{VALUE} is not a valid priority'
      },
      required: [true, 'Priority is required'],
      default: 'Medium'
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required']
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Pending'
    },
    isFixed: {
      type: Boolean,
      default: false, // true for fixed appointments like meetings
      required: false
    },
    allocatedSlot: {
      startTime: {
        type: Date,
        default: null
      },
      endTime: {
        type: Date,
        default: null
      }
    },
    // For recurring tasks (Bonus feature)
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', null],
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Index for efficient queries
taskSchema.index({ status: 1, deadline: 1, priority: 1 });

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed') return false;
  return this.deadline < new Date();
});

// Method to check if task is allocated
taskSchema.methods.isAllocated = function () {
  return this.allocatedSlot.startTime !== null && this.allocatedSlot.endTime !== null;
};

// Method to clear allocation
taskSchema.methods.clearAllocation = function () {
  this.allocatedSlot.startTime = null;
  this.allocatedSlot.endTime = null;
};

// Static method to get pending tasks sorted by priority and deadline
taskSchema.statics.getPendingTasksSorted = async function () {
  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  
  const tasks = await this.find({ status: 'Pending' });
  
  return tasks.sort((a, b) => {
    // First sort by priority
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by deadline (earlier first)
    if (a.deadline.getTime() !== b.deadline.getTime()) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    // Finally by duration (shorter first for flexibility)
    return a.estimatedDuration - b.estimatedDuration;
  });
};

// Ensure virtuals are included in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;