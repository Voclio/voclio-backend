export const ACHIEVEMENT_CATALOG = [
  {
    type: 'first_focus',
    title: 'First Focus',
    description: 'Complete your first focus session',
    icon: '🎯',
    target: 1
  },
  {
    type: 'streak_3',
    title: '3 Day Heat',
    description: 'Maintain a 3-day focus streak',
    icon: '🔥',
    target: 3
  },
  {
    type: 'early_bird',
    title: 'Morning Bird',
    description: 'Start a session before 8:00 AM',
    icon: '🌅',
    target: 1
  },
  {
    type: 'focus_master',
    title: 'Focus Master',
    description: 'Finish a 60-minute focus session',
    icon: '👑',
    target: 60
  },
  {
    type: 'task_warrior',
    title: 'Task Warrior',
    description: 'Complete 10 tasks in one day',
    icon: '⚔️',
    target: 10
  },
  {
    type: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a session after 11:00 PM',
    icon: '🦉',
    target: 1
  }
];

export function catalogEntry(type) {
  return ACHIEVEMENT_CATALOG.find(entry => entry.type === type) || null;
}
