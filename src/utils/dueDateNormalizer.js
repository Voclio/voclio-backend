import { buildVoiceTaskFallback } from './voiceTaskFallback.js';

const HAS_RELATIVE_TIME =
  /\bafter\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|thirty)\s*(minutes?|hours?)\b/i;

function hasExplicitTime(text) {
  return /\b(at\s+)?\d{1,2}(:\d{2})?\s*(a\.?m\.?|p\.?m\.?)\b/i.test(text);
}

function hasRelativeTime(text) {
  return HAS_RELATIVE_TIME.test(text);
}

function formatPartsInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(date);

  const get = type => parseInt(parts.find(part => part.type === type)?.value ?? '0', 10);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second')
  };
}

/**
 * Convert a wall-clock datetime in a timezone to a UTC Date.
 */
export function zonedLocalToUtc(isoLocal, timeZone = 'UTC') {
  if (!isoLocal) return null;

  const normalized = String(isoLocal).trim().replace(' ', 'T');
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4] ?? '0', 10);
  const minute = parseInt(match[5] ?? '0', 10);
  const second = parseInt(match[6] ?? '0', 10);

  let guess = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const formatted = formatPartsInTimezone(new Date(guess), timeZone);
    const targetMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const formattedMs = Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second
    );
    const diff = targetMs - formattedMs;
    if (diff === 0) break;
    guess += diff;
  }

  return new Date(guess);
}

export function resolveTimezone(req, fallback = 'UTC') {
  const headerTz = req.headers['x-timezone'] || req.headers['x-device-timezone'];
  if (typeof headerTz === 'string' && headerTz.trim()) {
    return headerTz.trim();
  }

  const offsetHeader = req.headers['x-timezone-offset'];
  if (offsetHeader != null && offsetHeader !== '') {
    const minutes = parseInt(String(offsetHeader), 10);
    if (!Number.isNaN(minutes)) {
      const sign = minutes >= 0 ? '+' : '-';
      const abs = Math.abs(minutes);
      const hours = String(Math.floor(abs / 60)).padStart(2, '0');
      const mins = String(abs % 60).padStart(2, '0');
      return `Etc/GMT${sign === '+' ? '-' : '+'}${parseInt(hours, 10)}`;
    }
  }

  return fallback;
}

export function normalizeDueDate(rawDueDate, timeZone = 'UTC') {
  if (!rawDueDate) return null;

  const text = String(rawDueDate).trim();
  if (!text) return null;

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(text)) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return zonedLocalToUtc(`${text}T23:59:59`, timeZone);
  }

  return zonedLocalToUtc(text, timeZone);
}

export function endOfTodayInTimezone(timeZone = 'UTC', now = new Date()) {
  const parts = formatPartsInTimezone(now, timeZone);
  return zonedLocalToUtc(
    `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T23:59:59`,
    timeZone
  );
}

/**
 * Fix AI due dates for voice-created tasks so they are not instantly overdue.
 */
export function reconcileVoiceTaskDueDate({
  dueDate,
  noteContent,
  timeZone = 'UTC',
  now = new Date()
}) {
  let resolved = normalizeDueDate(dueDate, timeZone);

  if (resolved && resolved >= now) {
    return resolved;
  }

  const fallback = buildVoiceTaskFallback(noteContent);
  const fallbackDue = fallback?.due_date ? new Date(fallback.due_date) : null;

  if (fallbackDue && fallbackDue >= now) {
    return fallbackDue;
  }

  if (hasRelativeTime(noteContent) && fallbackDue) {
    return fallbackDue;
  }

  if (!hasExplicitTime(noteContent)) {
    return endOfTodayInTimezone(timeZone, now);
  }

  return resolved ?? fallbackDue ?? endOfTodayInTimezone(timeZone, now);
}
