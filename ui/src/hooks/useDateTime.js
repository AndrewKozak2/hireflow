export const useDateTime = () => {
  const formatDateTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);

    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);

    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  const formatShortDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const formatLongDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  const formatRelativeDate = (date) => {
    if (!date) return "—";

    const target = new Date(date);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const dayDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const relativeDateFormatter = new Intl.RelativeTimeFormat("en", {
      numeric: "auto",
    });

    if (Math.abs(dayDiff) >= 1) {
      return relativeDateFormatter.format(dayDiff, "day");
    }

    const hourDiff = Math.round(diffMs / (1000 * 60 * 60));

    if (Math.abs(hourDiff) >= 1) {
      return relativeDateFormatter.format(hourDiff, "hour");
    }

    const minuteDiff = Math.round(diffMs / (1000 * 60));
    return relativeDateFormatter.format(minuteDiff, "minute");
  };

  const toISO = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
  };

  return {
    formatDateTime,
    formatDate,
    formatShortDate,
    formatLongDate,
    formatRelativeDate,
    toISO,
  };
};
