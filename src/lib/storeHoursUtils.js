// Utility functions for store hours logic using EAT (Africa/Nairobi, UTC+3)

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Returns current time components in EAT (Africa/Nairobi).
 * @returns {{ dayOfWeek: number, hours: number, minutes: number }}
 */
export function getCurrentEATTime() {
  const now = new Date();
  // Use toLocaleString to extract EAT components
  const eatString = now.toLocaleString('en-US', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  // Compute day of week in EAT by checking the EAT date
  const eatDateString = now.toLocaleDateString('en-US', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
  });
  const dayOfWeek = DAY_NAMES.findIndex(d => eatDateString.startsWith(d));

  // Extract hours/minutes from EAT
  const eatTimeString = now.toLocaleTimeString('en-US', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const [hoursStr, minutesStr] = eatTimeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return { dayOfWeek, hours, minutes };
}

/**
 * Parses a TIME string like "10:00:00" or "10:00" into { hours, minutes }.
 */
function parseTime(timeStr) {
  const parts = timeStr.split(':');
  return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) };
}

/**
 * Formats a time into 12-hour AM/PM format.
 * @param {string} timeStr e.g. "10:00:00"
 * @returns {string} e.g. "10:00 AM"
 */
function formatTime12h(timeStr) {
  const { hours, minutes } = parseTime(timeStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Given the store hours rows and current EAT time, determines if the store is open.
 * @param {Array<{day_of_week: number, open_time: string, close_time: string, is_closed: boolean}>} hoursRows
 * @returns {{ isOpen: boolean, nextOpeningTime: string | null }}
 */
export function isStoreOpenNow(hoursRows) {
  if (!hoursRows || hoursRows.length === 0) {
    // No hours configured — assume open
    return { isOpen: true, nextOpeningTime: null };
  }

  const { dayOfWeek, hours, minutes } = getCurrentEATTime();
  const currentTotalMinutes = hours * 60 + minutes;

  // Build a map: day_of_week -> row
  const hoursMap = {};
  hoursRows.forEach(row => {
    hoursMap[row.day_of_week] = row;
  });

  const todayRow = hoursMap[dayOfWeek];

  if (todayRow && !todayRow.is_closed) {
    const { hours: openH, minutes: openM } = parseTime(todayRow.open_time);
    const { hours: closeH, minutes: closeM } = parseTime(todayRow.close_time);
    const openTotalMinutes = openH * 60 + openM;
    const closeTotalMinutes = closeH * 60 + closeM;

    if (currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes) {
      return { isOpen: true, nextOpeningTime: null };
    }

    // Before opening today
    if (currentTotalMinutes < openTotalMinutes) {
      return {
        isOpen: false,
        nextOpeningTime: `${formatTime12h(todayRow.open_time)} today`,
      };
    }
  }

  // After close or today is closed — find next opening day
  for (let offset = 1; offset <= 7; offset++) {
    const nextDay = (dayOfWeek + offset) % 7;
    const nextRow = hoursMap[nextDay];
    if (nextRow && !nextRow.is_closed) {
      const label = offset === 1 ? 'tomorrow' : DAY_NAMES[nextDay];
      return {
        isOpen: false,
        nextOpeningTime: `${formatTime12h(nextRow.open_time)} ${label}`,
      };
    }
  }

  // All days closed
  return { isOpen: false, nextOpeningTime: null };
}
