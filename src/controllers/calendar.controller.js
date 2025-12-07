const TaskModel = require('../models/task.model');
const ReminderModel = require('../models/reminder.model');
const { successResponse } = require('../utils/responses');
const { ValidationError } = require('../utils/errors');

class CalendarController {
  static async getCalendarEvents(req, res, next) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        throw new ValidationError('start_date and end_date are required');
      }

      // Get tasks within date range
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const filteredTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= new Date(start_date) && dueDate <= new Date(end_date);
      });

      // Get reminders within date range
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const filteredReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= new Date(start_date) && reminderDate <= new Date(end_date);
      });

      // Format events for calendar
      const events = [
        ...filteredTasks.map(task => ({
          id: `task-${task.task_id}`,
          type: 'task',
          title: task.title,
          description: task.description,
          date: task.due_date,
          priority: task.priority,
          status: task.status,
          category_id: task.category_id,
          allDay: false
        })),
        ...filteredReminders.map(reminder => ({
          id: `reminder-${reminder.reminder_id}`,
          type: 'reminder',
          title: reminder.title || 'Reminder',
          date: reminder.reminder_time,
          reminder_type: reminder.reminder_type,
          task_id: reminder.task_id,
          allDay: false
        }))
      ];

      // Sort by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      return successResponse(res, {
        events,
        period: { start_date, end_date },
        count: events.length,
        tasks_count: filteredTasks.length,
        reminders_count: filteredReminders.length
      });

    } catch (error) {
      next(error);
    }
  }

  static async getMonthCalendar(req, res, next) {
    try {
      const { year, month } = req.params;

      if (!year || !month) {
        throw new ValidationError('Year and month are required');
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (monthNum < 1 || monthNum > 12) {
        throw new ValidationError('Month must be between 1 and 12');
      }

      // Calculate start and end of month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

      const start_date = startDate.toISOString();
      const end_date = endDate.toISOString();

      // Get tasks
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const monthTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= startDate && dueDate <= endDate;
      });

      // Get reminders
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const monthReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= startDate && reminderDate <= endDate;
      });

      // Group events by day
      const eventsByDay = {};
      
      monthTasks.forEach(task => {
        const day = new Date(task.due_date).getDate();
        if (!eventsByDay[day]) {
          eventsByDay[day] = { tasks: [], reminders: [], count: 0 };
        }
        eventsByDay[day].tasks.push({
          task_id: task.task_id,
          title: task.title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date
        });
        eventsByDay[day].count++;
      });

      monthReminders.forEach(reminder => {
        const day = new Date(reminder.reminder_time).getDate();
        if (!eventsByDay[day]) {
          eventsByDay[day] = { tasks: [], reminders: [], count: 0 };
        }
        eventsByDay[day].reminders.push({
          reminder_id: reminder.reminder_id,
          title: reminder.title || 'Reminder',
          reminder_time: reminder.reminder_time,
          task_id: reminder.task_id
        });
        eventsByDay[day].count++;
      });

      return successResponse(res, {
        year: yearNum,
        month: monthNum,
        month_name: new Date(yearNum, monthNum - 1).toLocaleString('en', { month: 'long' }),
        days_in_month: endDate.getDate(),
        events_by_day: eventsByDay,
        total_events: monthTasks.length + monthReminders.length,
        tasks_count: monthTasks.length,
        reminders_count: monthReminders.length
      });

    } catch (error) {
      next(error);
    }
  }

  static async getDayEvents(req, res, next) {
    try {
      const { date } = req.params;

      if (!date) {
        throw new ValidationError('Date is required');
      }

      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get tasks for the day
      const tasks = await TaskModel.findAll(req.user.user_id, {});
      const dayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= startOfDay && dueDate <= endOfDay;
      });

      // Get reminders for the day
      const reminders = await ReminderModel.findAll(req.user.user_id, {});
      const dayReminders = reminders.filter(reminder => {
        const reminderDate = new Date(reminder.reminder_time);
        return reminderDate >= startOfDay && reminderDate <= endOfDay;
      });

      return successResponse(res, {
        date,
        tasks: dayTasks,
        reminders: dayReminders,
        total_events: dayTasks.length + dayReminders.length
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = CalendarController;
