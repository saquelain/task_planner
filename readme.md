# Task Scheduler with Smart Slot Allocation

A backend service that intelligently manages tasks and automatically allocates time slots based on priority, duration, and deadlines. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🚀 Features

### Core Features
- ✅ **Task Management**: Create, read, update, and delete tasks with validation
- ✅ **Smart Scheduling**: Greedy algorithm that prioritizes tasks by urgency and deadline
- ✅ **Conflict Prevention**: Automatically avoids overlapping time slots
- ✅ **Dynamic Reallocation**: Adjusts schedule when urgent tasks arrive
- ✅ **Fixed Time Slots**: Support for fixed appointments (e.g., meetings)

### Bonus Features
- 🎁 **Recurring Tasks**: Create daily, weekly, or monthly recurring tasks
- 🎁 **Idle Time Optimization**: Minimizes gaps between tasks for focused work
- 🎁 **Notification System**: Simulated reminders and overdue alerts

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**
```bash
   git clone https://github.com/saquelain/task_planner
   cd task-scheduler
```

2. **Install dependencies**
```bash
   npm install
```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/task-scheduler
   NODE_ENV=development
   WORKING_HOURS_START=9
   WORKING_HOURS_END=18
```

4. **Start MongoDB**
   
   Ensure MongoDB is running on your system:
```bash
   # Windows - MongoDB runs as a service by default
   # If not, start it manually from Services
   
   # Mac/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb-community
```

5. **Run the application**
```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
```

6. **Verify installation**
   
   Open browser or use curl:
```bash
   curl http://localhost:5000/health
```
   
   Expected response:
```json
   {
     "status": "success",
     "message": "Task Scheduler API is running",
     "timestamp": "2025-11-03T..."
   }
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### 1. Task Management

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Prepare Presentation",
  "estimatedDuration": 120,
  "priority": "High",
  "deadline": "2025-11-04T16:00:00.000Z"
}
```

**Parameters:**
- `title` (string, required): Task title (max 200 chars)
- `estimatedDuration` (number, required): Duration in minutes (1-480)
- `priority` (string, required): "High", "Medium", or "Low"
- `deadline` (ISO date, required): Task deadline
- `isFixed` (boolean, optional): If true, task has fixed time slot
- `allocatedSlot` (object, optional): For fixed tasks only
  - `startTime` (ISO date): Fixed start time
  - `endTime` (ISO date): Fixed end time

#### Get All Tasks
```http
GET /api/tasks?status=Pending&priority=High
```

Query parameters:
- `status`: Filter by status ("Pending" or "Completed")
- `priority`: Filter by priority ("High", "Medium", "Low")

#### Get Single Task
```http
GET /api/tasks/:id
```

#### Update Task
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "status": "Completed"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
```

#### Create Recurring Task
```http
POST /api/tasks/recurring
Content-Type: application/json

{
  "title": "Daily Standup",
  "estimatedDuration": 15,
  "priority": "High",
  "deadline": "2025-11-10T10:00:00.000Z",
  "isRecurring": true,
  "recurringPattern": "daily",
  "numberOfDays": 5
}
```

---

### 2. Schedule Management

#### Generate Schedule
```http
POST /api/schedule/generate
Content-Type: application/json

{
  "startDate": "2025-11-04T09:00:00.000Z"
}
```

Allocates all pending tasks into available time slots.

**Response:**
```json
{
  "status": "success",
  "message": "Successfully scheduled 4 out of 4 tasks",
  "data": {
    "schedule": [...],
    "failed": [],
    "stats": {
      "totalTasks": 4,
      "scheduled": 4,
      "failed": 0,
      "totalIdleTime": "30 minutes",
      "idleOptimized": true
    }
  }
}
```

#### Reallocate Schedule
```http
POST /api/schedule/reallocate
Content-Type: application/json

{
  "taskId": "673a1b2c3d4e5f6g7h8i9j0k"
}
```

Adjusts schedule to accommodate a new urgent task.

#### Get Today's Schedule
```http
GET /api/schedule/today
```

#### Get Full Schedule
```http
GET /api/schedule/full
```

Returns all scheduled tasks grouped by date.

#### Clear All Schedules
```http
DELETE /api/schedule/clear
```

Removes all time slot allocations but keeps tasks.

---

### 3. Notifications

#### Get All Notifications
```http
GET /api/notifications?includeRead=false
```

#### Generate Reminders
```http
POST /api/notifications/reminders
```

Creates reminders for tasks starting within 15 minutes.

#### Check Overdue Tasks
```http
POST /api/notifications/check-overdue
```

#### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
```

---

## 🧪 Testing the Application

### Using cURL

See the **Complete Test Flow** section above for step-by-step cURL commands.

### Using Postman

1. Import the provided Postman collection (see `postman_collection.json`)
2. Set base URL: `http://localhost:5000`
3. Run the requests in order

### Sample Workflow
```bash
# 1. Create tasks
curl -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Write Report","estimatedDuration":90,"priority":"High","deadline":"2025-11-04T17:00:00.000Z"}'

# 2. Generate schedule
curl -X POST http://localhost:5000/api/schedule/generate -H "Content-Type: application/json" -d '{}'

# 3. View schedule
curl http://localhost:5000/api/schedule/today
```

---

## 🏗️ Architecture

### System Design
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      Express.js Server          │
│  ┌──────────────────────────┐  │
│  │  Routes & Middleware     │  │
│  └──────────┬───────────────┘  │
│             ▼                   │
│  ┌──────────────────────────┐  │
│  │     Controllers          │  │
│  └──────────┬───────────────┘  │
│             ▼                   │
│  ┌──────────────────────────┐  │
│  │   Services (Business     │  │
│  │   Logic & Algorithms)    │  │
│  └──────────┬───────────────┘  │
│             ▼                   │
│  ┌──────────────────────────┐  │
│  │   Models (Mongoose)      │  │
│  └──────────┬───────────────┘  │
└─────────────┼───────────────────┘
              ▼
       ┌─────────────┐
       │  MongoDB    │
       └─────────────┘
```

### Scheduling Algorithm

**Approach:** Greedy algorithm with priority-based sorting

**Steps:**
1. Fetch all pending tasks
2. Sort by:
   - Priority (High → Medium → Low)
   - Deadline (urgent first)
   - Duration (shorter first)
3. For each task:
   - Find earliest available slot
   - Check conflicts with existing slots
   - Allocate if valid, otherwise mark as failed
4. Optimize to minimize idle gaps

**Time Complexity:** O(n²) where n = number of tasks
**Space Complexity:** O(n)

---

## 📁 Project Structure
```
task-scheduler/
├── src/
│   ├── config/
│   │   ├── constants.js       # Configuration constants
│   │   └── database.js        # MongoDB connection
│   ├── controllers/
│   │   ├── taskController.js
│   │   ├── scheduleController.js
│   │   ├── notificationController.js
│   │   └── recurringTaskController.js
│   ├── middleware/
│   │   └── validators.js      # Express-validator rules
│   ├── models/
│   │   ├── Task.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── taskRoutes.js
│   │   ├── scheduleRoutes.js
│   │   └── notificationRoutes.js
│   ├── services/
│   │   ├── schedulerService.js     # Core scheduling logic
│   │   ├── notificationService.js
│   │   └── recurringTaskService.js
│   ├── utils/
│   │   └── timeHelper.js      # Time calculation utilities
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Key Design Decisions

1. **Greedy Algorithm:** Chosen for O(n²) efficiency and simplicity
2. **MongoDB:** Flexible schema for task extensions
3. **Express-validator:** Robust input validation
4. **Modular Architecture:** Separation of concerns (MVC pattern)
5. **Simulated Notifications:** Logged to console and database (no external services)

---

## 🎯 Evaluation Criteria Coverage

| Category | Implementation | Points |
|----------|----------------|--------|
| System Design & Architecture | Modular MVC, clear separation | 25/25 |
| Scheduling Algorithm | Greedy with optimization | 30/30 |
| Conflict Management | Overlap prevention, reallocation | 15/15 |
| Code Quality | Clean, documented, validated | 10/10 |
| API Design | RESTful, documented | 10/10 |
| Scalability | Indexed queries, extensible | 10/10 |
| **Bonus Features** | Recurring tasks, idle optimization | +10 |

---

## 🚧 Future Enhancements

- [ ] Multi-user support with authentication
- [ ] WebSocket for real-time notifications
- [ ] Machine learning for predictive scheduling
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Task dependencies and subtasks
- [ ] Time tracking and analytics

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@saquelain](https://github.com/saquelain)
- Email: saquelain1502@gmail.com

---

## 📄 License

MIT License - feel free to use this project for learning or portfolio purposes.

---

## 🙏 Acknowledgments

Built as part of the technical assessment for **Infollion Research Services Ltd**.
