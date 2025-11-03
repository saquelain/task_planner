const { WORKING_HOURS } = require('../config/constants');

/**
 * Get working hours for a specific date
 */
const getWorkingHoursForDate = (date) => {
  const workStart = new Date(date);
  workStart.setHours(WORKING_HOURS.START, 0, 0, 0);
  
  const workEnd = new Date(date);
  workEnd.setHours(WORKING_HOURS.END, 0, 0, 0);
  
  return { workStart, workEnd };
};

/**
 * Check if a time slot overlaps with existing slots
 */
const hasOverlap = (newStart, newEnd, existingSlots) => {
  return existingSlots.some(slot => {
    const slotStart = new Date(slot.startTime);
    const slotEnd = new Date(slot.endTime);
    
    // Check for overlap: new task starts before existing ends AND new task ends after existing starts
    return newStart < slotEnd && newEnd > slotStart;
  });
};

/**
 * Find available time slot for a task
 */
const findAvailableSlot = (taskDuration, deadline, occupiedSlots, startFrom) => {
  const deadlineDate = new Date(deadline);
  let currentDate = new Date(startFrom);
  currentDate.setHours(WORKING_HOURS.START, 0, 0, 0);
  
  // Try to fit task within available days until deadline
  while (currentDate <= deadlineDate) {
    const { workStart, workEnd } = getWorkingHoursForDate(currentDate);
    
    // Skip if we're past the deadline
    if (workStart > deadlineDate) {
      break;
    }
    
    // Get occupied slots for this day
    const daySlotsOccupied = occupiedSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate.toDateString() === currentDate.toDateString();
    });
    
    // Sort occupied slots by start time
    daySlotsOccupied.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Try to find a gap
    let searchStart = new Date(Math.max(workStart.getTime(), startFrom.getTime()));
    
    for (let i = 0; i <= daySlotsOccupied.length; i++) {
      let gapEnd;
      
      if (i === daySlotsOccupied.length) {
        // Check gap until end of working hours
        gapEnd = new Date(Math.min(workEnd.getTime(), deadlineDate.getTime()));
      } else {
        // Check gap until next occupied slot
        gapEnd = new Date(daySlotsOccupied[i].startTime);
      }
      
      const availableMinutes = (gapEnd - searchStart) / (1000 * 60);
      
      // If gap is large enough for the task
      if (availableMinutes >= taskDuration) {
        const taskStart = new Date(searchStart);
        const taskEnd = new Date(searchStart.getTime() + taskDuration * 60 * 1000);
        
        // Ensure task ends within working hours and before deadline
        if (taskEnd <= workEnd && taskEnd <= deadlineDate) {
          return { startTime: taskStart, endTime: taskEnd };
        }
      }
      
      // Move search start to after this occupied slot
      if (i < daySlotsOccupied.length) {
        searchStart = new Date(daySlotsOccupied[i].endTime);
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(WORKING_HOURS.START, 0, 0, 0);
  }
  
  return null; // No available slot found
};

/**
 * Calculate total idle time in a schedule
 */
const calculateIdleTime = (allocatedSlots) => {
  if (allocatedSlots.length === 0) return 0;
  
  // Group by date
  const slotsByDate = {};
  allocatedSlots.forEach(slot => {
    const dateKey = new Date(slot.startTime).toDateString();
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    slotsByDate[dateKey].push(slot);
  });
  
  let totalIdleMinutes = 0;
  
  // Calculate idle time for each day
  Object.keys(slotsByDate).forEach(dateKey => {
    const daySlots = slotsByDate[dateKey].sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    // Calculate gaps between consecutive tasks
    for (let i = 0; i < daySlots.length - 1; i++) {
      const gapMinutes = (new Date(daySlots[i + 1].startTime) - new Date(daySlots[i].endTime)) / (1000 * 60);
      if (gapMinutes > 0) {
        totalIdleMinutes += gapMinutes;
      }
    }
  });
  
  return totalIdleMinutes;
};

/**
 * Format time slot for display
 */
const formatTimeSlot = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return {
    date: start.toDateString(),
    startTime: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    endTime: end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    duration: Math.round((end - start) / (1000 * 60)) + ' minutes'
  };
};

module.exports = {
  getWorkingHoursForDate,
  hasOverlap,
  findAvailableSlot,
  calculateIdleTime,
  formatTimeSlot
};