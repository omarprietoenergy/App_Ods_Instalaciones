import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Returns a date string in YYYY-MM-DD format, strictly in Europe/Madrid timezone.
 * This ensures "Today" is always "Today in Spain".
 * @param date optional date object, defaults to now
 */
export function getLocalDateStr(date: Date | string | number = new Date()): string {
    const timeZone = "Europe/Madrid";
    const d = new Date(date);
    const zonedDate = toZonedTime(d, timeZone);
    return format(zonedDate, "yyyy-MM-dd");
}
