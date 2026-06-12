import {
  parseArabicDate,
  parseArabicTime,
  combineDateAndTime,
  parseCompleteDateFromText
} from './dateParser.js';

const WORD_NUMBERS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  thirty: 30,
  sixty: 60
};

function parseCount(token) {
  if (!token) return null;
  const n = parseInt(token, 10);
  if (!Number.isNaN(n)) return n;
  return WORD_NUMBERS[token.toLowerCase()] ?? null;
}

function parseEnglishRelativeDueDate(text) {
  const lower = text.toLowerCase();
  const now = new Date();

  const minutesMatch = lower.match(/after\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|thirty)\s*minutes?/);
  if (minutesMatch) {
    const due = new Date(now);
    due.setMinutes(due.getMinutes() + (parseCount(minutesMatch[1]) ?? 0));
    return due;
  }

  const hoursMatch = lower.match(/after\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*hours?/);
  if (hoursMatch) {
    const due = new Date(now);
    due.setHours(due.getHours() + (parseCount(hoursMatch[1]) ?? 0));

    const atTime = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(p\.?m\.?|a\.?m\.?)/i);
    if (atTime) {
      let hour = parseInt(atTime[1], 10);
      const minute = atTime[2] ? parseInt(atTime[2], 10) : 0;
      const period = atTime[3].toLowerCase();
      if (period.startsWith('p') && hour < 12) hour += 12;
      if (period.startsWith('a') && hour === 12) hour = 0;
      due.setHours(hour, minute, 0, 0);
    }
    return due;
  }

  const timeMatch =
    lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(p\.?m\.?|a\.?m\.?)/i) ||
    lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(p\.?m\.?|a\.?m\.?)\b/i);
  if (timeMatch) {
    const due = new Date(now);
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3].toLowerCase();
    if (period.startsWith('p') && hour < 12) hour += 12;
    if (period.startsWith('a') && hour === 12) hour = 0;
    due.setHours(hour, minute, 0, 0);
    if (due < now) {
      due.setDate(due.getDate() + 1);
    }
    return due;
  }

  const iso = parseCompleteDateFromText(text);
  if (iso) return new Date(iso);

  const baseDate = parseArabicDate(text) || now;
  const time = parseArabicTime(text);
  return time ? combineDateAndTime(baseDate, time) : baseDate;
}

function extractTitle(text) {
  const lower = text.toLowerCase();

  const gymMatch = lower.match(/\bgym\s+session\b|\bworkout\b|\bexercise\b/);
  if (gymMatch) {
    return 'Gym session';
  }

  const meetingMatch = lower.match(/\bmeeting\b[^.]{0,40}/);
  if (meetingMatch) {
    return meetingMatch[0].charAt(0).toUpperCase() + meetingMatch[0].slice(1);
  }

  let title = text
    .trim()
    .replace(/^(hello|hey|hi)[,.\s!]*/gi, '')
    .replace(/\badd to calendar\b[,.\s]*/gi, '')
    .replace(/\bneed add to calendar\b[,.\s]*/gi, '')
    .replace(/^i have a task[,.\s]*/gi, '')
    .replace(/^i have[,.\s]*/gi, '')
    .replace(/\bafter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|thirty)\s*(minutes?|hours?)\b.*$/gi, '')
    .replace(/\bat\s+\d{1,2}(:\d{2})?\s*(p\.?m\.?|a\.?m\.?)\b.*$/gi, '')
    .replace(/\b\d{1,2}(:\d{2})?\s*(p\.?m\.?|a\.?m\.?)\b.*$/gi, '')
    .trim();

  title = title.replace(/^[,.:\s-]+|[,.:\s-]+$/g, '').trim();

  if (title.length < 3 || /^after\b/i.test(title)) {
    title = 'New task';
  }

  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Build a single task when AI extraction returns nothing (common for short English voice).
 */
export function buildVoiceTaskFallback(text) {
  const content = text?.trim();
  if (!content) return null;

  const title = extractTitle(content);
  const dueDate = parseEnglishRelativeDueDate(content);

  return {
    title: title.substring(0, 200) || 'Voice task',
    description: content.substring(0, 500),
    priority: 'medium',
    due_date: (dueDate || new Date()).toISOString()
  };
}
