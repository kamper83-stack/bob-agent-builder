/**
 * calendarUtils.ts
 * ----------------
 * TypeScript helpers for working with Google Calendar connector state
 * on the frontend (display, link generation, event formatting).
 *
 * Note: actual OAuth flow and API calls happen server-side via the
 * Python google_calendar.py module. This file is UI/display only.
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;      // ISO 8601 dateTime or date
  end: string;
  description?: string;
  htmlLink?: string;
}

/**
 * Format an ISO 8601 dateTime string for display.
 * Returns e.g. "Mon 14 Jul, 09:00"
 */
export function formatEventDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build a Google Calendar quick-add URL for a given event title and time.
 *
 * @param summary - Event title.
 * @param start   - Start datetime (Date object or ISO string).
 * @param end     - End datetime (Date object or ISO string).
 * @returns A URL that opens Google Calendar new-event form pre-filled.
 */
export function buildCalendarAddUrl(
  summary: string,
  start: Date | string,
  end: Date | string,
): string {
  const toGCal = (d: Date | string): string => {
    const dt = typeof d === "string" ? new Date(d) : d;
    // GCal format: YYYYMMDDTHHmmssZ
    return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates: `${toGCal(start)}/${toGCal(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Returns true if the Google Calendar connector appears to be configured.
 * Checks for the presence of NEXT_PUBLIC_GCAL_CONNECTED env var.
 */
export function isCalendarConnected(): boolean {
  return process.env.NEXT_PUBLIC_GCAL_CONNECTED === "true";
}

/**
 * Returns the display label for the Google Calendar connector.
 * Uses NEXT_PUBLIC_GCAL_EMAIL if set, otherwise shows a generic label.
 */
export function calendarConnectorDetail(): string {
  const email = process.env.NEXT_PUBLIC_GCAL_EMAIL;
  return email ? `${email} · connected` : "calendar@company.co.il · connected";
}
