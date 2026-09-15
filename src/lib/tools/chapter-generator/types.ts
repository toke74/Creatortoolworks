export type ChapterRowStatus = "empty" | "ready" | "warning" | "error";

export interface ChapterRowInput {
  id: string;
  time: string;
  title: string;
}

export interface ChapterRowReport {
  id: string;
  status: ChapterRowStatus;
  totalSeconds: number | null;
  formatted: string | null;
  messages: string[];
}

export interface ChapterSummary {
  errors: string[];
  warnings: string[];
  /**
   * Purely informational notices — most commonly that the optional video duration
   * was left blank, so the final chapter's length can't be checked. Missing
   * optional information is never evidence something is wrong, so these never
   * affect `overall` status or block copying (see `summarizeOverallChapterStatus`).
   */
  info: string[];
}

export type ChapterOverallStatus = "empty" | "ready" | "warning" | "error";

export interface ChapterDurationParseResult {
  seconds: number | null;
  error: string | null;
}

export interface ChapterRequirementCheck {
  id: string;
  label: string;
  /** "info" marks a requirement that can't currently be checked (e.g. no duration supplied) — neutral, not a warning, never blocks copying. */
  status: "pass" | "warning" | "fail" | "info";
  message: string;
}
