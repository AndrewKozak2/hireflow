const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

const relativeDateFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatLongDate(value) {
  if (!value) {
    return "—";
  }

  return fullDateFormatter.format(new Date(value));
}

export function formatShortDate(value) {
  if (!value) {
    return "—";
  }

  return shortDateFormatter.format(new Date(value));
}

export function formatShortDateTime(value) {
  if (!value) {
    return "—";
  }

  return shortDateTimeFormatter.format(new Date(value));
}

export function formatRelativeDate(value) {
  if (!value) {
    return "—";
  }

  const target = new Date(value);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const dayDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(dayDiff) >= 1) {
    return relativeDateFormatter.format(dayDiff, "day");
  }

  const hourDiff = Math.round(diffMs / (1000 * 60 * 60));

  if (Math.abs(hourDiff) >= 1) {
    return relativeDateFormatter.format(hourDiff, "hour");
  }

  const minuteDiff = Math.round(diffMs / (1000 * 60));
  return relativeDateFormatter.format(minuteDiff, "minute");
}

/**
 * Formats a past date as a compact relative string (e.g. "3d ago", "2mo ago").
 * Used in CandidateRow for the last-activity column.
 * @param {string | null | undefined} dateStr
 * @returns {string | null}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Formats a date string as a full locale datetime string.
 * Used in CandidateRow tooltip.
 * @param {string | null | undefined} dateStr
 * @returns {string}
 */
export function formatExactDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString();
}
