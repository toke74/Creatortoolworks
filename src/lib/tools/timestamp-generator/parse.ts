import type {
  ParsedPasteLine,
  TimestampParseResult,
  TimestampRowInput,
  TimestampRowReport,
  TimestampRowStatus,
} from "./types";

/**
 * Parses a single timestamp string into total seconds.
 *
 * Accepted forms: whole seconds ("90"), m:ss / mm:ss ("1:05", minutes may exceed
 * 59), and h:mm:ss ("1:02:03", hours may be any non-negative integer). Seconds and
 * minutes-within-an-hour must be 0-59. Never guesses at ambiguous/invalid input.
 */
export function parseTimestamp(raw: string): TimestampParseResult {
  const value = raw.trim();
  if (!value) return { ok: false, error: "Enter a timestamp." };

  if (!/^[0-9:]+$/.test(value)) {
    return { ok: false, error: `"${value}" isn't a valid timestamp. Use whole seconds, m:ss, or h:mm:ss.` };
  }

  const parts = value.split(":");
  if (parts.some((part) => part === "")) {
    return { ok: false, error: `"${value}" is missing a number between colons.` };
  }
  if (parts.length > 3) {
    return { ok: false, error: `"${value}" has too many parts. Use whole seconds, m:ss, or h:mm:ss.` };
  }

  const numbers = parts.map((part) => Number.parseInt(part, 10));

  if (numbers.length === 1) {
    return { ok: true, totalSeconds: numbers[0] };
  }

  if (numbers.length === 2) {
    const [minutes, seconds] = numbers;
    if (seconds > 59) return { ok: false, error: `Seconds must be 0-59 in "${value}".` };
    return { ok: true, totalSeconds: minutes * 60 + seconds };
  }

  const [hours, minutes, seconds] = numbers;
  if (minutes > 59) return { ok: false, error: `Minutes must be 0-59 in "${value}".` };
  if (seconds > 59) return { ok: false, error: `Seconds must be 0-59 in "${value}".` };
  return { ok: true, totalSeconds: hours * 3600 + minutes * 60 + seconds };
}

/** Canonical formatting: MM:SS below one hour, H:MM:SS at or above one hour (hours never zero-padded). */
export function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

const LEADING_SEPARATOR = /^[-–—|]\s*/;

/**
 * Splits pasted text into timestamp-first lines such as "0:00 - Intro". Only the
 * leading whitespace-delimited token is treated as the timestamp; everything after
 * it (minus one leading separator character) is preserved as the label verbatim.
 * Validity of the timestamp itself is not checked here — that's `parseTimestamp`'s job.
 */
export function parsePastedTimestampList(text: string): ParsedPasteLine[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^(\S+)(?:\s+([\s\S]*))?$/);
      const timeText = match?.[1] ?? line;
      const rest = (match?.[2] ?? "").trim();
      const label = rest.replace(LEADING_SEPARATOR, "").trim();
      return { timeText, label };
    });
}

const STATUS_SEVERITY: Record<TimestampRowStatus, number> = { empty: 0, ready: 0, warning: 1, error: 2 };

function escalate(status: TimestampRowStatus, next: TimestampRowStatus): TimestampRowStatus {
  return STATUS_SEVERITY[next] > STATUS_SEVERITY[status] ? next : status;
}

/**
 * Validates a full row list: parses each timestamp, then flags duplicates,
 * out-of-order entries, and missing labels as warnings (never auto-fixed).
 * A row with both an empty time and an empty label is treated as an inert
 * placeholder row, not a warning or error.
 */
export function buildTimestampRowReports(rows: TimestampRowInput[]): TimestampRowReport[] {
  const reports: TimestampRowReport[] = rows.map((row) => {
    const time = row.time.trim();
    const label = row.label.trim();

    if (!time && !label) {
      return { id: row.id, status: "empty", totalSeconds: null, formatted: null, messages: [] };
    }

    const parsed = parseTimestamp(time);
    if (!parsed.ok) {
      return {
        id: row.id,
        status: "error",
        totalSeconds: null,
        formatted: null,
        messages: [time ? parsed.error : "Enter a timestamp for this label."],
      };
    }

    return {
      id: row.id,
      status: "ready",
      totalSeconds: parsed.totalSeconds,
      formatted: formatTimestamp(parsed.totalSeconds),
      messages: [],
    };
  });

  const secondsCount = new Map<number, number>();
  for (const report of reports) {
    if (report.totalSeconds === null) continue;
    secondsCount.set(report.totalSeconds, (secondsCount.get(report.totalSeconds) ?? 0) + 1);
  }
  for (const report of reports) {
    if (report.totalSeconds !== null && (secondsCount.get(report.totalSeconds) ?? 0) > 1) {
      report.status = escalate(report.status, "warning");
      report.messages.push("Duplicate timestamp.");
    }
  }

  let highestSeenSeconds: number | null = null;
  for (const report of reports) {
    if (report.totalSeconds === null) continue;
    if (highestSeenSeconds !== null && report.totalSeconds < highestSeenSeconds) {
      report.status = escalate(report.status, "warning");
      report.messages.push("Out of order.");
    } else {
      highestSeenSeconds = report.totalSeconds;
    }
  }

  reports.forEach((report, index) => {
    if (report.totalSeconds !== null && !rows[index].label.trim()) {
      report.status = escalate(report.status, "warning");
      report.messages.push("Missing label.");
    }
  });

  return reports;
}

/** Worst-case status across all rows; an all-empty/all-ready list is "ready". */
export function summarizeOverallTimestampStatus(reports: TimestampRowReport[]): "ready" | "warning" | "error" {
  const worst = reports.reduce((acc, report) => Math.max(acc, STATUS_SEVERITY[report.status]), 0);
  if (worst >= 2) return "error";
  if (worst === 1) return "warning";
  return "ready";
}

/**
 * Whether copying is allowed: blocked while any row has an unparseable timestamp,
 * so an invalid row is never silently left out of the copied output. Warnings
 * (duplicate/out-of-order/missing label) never block copying.
 */
export function isTimestampCopyAllowed(reports: TimestampRowReport[]): boolean {
  return reports.every((report) => report.status !== "error");
}

/** Returns a new array sorted by parsed time ascending. Rows that can't be parsed sort last, in their original relative order. */
export function sortTimestampRows(rows: TimestampRowInput[]): TimestampRowInput[] {
  return rows
    .map((row, index) => {
      const parsed = parseTimestamp(row.time.trim());
      return { row, index, key: parsed.ok ? parsed.totalSeconds : Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => (a.key !== b.key ? a.key - b.key : a.index - b.index))
    .map((entry) => entry.row);
}

/**
 * Builds the final plain-text output. Rows with an unparseable timestamp, and
 * fully empty rows, are left out (they're surfaced as errors in the UI instead,
 * not silently included). Row order is preserved as-is — sorting is opt-in only.
 */
export function formatTimestampsForCopy(rows: TimestampRowInput[]): string {
  const lines: string[] = [];

  for (const row of rows) {
    const time = row.time.trim();
    const label = row.label.trim();
    if (!time && !label) continue;

    const parsed = parseTimestamp(time);
    if (!parsed.ok) continue;

    const formatted = formatTimestamp(parsed.totalSeconds);
    lines.push(label ? `${formatted} ${label}` : formatted);
  }

  return lines.join("\n");
}
