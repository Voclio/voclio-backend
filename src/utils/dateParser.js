/**
 * Date Parser Utility for Arabic Text
 * Extracts and parses dates from Arabic voice transcriptions
 * Supports multiple Arabic dialects (Egyptian, Saudi, Gulf, Levantine, Moroccan)
 */

/**
 * Parse relative dates from Arabic text
 * @param {string} text - The text containing date references
 * @returns {Date|null} - Parsed date or null
 */
export function parseArabicDate(text) {
  const now = new Date();
  const lowerText = text.toLowerCase();

  // Today - all dialects
  const todayKeywords = ['اليوم', 'النهاردة', 'النهارده', 'اليوم هذا', 'today'];
  if (todayKeywords.some(keyword => lowerText.includes(keyword))) {
    return now;
  }

  // Tomorrow - all dialects
  const tomorrowKeywords = [
    'بكرة', 'بكره', 'باجر', 'باچر', 'بكرا', 'غداً', 'غدا', 
    'الغد', 'يوم بكرة', 'tomorrow'
  ];
  if (tomorrowKeywords.some(keyword => lowerText.includes(keyword))) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Day after tomorrow - all dialects
  const dayAfterKeywords = [
    'بعد بكرة', 'بعد بكره', 'بعد باجر', 'بعد غد', 
    'بعد الغد', 'بعدين بكرة'
  ];
  if (dayAfterKeywords.some(keyword => lowerText.includes(keyword))) {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }

  // This week
  const thisWeekKeywords = ['هذا الأسبوع', 'الأسبوع ده', 'الاسبوع هذا', 'this week'];
  if (thisWeekKeywords.some(keyword => lowerText.includes(keyword))) {
    return now; // Return current date, AI will handle specific day
  }

  // Next week - all dialects
  const nextWeekKeywords = [
    'الأسبوع الجاي', 'الاسبوع الجاي', 'الأسبوع القادم', 
    'الاسبوع القادم', 'الأسبوع اللي جاي', 'الجمعة الجاية',
    'next week'
  ];
  if (nextWeekKeywords.some(keyword => lowerText.includes(keyword))) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }

  // Next month - all dialects
  const nextMonthKeywords = [
    'الشهر الجاي', 'الشهر القادم', 'الشهر اللي جاي',
    'next month'
  ];
  if (nextMonthKeywords.some(keyword => lowerText.includes(keyword))) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }

  // In X days
  const inDaysMatch = lowerText.match(/بعد\s*(\d+)\s*(يوم|أيام|ايام)/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate;
  }

  // In X weeks
  const inWeeksMatch = lowerText.match(/بعد\s*(\d+)\s*(أسبوع|اسبوع|أسابيع|اسابيع)/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + (weeks * 7));
    return targetDate;
  }

  // Days of week (Arabic + English)
  const daysMap = {
    'السبت': 6, 'سبت': 6,
    'الأحد': 0, 'احد': 0, 'الاحد': 0,
    'الاثنين': 1, 'اثنين': 1, 'الإثنين': 1,
    'الثلاثاء': 2, 'ثلاثاء': 2,
    'الأربعاء': 3, 'اربعاء': 3, 'الاربعاء': 3, 'الأربع': 3,
    'الخميس': 4, 'خميس': 4,
    'الجمعة': 5, 'جمعة': 5,
    'saturday': 6, 'sat': 6,
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5
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

  // Specific date patterns (DD/MM, DD-MM, DD/MM/YYYY)
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})/,                // DD/MM or DD-MM
  ];

  for (const pattern of datePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // JS months are 0-indexed
      const year = match[3] ? parseInt(match[3]) : now.getFullYear();
      
      const targetDate = new Date(year, month, day);
      if (!isNaN(targetDate.getTime())) {
        return targetDate;
      }
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

  // Common time expressions in Arabic
  const timeExpressions = {
    'الفجر': { hour: 5, minute: 0 },
    'الصبح': { hour: 9, minute: 0 },
    'الصباح': { hour: 9, minute: 0 },
    'الضحى': { hour: 10, minute: 0 },
    'الظهر': { hour: 12, minute: 0 },
    'العصر': { hour: 15, minute: 0 },
    'المغرب': { hour: 18, minute: 0 },
    'العشاء': { hour: 20, minute: 0 },
    'الليل': { hour: 21, minute: 0 },
    'منتصف الليل': { hour: 0, minute: 0 },
    'نص الليل': { hour: 0, minute: 0 },
    'morning': { hour: 9, minute: 0 },
    'noon': { hour: 12, minute: 0 },
    'afternoon': { hour: 15, minute: 0 },
    'evening': { hour: 18, minute: 0 },
    'night': { hour: 21, minute: 0 },
    'midnight': { hour: 0, minute: 0 }
  };

  // Check for time expressions first
  for (const [expression, time] of Object.entries(timeExpressions)) {
    if (lowerText.includes(expression)) {
      return time;
    }
  }

  // Match patterns like "الساعة 5" or "5 مساءً" or "3:30" or "15:00"
  const timePatterns = [
    // HH:MM format (24-hour)
    /(\d{1,2}):(\d{2})/,
    // "الساعة X" format
    /الساعة\s*(\d{1,2})(?::(\d{2}))?/,
    // "X مساءً/صباحاً" format
    /(\d{1,2})\s*(?::(\d{2}))?\s*(مساءً|مساء|صباحاً|صباحا|ظهراً|ظهرا)/,
    // "at X" format
    /at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    // "X o'clock" format
    /(\d{1,2})\s*o'clock/i,
  ];

  for (const pattern of timePatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3] ? match[3].toLowerCase() : '';

      // Handle PM/AM based on Arabic or English indicators
      if (period.includes('مساء') || period === 'pm') {
        if (hour < 12) hour += 12;
      } else if (period.includes('صباح') || period === 'am') {
        if (hour === 12) hour = 0;
      } else if (period.includes('ظهر')) {
        if (hour < 12) hour = 12;
      }

      // Validate hour and minute
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return { hour, minute };
      }
    }
  }

  // Match "بعد X ساعات" (in X hours)
  const inHoursMatch = lowerText.match(/بعد\s*(\d+)\s*(ساعة|ساعات)/);
  if (inHoursMatch) {
    const hoursToAdd = parseInt(inHoursMatch[1]);
    const now = new Date();
    now.setHours(now.getHours() + hoursToAdd);
    return { hour: now.getHours(), minute: now.getMinutes() };
  }

  // Match "بعد X دقائق" (in X minutes)
  const inMinutesMatch = lowerText.match(/بعد\s*(\d+)\s*(دقيقة|دقائق)/);
  if (inMinutesMatch) {
    const minutesToAdd = parseInt(inMinutesMatch[1]);
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesToAdd);
    return { hour: now.getHours(), minute: now.getMinutes() };
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

  // High priority keywords (all dialects)
  const highPriorityKeywords = [
    // Arabic - Standard
    'مهم جداً', 'مهم جدا', 'ضروري', 'عاجل', 'لازم', 'حالاً', 'حالا', 'فوراً', 'فورا',
    'أولوية قصوى', 'اولوية قصوى', 'مستعجل', 'حرج', 'طارئ',
    // Egyptian dialect
    'مهم أوي', 'لازم دلوقتي', 'ضروري أوي', 'مستعجل جداً',
    // Saudi/Gulf dialect
    'مهم مرة', 'ضروري مرة', 'لازم الحين', 'مستعجل مرة',
    // Levantine dialect
    'مهم كتير', 'لازم هلق', 'ضروري كتير',
    // English
    'important', 'urgent', 'critical', 'asap', 'must', 'emergency', 'priority'
  ];

  // Low priority keywords (all dialects)
  const lowPriorityKeywords = [
    // Arabic - Standard
    'ممكن', 'لو فاضي', 'مش مستعجل', 'لو تقدر', 'لو سمحت', 'في وقت فراغ',
    'مش مهم', 'عادي', 'لو تيسر', 'على راحتك',
    // Egyptian dialect
    'لو فاضي', 'مش مستعجل', 'عادي يعني', 'على مهلك',
    // Saudi/Gulf dialect
    'إذا تقدر', 'ما فيه عجلة', 'عادي', 'على راحتك',
    // Levantine dialect
    'إذا بتقدر', 'مش مستعجل', 'عادي',
    // English
    'maybe', 'if possible', 'when free', 'optional', 'whenever', 'no rush'
  ];

  // Check high priority first
  for (const keyword of highPriorityKeywords) {
    if (lowerText.includes(keyword)) {
      return 'high';
    }
  }

  // Check low priority
  for (const keyword of lowPriorityKeywords) {
    if (lowerText.includes(keyword)) {
      return 'low';
    }
  }

  // Default to medium
  return 'medium';
}

/**
 * Extract items from a list in Arabic text
 * @param {string} text - The text containing a list
 * @returns {Array<string>} - Array of items
 */
export function extractListItems(text) {
  const items = [];
  const lowerText = text.toLowerCase();

  // Pattern 1: "X و Y و Z" (X and Y and Z)
  const andPattern = /([^\s،]+)\s*و\s*/g;
  let match;
  while ((match = andPattern.exec(text)) !== null) {
    const item = match[1].trim();
    if (item && item.length > 1) {
      items.push(item);
    }
  }

  // Pattern 2: Comma-separated "X، Y، Z"
  if (text.includes('،')) {
    const commaSplit = text.split('،').map(item => item.trim()).filter(item => item.length > 1);
    items.push(...commaSplit);
  }

  // Pattern 3: Numbered lists "1. X 2. Y 3. Z" or "أولاً X ثانياً Y"
  const numberedPatterns = [
    /\d+[.\-\)]\s*([^\d]+?)(?=\d+[.\-\)]|$)/g,
    /(?:أولاً|اولا|أول)\s*([^ثانياً]+)/,
    /(?:ثانياً|ثانيا|ثاني)\s*([^ثالثاً]+)/,
    /(?:ثالثاً|ثالثا|ثالث)\s*([^رابعاً]+)/,
  ];

  for (const pattern of numberedPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1].trim();
      if (item && item.length > 1) {
        items.push(item);
      }
    }
  }

  // Remove duplicates and return
  return [...new Set(items)];
}

/**
 * Detect if text is a task or a note
 * @param {string} text - The text to analyze
 * @returns {string} - 'task' or 'note'
 */
export function detectContentType(text) {
  const lowerText = text.toLowerCase();

  // Task indicators (action verbs and task keywords)
  const taskIndicators = [
    // Arabic action verbs
    'عايز', 'أريد', 'محتاج', 'ناوي', 'أبغى', 'لازم', 'مفروض', 'يجب', 'ضروري',
    'اشتري', 'اتصل', 'راجع', 'جهز', 'أرسل', 'احجز', 'سجل', 'اعمل', 'اكتب',
    'روح', 'قابل', 'كلم', 'خلص', 'انهي', 'ابدأ', 'سوي', 'دير',
    // English action verbs
    'need', 'want', 'must', 'should', 'buy', 'call', 'review', 'prepare',
    'send', 'book', 'register', 'do', 'make', 'go', 'meet', 'finish', 'start',
    // Task keywords
    'مهمة', 'تاسك', 'task', 'todo', 'موعد', 'اجتماع', 'meeting'
  ];

  // Note indicators
  const noteIndicators = [
    'نوت', 'ملاحظة', 'فكرة', 'معلومة', 'تذكير', 'مهم أعرف',
    'note', 'idea', 'information', 'reminder', 'remember'
  ];

  // Check for explicit note indicators first
  for (const indicator of noteIndicators) {
    if (lowerText.includes(indicator)) {
      return 'note';
    }
  }

  // Check for task indicators
  for (const indicator of taskIndicators) {
    if (lowerText.includes(indicator)) {
      return 'task';
    }
  }

  // Default: if it's short and has action words, it's likely a task
  // If it's longer and descriptive, it's likely a note
  if (text.length < 100 && /\b(عايز|محتاج|لازم|need|want|must)\b/i.test(text)) {
    return 'task';
  }

  return 'note';
}

export default {
  parseArabicDate,
  parseArabicTime,
  combineDateAndTime,
  parseCompleteDateFromText,
  determinePriority,
  extractListItems,
  detectContentType
};
