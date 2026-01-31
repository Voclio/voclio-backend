/**
 * Date Parser Utility for Arabic Text
 * Extracts and parses dates from Arabic voice transcriptions
 */

/**
 * Parse relative dates from Arabic text
 * @param {string} text - The text containing date references
 * @returns {Date|null} - Parsed date or null
 */
export function parseArabicDate(text) {
  const now = new Date();
  const lowerText = text.toLowerCase();

  // Today
  if (lowerText.includes('اليوم') || lowerText.includes('today')) {
    return now;
  }

  // Tomorrow
  if (lowerText.includes('بكرة') || lowerText.includes('بكره') || lowerText.includes('غداً') || lowerText.includes('غدا') || lowerText.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Day after tomorrow
  if (lowerText.includes('بعد بكرة') || lowerText.includes('بعد بكره')) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }

  // Next week
  if (lowerText.includes('الأسبوع الجاي') || lowerText.includes('الاسبوع الجاي') || lowerText.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  // Next month
  if (lowerText.includes('الشهر الجاي') || lowerText.includes('next month')) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // Days of week (Arabic)
  const daysMap = {
    'السبت': 6,
    'الأحد': 0,
    'الاثنين': 1,
    'الثلاثاء': 2,
    'الأربعاء': 3,
    'الخميس': 4,
    'الجمعة': 5,
    'saturday': 6,
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5
  };

  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (lowerText.includes(dayName)) {
      const targetDate = new Date(now);
      const currentDay = targetDate.getDay();
      let daysToAdd = dayIndex - currentDay;
      
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next occurrence
      }
      
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return targetDate;
    }
  }

  return null;
}

/**
 * Extract time from Arabic text
 * @param {string} text - The text containing time references
 * @returns {Object|null} - {hour, minute} or null
 */
export function parseArabicTime(text) {
  const lowerText = text.toLowerCase();

  // Match patterns like "الساعة 5" or "5 مساءً" or "3:30"
  const timePatterns = [
    /الساعة\s*(\d{1,2})/,
    /(\d{1,2})\s*مساءً/,
    /(\d{1,2})\s*مساء/,
    /(\d{1,2})\s*صباحاً/,
    /(\d{1,2})\s*صباحا/,
    /(\d{1,2}):(\d{2})/,
    /at\s*(\d{1,2})/
  ];

  for (const pattern of timePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;

      // Handle PM/AM
      if (lowerText.includes('مساء') || lowerText.includes('مساءً') || lowerText.includes('pm')) {
        if (hour < 12) hour += 12;
      } else if (lowerText.includes('صباح') || lowerText.includes('صباحاً') || lowerText.includes('am')) {
        if (hour === 12) hour = 0;
      }

      return { hour, minute };
    }
  }

  return null;
}

/**
 * Combine date and time
 * @param {Date} date - Base date
 * @param {Object} time - {hour, minute}
 * @returns {Date} - Combined date with time
 */
export function combineDateAndTime(date, time) {
  if (!date || !time) return date;
  
  const combined = new Date(date);
  combined.setHours(time.hour, time.minute, 0, 0);
  return combined;
}

/**
 * Parse complete date-time from Arabic text
 * @param {string} text - The text to parse
 * @returns {string|null} - ISO date string or null
 */
export function parseCompleteDateFromText(text) {
  const date = parseArabicDate(text);
  if (!date) return null;

  const time = parseArabicTime(text);
  const finalDate = time ? combineDateAndTime(date, time) : date;

  return finalDate.toISOString();
}

/**
 * Determine priority from Arabic text
 * @param {string} text - The text to analyze
 * @returns {string} - 'high', 'medium', or 'low'
 */
export function determinePriority(text) {
  const lowerText = text.toLowerCase();

  const highPriorityKeywords = [
    'مهم', 'ضروري', 'عاجل', 'لازم', 'حالاً', 'فوراً',
    'important', 'urgent', 'critical', 'asap', 'must'
  ];

  const lowPriorityKeywords = [
    'ممكن', 'لو فاضي', 'مش مستعجل', 'لو تقدر',
    'maybe', 'if possible', 'when free', 'optional'
  ];

  for (const keyword of highPriorityKeywords) {
    if (lowerText.includes(keyword)) {
      return 'high';
    }
  }

  for (const keyword of lowPriorityKeywords) {
    if (lowerText.includes(keyword)) {
      return 'low';
    }
  }

  return 'medium';
}

export default {
  parseArabicDate,
  parseArabicTime,
  combineDateAndTime,
  parseCompleteDateFromText,
  determinePriority
};
