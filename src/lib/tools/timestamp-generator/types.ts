export type TimestampRowStatus = "empty" | "ready" | "warning" | "error";

export interface TimestampRowInput {
  id: string;
  time: string;
  label: string;
}

export interface TimestampRowReport {
  id: string;
  status: TimestampRowStatus;
  totalSeconds: number | null;
  formatted: string | null;
  messages: string[];
}

export type TimestampParseResult = { ok: true; totalSeconds: number } | { ok: false; error: string };

export interface ParsedPasteLine {
  timeText: string;
  label: string;
}
