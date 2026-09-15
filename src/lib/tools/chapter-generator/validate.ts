import { formatTimestamp, parseTimestamp } from "@/lib/tools/timestamp-generator/parse";
import type { ParsedPasteLine } from "@/lib/tools/timestamp-generator/types";
import { youtubeChaptersMinimumCount, youtubeChaptersMinimumLengthSeconds } from "@/lib/platform-facts/youtube-chapters";
import type {
  ChapterDurationParseResult,
  ChapterOverallStatus,
  ChapterRequirementCheck,
  ChapterRowInput,
  ChapterRowReport,
  ChapterRowStatus,
  ChapterSummary,
} from "./types";

const MINIMUM_COUNT = youtubeChaptersMinimumCount.value;
const MINIMUM_LENGTH_SECONDS = youtubeChaptersMinimumLengthSeconds.value;

const STATUS_SEVERITY: Record<ChapterRowStatus, number> = { empty: 0, ready: 0, warning: 1, error: 2 };

function escalate(status: ChapterRowStatus, next: ChapterRowStatus): ChapterRowStatus {
  return STATUS_SEVERITY[next] > STATUS_SEVERITY[status] ? next : status;
}

function pluralSeconds(n: number): string {
  return `${n} second${n === 1 ? "" : "s"}`;
}

/** Parses the optional video-duration field. An empty/whitespace value means "not supplied", not an error. */
export function parseChapterDuration(raw: string): ChapterDurationParseResult {
  const value = raw.trim();
  if (!value) return { seconds: null, error: null };

  const parsed = parseTimestamp(value);
  if (!parsed.ok) return { seconds: null, error: parsed.error };
  return { seconds: parsed.totalSeconds, error: null };
}

/**
 * Validates every row against YouTube's manual-chapter rules: a parseable timestamp,
 * a non-empty title, the first chapter starting at 00:00, strictly ascending order,
 * duplicate timestamps, and a minimum 10-second gap between consecutive chapters
 * (including the final chapter when `durationSeconds` is known). Never reorders,
 * merges, or rewrites rows — only reports.
 */
export function buildChapterRowReports(rows: ChapterRowInput[], durationSeconds: number | null): ChapterRowReport[] {
  const reports: ChapterRowReport[] = rows.map((row) => {
    const time = row.time.trim();
    const title = row.title.trim();

    if (!time && !title) {
      return { id: row.id, status: "empty", totalSeconds: null, formatted: null, messages: [] };
    }

    const parsed = parseTimestamp(time);
    if (!parsed.ok) {
      return {
        id: row.id,
        status: "error",
        totalSeconds: null,
        formatted: null,
        messages: [time ? parsed.error : "Enter a timestamp for this chapter."],
      };
    }

    const messages: string[] = [];
    let status: ChapterRowStatus = "ready";
    if (!title) {
      status = "error";
      messages.push("Enter a chapter title.");
    }

    return {
      id: row.id,
      status,
      totalSeconds: parsed.totalSeconds,
      formatted: formatTimestamp(parsed.totalSeconds),
      messages,
    };
  });

  // Rows with a successfully parsed timestamp, in original order — these are the
  // rows that participate in ordering/count/interval rules regardless of whether
  // their title is still missing.
  const validEntries = reports
    .map((report, index) => ({ report, index }))
    .filter((entry) => entry.report.totalSeconds !== null);

  if (validEntries.length > 0) {
    const first = validEntries[0];
    if (first.report.totalSeconds !== 0) {
      first.report.status = escalate(first.report.status, "error");
      first.report.messages.push("The first chapter must start at 00:00.");
    }
  }

  let highestSeen: number | null = null;
  for (const entry of validEntries) {
    const seconds = entry.report.totalSeconds as number;
    if (highestSeen !== null && seconds <= highestSeen) {
      entry.report.status = escalate(entry.report.status, "error");
      entry.report.messages.push("Not in ascending order.");
    } else {
      highestSeen = seconds;
    }
  }

  const secondsCount = new Map<number, number>();
  for (const entry of validEntries) {
    const seconds = entry.report.totalSeconds as number;
    secondsCount.set(seconds, (secondsCount.get(seconds) ?? 0) + 1);
  }
  for (const entry of validEntries) {
    const seconds = entry.report.totalSeconds as number;
    if ((secondsCount.get(seconds) ?? 0) > 1) {
      entry.report.status = escalate(entry.report.status, "warning");
      entry.report.messages.push("Duplicate timestamp.");
    }
  }

  for (let i = 0; i < validEntries.length - 1; i++) {
    const current = validEntries[i];
    const next = validEntries[i + 1];
    const currentSeconds = current.report.totalSeconds as number;
    const nextSeconds = next.report.totalSeconds as number;
    if (nextSeconds <= currentSeconds) continue; // already flagged as out of order above

    const interval = nextSeconds - currentSeconds;
    if (interval < MINIMUM_LENGTH_SECONDS) {
      current.report.status = escalate(current.report.status, "error");
      current.report.messages.push(
        `This chapter is only ${pluralSeconds(interval)} long — chapters must be at least ${pluralSeconds(MINIMUM_LENGTH_SECONDS)}.`,
      );
    }
  }

  if (validEntries.length > 0 && durationSeconds !== null) {
    const last = validEntries[validEntries.length - 1];
    const lastSeconds = last.report.totalSeconds as number;
    const interval = durationSeconds - lastSeconds;

    if (interval <= 0) {
      last.report.status = escalate(last.report.status, "error");
      last.report.messages.push("This timestamp is at or after the video duration.");
    } else if (interval < MINIMUM_LENGTH_SECONDS) {
      last.report.status = escalate(last.report.status, "error");
      last.report.messages.push(
        `This chapter is only ${pluralSeconds(interval)} long based on the video duration — chapters must be at least ${pluralSeconds(MINIMUM_LENGTH_SECONDS)}.`,
      );
    }
  }

  return reports;
}

/** Number of rows with a successfully parsed timestamp — the count YouTube's "at least 3 timestamps" rule is checked against. */
export function countParsedChapters(rowReports: ChapterRowReport[]): number {
  return rowReports.filter((report) => report.totalSeconds !== null).length;
}

// Shared with buildChapterRequirementChecks so the "final chapter unverified" info
// notice is only ever defined once.
const FINAL_CHAPTER_UNVERIFIED_MESSAGE =
  "Enter the optional video duration if you want to verify that the final chapter is at least 10 seconds long.";

/** List-level messages that aren't tied to one specific row: the minimum-count rule, an invalid duration, and the unverified-final-chapter notice. */
export function buildChapterSummaryMessages(
  rowReports: ChapterRowReport[],
  durationRaw: string,
  duration: ChapterDurationParseResult,
): ChapterSummary {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  const hasAnyInput = rowReports.some((report) => report.status !== "empty");
  const chapterCount = countParsedChapters(rowReports);

  if (hasAnyInput && chapterCount < MINIMUM_COUNT) {
    errors.push(
      `Add at least ${MINIMUM_COUNT} chapters — YouTube requires at least ${MINIMUM_COUNT} timestamps for manual chapters (currently ${chapterCount}).`,
    );
  }

  if (durationRaw.trim() !== "" && duration.error) {
    errors.push("Enter a valid video duration (e.g. 12:34 or 1:02:03), or clear the field.");
  } else if (durationRaw.trim() === "" && chapterCount > 0) {
    // Missing OPTIONAL information, not a detected problem — kept out of `warnings`
    // so it never escalates `overall` status or blocks copying. See
    // summarizeOverallChapterStatus, which deliberately ignores `info`.
    info.push(FINAL_CHAPTER_UNVERIFIED_MESSAGE);
  }

  return { errors, warnings, info };
}

/**
 * Worst-case status across every row and the list-level error/warning messages;
 * an all-empty, no-duration state is "empty". `summary.info` (e.g. the
 * unverified-final-chapter notice) never contributes here — missing optional
 * information is not evidence anything is wrong, so it can never turn a
 * fully-valid list into a "warning".
 */
export function summarizeOverallChapterStatus(rowReports: ChapterRowReport[], summary: ChapterSummary): ChapterOverallStatus {
  const allEmpty = rowReports.every((report) => report.status === "empty");
  if (allEmpty && summary.errors.length === 0 && summary.warnings.length === 0) return "empty";

  let worst = rowReports.reduce((acc, report) => Math.max(acc, STATUS_SEVERITY[report.status]), 0);
  if (summary.errors.length > 0) worst = Math.max(worst, STATUS_SEVERITY.error);
  if (summary.warnings.length > 0) worst = Math.max(worst, STATUS_SEVERITY.warning);

  if (worst >= STATUS_SEVERITY.error) return "error";
  if (worst >= STATUS_SEVERITY.warning) return "warning";
  return "ready";
}

/** Copying is blocked only while the overall status is "error" — warnings and info notices (including an unverified final chapter) never block it. */
export function isChapterCopyAllowed(overall: ChapterOverallStatus): boolean {
  return overall !== "error";
}

/**
 * Human-readable pass/fail/info checklist mirroring YouTube's published manual-chapter
 * requirements, derived from the same row reports and summary messages used for validation
 * (never a second, independent check). The 10-second rule is split into what's actually
 * knowable — "Known chapter intervals" only covers gaps between entered timestamps, which
 * are always fully verifiable — and "Final chapter length", which is "info" (not a warning
 * or failure) whenever the video duration wasn't supplied, since that's missing optional
 * information rather than a detected problem.
 */
export function buildChapterRequirementChecks(
  rowReports: ChapterRowReport[],
  summary: ChapterSummary,
): ChapterRequirementCheck[] {
  const chapterCount = countParsedChapters(rowReports);
  const hasFirstZeroIssue = rowReports.some((report) => report.messages.includes("The first chapter must start at 00:00."));
  const hasOrderIssue = rowReports.some((report) => report.messages.includes("Not in ascending order."));

  const hasKnownIntervalShortfall = rowReports.some((report) =>
    report.messages.some((message) => message.includes("must be at least") && !message.includes("based on the video duration")),
  );
  const hasFinalChapterDurationFailure = rowReports.some((report) =>
    report.messages.some((message) => message.includes("based on the video duration") || message.includes("at or after the video duration")),
  );
  const finalChapterUnverified = summary.info.includes(FINAL_CHAPTER_UNVERIFIED_MESSAGE);

  const finalChapterStatus: ChapterRequirementCheck["status"] = hasFinalChapterDurationFailure
    ? "fail"
    : finalChapterUnverified
      ? "info"
      : "pass";

  return [
    {
      id: "first-zero",
      label: "First timestamp is 00:00",
      status: hasFirstZeroIssue ? "fail" : "pass",
      message: hasFirstZeroIssue
        ? "The first chapter must start at 00:00."
        : "The first chapter starts at 00:00.",
    },
    {
      id: "minimum-count",
      label: `At least ${MINIMUM_COUNT} timestamps`,
      status: chapterCount < MINIMUM_COUNT ? "fail" : "pass",
      message:
        chapterCount < MINIMUM_COUNT
          ? `Only ${chapterCount} chapter${chapterCount === 1 ? "" : "s"} entered — YouTube requires at least ${MINIMUM_COUNT}.`
          : `${chapterCount} chapters entered.`,
    },
    {
      id: "ascending-order",
      label: "Ascending order",
      status: hasOrderIssue ? "fail" : "pass",
      message: hasOrderIssue
        ? "Timestamps must be listed in ascending order."
        : "Timestamps are in ascending order.",
    },
    {
      id: "known-intervals",
      label: `Known chapter intervals are at least ${pluralSeconds(MINIMUM_LENGTH_SECONDS)}`,
      status: hasKnownIntervalShortfall ? "fail" : "pass",
      message: hasKnownIntervalShortfall
        ? `At least one chapter is shorter than ${pluralSeconds(MINIMUM_LENGTH_SECONDS)}.`
        : "All chapter intervals that can be checked meet YouTube's 10-second minimum.",
    },
    {
      id: "final-chapter-length",
      label: "Final chapter length",
      status: finalChapterStatus,
      message:
        finalChapterStatus === "fail"
          ? `The final chapter doesn't meet YouTube's ${pluralSeconds(MINIMUM_LENGTH_SECONDS)} minimum based on the video duration provided.`
          : finalChapterStatus === "info"
            ? FINAL_CHAPTER_UNVERIFIED_MESSAGE
            : `The final chapter meets the ${pluralSeconds(MINIMUM_LENGTH_SECONDS)} minimum based on the video duration provided.`,
    },
  ];
}

/** Returns a new array sorted by parsed time ascending. Rows that can't be parsed sort last, in their original relative order. Only runs on explicit user action — never automatic. */
export function sortChapterRows(rows: ChapterRowInput[]): ChapterRowInput[] {
  return rows
    .map((row, index) => {
      const parsed = parseTimestamp(row.time.trim());
      return { row, index, key: parsed.ok ? parsed.totalSeconds : Number.POSITIVE_INFINITY };
    })
    .sort((a, b) => (a.key !== b.key ? a.key - b.key : a.index - b.index))
    .map((entry) => entry.row);
}

/**
 * Merges pasted chapter lines into the existing rows. Any existing row that is
 * completely blank (no time AND no title) is dropped first — it's an unfilled
 * scaffold/placeholder row, not user data, so pasted chapters shouldn't land
 * after it. A row with even partial content (a time with no title yet, or vice
 * versa) is always preserved, since it may represent real in-progress work.
 * Pasted lines are appended in their pasted order; nothing is reordered.
 */
export function mergePastedChapterRows(
  existingRows: ChapterRowInput[],
  pastedLines: ParsedPasteLine[],
  createId: () => string,
): ChapterRowInput[] {
  return [
    ...existingRows.filter((row) => row.time.trim() !== "" || row.title.trim() !== ""),
    ...pastedLines.map((line) => ({ id: createId(), time: line.timeText, title: line.label })),
  ];
}

/**
 * Builds the final plain-text chapter block. A row is only included once it has both
 * a parseable timestamp and a title — by the time copying is allowed every included
 * row already meets both, since a missing title is itself a blocking error. Row order
 * is preserved as-is; sorting is opt-in only.
 */
export function formatChaptersForCopy(rows: ChapterRowInput[]): string {
  const lines: string[] = [];

  for (const row of rows) {
    const time = row.time.trim();
    const title = row.title.trim();
    if (!time && !title) continue;

    const parsed = parseTimestamp(time);
    if (!parsed.ok || !title) continue;

    lines.push(`${formatTimestamp(parsed.totalSeconds)} ${title}`);
  }

  return lines.join("\n");
}
