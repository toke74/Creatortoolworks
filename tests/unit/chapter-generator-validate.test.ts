import { describe, expect, it } from "vitest";
import {
  buildChapterRequirementChecks,
  buildChapterRowReports,
  buildChapterSummaryMessages,
  countParsedChapters,
  formatChaptersForCopy,
  isChapterCopyAllowed,
  mergePastedChapterRows,
  parseChapterDuration,
  sortChapterRows,
  summarizeOverallChapterStatus,
} from "@/lib/tools/chapter-generator/validate";
import type { ChapterRowInput } from "@/lib/tools/chapter-generator/types";
import type { ParsedPasteLine } from "@/lib/tools/timestamp-generator/types";

function row(id: string, time: string, title = ""): ChapterRowInput {
  return { id, time, title };
}

function validate(rows: ChapterRowInput[], durationRaw = "") {
  const duration = parseChapterDuration(durationRaw);
  const rowReports = buildChapterRowReports(rows, duration.seconds);
  const summary = buildChapterSummaryMessages(rowReports, durationRaw, duration);
  const overall = summarizeOverallChapterStatus(rowReports, summary);
  return { duration, rowReports, summary, overall };
}

const VALID_LIST: ChapterRowInput[] = [
  row("a", "00:00", "Introduction"),
  row("b", "01:35", "Choosing your topic"),
  row("c", "04:20", "Recording the video"),
  row("d", "08:10", "Editing workflow"),
];

describe("parseChapterDuration", () => {
  it("treats an empty/whitespace value as not supplied, not an error", () => {
    expect(parseChapterDuration("")).toEqual({ seconds: null, error: null });
    expect(parseChapterDuration("   ")).toEqual({ seconds: null, error: null });
  });

  it("parses a valid duration", () => {
    expect(parseChapterDuration("12:45")).toEqual({ seconds: 765, error: null });
  });

  it("reports an error for an unparseable duration", () => {
    const result = parseChapterDuration("abc");
    expect(result.seconds).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

describe("buildChapterRowReports — parsing and titles", () => {
  it("treats a fully blank row as empty", () => {
    const reports = buildChapterRowReports([row("a", "", "")], null);
    expect(reports[0].status).toBe("empty");
  });

  it("errors on an unparseable timestamp", () => {
    const reports = buildChapterRowReports([row("a", "1:75", "Intro")], null);
    expect(reports[0].status).toBe("error");
  });

  it("errors on a missing timestamp when a title is present", () => {
    const reports = buildChapterRowReports([row("a", "", "Intro")], null);
    expect(reports[0].status).toBe("error");
    expect(reports[0].messages[0]).toMatch(/enter a timestamp/i);
  });

  it("errors on a missing title when the timestamp is valid", () => {
    const reports = buildChapterRowReports([row("a", "00:00", "")], null);
    expect(reports[0].status).toBe("error");
    expect(reports[0].messages).toContain("Enter a chapter title.");
  });
});

describe("buildChapterRowReports — first timestamp must be 00:00", () => {
  it("errors when the first chapter does not start at 00:00", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:10", "Intro"), row("b", "01:00", "Two"), row("c", "02:00", "Three")],
      null,
    );
    expect(reports[0].status).toBe("error");
    expect(reports[0].messages).toContain("The first chapter must start at 00:00.");
  });

  it("does not flag a valid 00:00 first chapter", () => {
    const reports = buildChapterRowReports(VALID_LIST, null);
    expect(reports[0].messages).not.toContain("The first chapter must start at 00:00.");
  });
});

describe("buildChapterRowReports — ascending order and duplicates", () => {
  it("errors on an out-of-order timestamp", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:00", "One"), row("b", "02:00", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[2].status).toBe("error");
    expect(reports[2].messages).toContain("Not in ascending order.");
  });

  it("treats an equal (duplicate) timestamp as not strictly ascending — an error", () => {
    const reports = buildChapterRowReports([row("a", "00:00", "One"), row("b", "00:00", "Two")], null);
    expect(reports[1].status).toBe("error");
    expect(reports[1].messages).toContain("Not in ascending order.");
    expect(reports[1].messages).toContain("Duplicate timestamp.");
  });

  it("flags duplicate timestamps on both rows", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:00", "One"), row("b", "01:00", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[1].messages).toContain("Duplicate timestamp.");
    expect(reports[2].messages).toContain("Duplicate timestamp.");
  });

  it("does not silently reorder or delete anything — it only reports", () => {
    const rows = [row("a", "02:00", "Two"), row("b", "01:00", "One")];
    buildChapterRowReports(rows, null);
    expect(rows).toEqual([row("a", "02:00", "Two"), row("b", "01:00", "One")]);
  });
});

describe("buildChapterRowReports — 10 second minimum interval", () => {
  it("errors when a chapter is under 10 seconds (9s)", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:00", "One"), row("b", "00:09", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[0].status).toBe("error");
    expect(reports[0].messages.some((m) => m.includes("10 seconds"))).toBe(true);
  });

  it("passes at exactly 10 seconds", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:00", "One"), row("b", "00:10", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[0].messages.some((m) => m.includes("10 seconds"))).toBe(false);
    expect(reports[0].status).toBe("ready");
  });

  it("passes at 11 seconds", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:00", "One"), row("b", "00:11", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[0].status).toBe("ready");
  });

  it("does not double-flag an interval that's already out of order", () => {
    const reports = buildChapterRowReports(
      [row("a", "00:10", "One"), row("b", "00:05", "Two"), row("c", "01:00", "Three")],
      null,
    );
    expect(reports[0].messages.some((m) => m.includes("10 seconds"))).toBe(false);
  });
});

describe("buildChapterRowReports — final chapter vs. video duration", () => {
  it("does not error the last chapter when no duration is supplied", () => {
    const reports = buildChapterRowReports(VALID_LIST, null);
    const last = reports[reports.length - 1];
    expect(last.status).toBe("ready");
  });

  it("errors when the last timestamp is at or after the supplied duration", () => {
    const duration = parseChapterDuration("08:10");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const last = reports[reports.length - 1];
    expect(last.status).toBe("error");
    expect(last.messages).toContain("This timestamp is at or after the video duration.");
  });

  it("errors when the final chapter is under 10 seconds based on duration (9s)", () => {
    const duration = parseChapterDuration("08:19");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const last = reports[reports.length - 1];
    expect(last.status).toBe("error");
    expect(last.messages.some((m) => m.includes("10 seconds"))).toBe(true);
  });

  it("passes when the final chapter is exactly 10 seconds based on duration", () => {
    const duration = parseChapterDuration("08:20");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const last = reports[reports.length - 1];
    expect(last.status).toBe("ready");
  });

  it("passes when the final chapter is well over 10 seconds based on duration", () => {
    const duration = parseChapterDuration("12:45");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const last = reports[reports.length - 1];
    expect(last.status).toBe("ready");
  });
});

describe("countParsedChapters", () => {
  it("counts only rows with a parsed timestamp", () => {
    const reports = buildChapterRowReports([row("a", "00:00", "One"), row("b", "abc", "Bad"), row("c", "", "")], null);
    expect(countParsedChapters(reports)).toBe(1);
  });
});

describe("buildChapterSummaryMessages", () => {
  it("flags fewer than 3 chapters as an error", () => {
    const rows = [row("a", "00:00", "One"), row("b", "01:00", "Two")];
    const reports = buildChapterRowReports(rows, null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    expect(summary.errors.some((e) => e.includes("at least 3 chapters"))).toBe(true);
  });

  it("does not flag the minimum-count error while every row is empty", () => {
    const reports = buildChapterRowReports([row("a", "", ""), row("b", "", "")], null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    expect(summary.errors).toEqual([]);
  });

  it("notes the final chapter isn't verified when no duration is supplied — as info, not a warning", () => {
    const reports = buildChapterRowReports(VALID_LIST, null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    expect(summary.info.some((i) => i.includes("optional video duration"))).toBe(true);
    expect(summary.warnings).toEqual([]);
  });

  it("does not note the final chapter as unverified once a duration is supplied", () => {
    const duration = parseChapterDuration("12:45");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const summary = buildChapterSummaryMessages(reports, "12:45", duration);
    expect(summary.info).toEqual([]);
    expect(summary.warnings).toEqual([]);
  });

  it("errors on an unparseable duration", () => {
    const duration = parseChapterDuration("not-a-time");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const summary = buildChapterSummaryMessages(reports, "not-a-time", duration);
    expect(summary.errors.some((e) => e.includes("valid video duration"))).toBe(true);
  });
});

describe("summarizeOverallChapterStatus / isChapterCopyAllowed", () => {
  it("is empty when nothing has been entered", () => {
    const { rowReports, summary, overall } = validate([row("a", "", ""), row("b", "", "")]);
    expect(rowReports.every((r) => r.status === "empty")).toBe(true);
    expect(summary.errors).toEqual([]);
    expect(overall).toBe("empty");
  });

  it("is ready and copy-allowed for a fully valid list with a verified final chapter", () => {
    const { overall } = validate(VALID_LIST, "12:45");
    expect(overall).toBe("ready");
    expect(isChapterCopyAllowed(overall)).toBe(true);
  });

  // Point 1 of the UX refinement: a missing OPTIONAL video duration must never
  // create a "warning" — it's not evidence anything is wrong with the list.
  it("is ready (NOT warning) and copy-allowed for a fully valid list with NO video duration supplied", () => {
    const { overall, summary } = validate(VALID_LIST, "");
    expect(overall).toBe("ready");
    expect(isChapterCopyAllowed(overall)).toBe(true);
    // The notice still exists, just as info — it must not be a warning.
    expect(summary.info.length).toBeGreaterThan(0);
    expect(summary.warnings).toEqual([]);
  });

  it("is error and blocks copying on fewer than 3 chapters", () => {
    const { overall } = validate([row("a", "00:00", "One"), row("b", "01:00", "Two")]);
    expect(overall).toBe("error");
    expect(isChapterCopyAllowed(overall)).toBe(false);
  });

  it("is error and blocks copying when the first timestamp isn't 00:00", () => {
    const rows = [row("a", "00:10", "One"), row("b", "01:00", "Two"), row("c", "02:00", "Three")];
    const { overall } = validate(rows, "05:00");
    expect(overall).toBe("error");
    expect(isChapterCopyAllowed(overall)).toBe(false);
  });

  it("is error and blocks copying on a sub-10-second chapter", () => {
    const rows = [row("a", "00:00", "One"), row("b", "00:05", "Two"), row("c", "01:00", "Three")];
    const { overall } = validate(rows, "02:00");
    expect(overall).toBe("error");
    expect(isChapterCopyAllowed(overall)).toBe(false);
  });

  it("is error and blocks copying when a timestamp is beyond the supplied duration", () => {
    const { overall } = validate(VALID_LIST, "05:00");
    expect(overall).toBe("error");
    expect(isChapterCopyAllowed(overall)).toBe(false);
  });

  it("is error and blocks copying on a missing title", () => {
    const rows = [row("a", "00:00", "One"), row("b", "01:00", ""), row("c", "02:00", "Three")];
    const { overall } = validate(rows, "05:00");
    expect(overall).toBe("error");
    expect(isChapterCopyAllowed(overall)).toBe(false);
  });
});

describe("buildChapterRequirementChecks", () => {
  it("reports all five checks as pass for a fully valid, duration-verified list", () => {
    const duration = parseChapterDuration("12:45");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const summary = buildChapterSummaryMessages(reports, "12:45", duration);
    const checks = buildChapterRequirementChecks(reports, summary);
    expect(checks.map((c) => c.status)).toEqual(["pass", "pass", "pass", "pass", "pass"]);
    expect(checks.map((c) => c.id)).toEqual([
      "first-zero",
      "minimum-count",
      "ascending-order",
      "known-intervals",
      "final-chapter-length",
    ]);
  });

  // Point 2 of the UX refinement: the 10-second rule splits into what's actually
  // known (always checkable) vs. the final chapter (only checkable with a duration).
  it("marks known-intervals as Pass and final-chapter-length as info (not warning/fail) when duration is missing", () => {
    const reports = buildChapterRowReports(VALID_LIST, null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    const checks = buildChapterRequirementChecks(reports, summary);

    const knownIntervals = checks.find((c) => c.id === "known-intervals");
    expect(knownIntervals?.status).toBe("pass");
    expect(knownIntervals?.message).toMatch(/meet YouTube's 10-second minimum/i);

    const finalChapter = checks.find((c) => c.id === "final-chapter-length");
    expect(finalChapter?.status).toBe("info");
    expect(finalChapter?.message).toMatch(/optional video duration/i);
  });

  it("marks final-chapter-length as fail when the supplied duration makes it too short", () => {
    const duration = parseChapterDuration("08:19"); // 9s final chapter
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const summary = buildChapterSummaryMessages(reports, "08:19", duration);
    const checks = buildChapterRequirementChecks(reports, summary);

    expect(checks.find((c) => c.id === "known-intervals")?.status).toBe("pass");
    expect(checks.find((c) => c.id === "final-chapter-length")?.status).toBe("fail");
  });

  it("marks final-chapter-length as fail when the final timestamp is at/after the supplied duration", () => {
    const duration = parseChapterDuration("08:10");
    const reports = buildChapterRowReports(VALID_LIST, duration.seconds);
    const summary = buildChapterSummaryMessages(reports, "08:10", duration);
    const checks = buildChapterRequirementChecks(reports, summary);

    expect(checks.find((c) => c.id === "final-chapter-length")?.status).toBe("fail");
  });

  it("marks known-intervals as fail when a non-final chapter is too short, independent of duration", () => {
    const rows = [row("a", "00:00", "One"), row("b", "00:05", "Two"), row("c", "01:00", "Three")];
    const reports = buildChapterRowReports(rows, null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    const checks = buildChapterRequirementChecks(reports, summary);

    expect(checks.find((c) => c.id === "known-intervals")?.status).toBe("fail");
  });

  it("marks the minimum-count check as fail with fewer than 3 chapters", () => {
    const rows = [row("a", "00:00", "One"), row("b", "01:00", "Two")];
    const reports = buildChapterRowReports(rows, null);
    const summary = buildChapterSummaryMessages(reports, "", parseChapterDuration(""));
    const checks = buildChapterRequirementChecks(reports, summary);
    expect(checks.find((c) => c.id === "minimum-count")?.status).toBe("fail");
  });
});

describe("mergePastedChapterRows", () => {
  function pasteLine(timeText: string, label: string): ParsedPasteLine {
    return { timeText, label };
  }

  function idGenerator(prefix = "new") {
    let n = 0;
    return () => {
      n += 1;
      return `${prefix}-${n}`;
    };
  }

  // Point A: default three blank rows + pasted list -> only pasted rows remain.
  it("drops every row when all existing rows are completely blank, leaving only pasted rows", () => {
    const existing = [row("a", "", ""), row("b", "", ""), row("c", "", "")];
    const pasted = [pasteLine("00:00", "Introduction"), pasteLine("01:25", "Choosing your topic"), pasteLine("03:20", "Recording the video")];

    const merged = mergePastedChapterRows(existing, pasted, idGenerator());

    expect(merged).toHaveLength(3);
    expect(merged.map((r) => ({ time: r.time, title: r.title }))).toEqual([
      { time: "00:00", title: "Introduction" },
      { time: "01:25", title: "Choosing your topic" },
      { time: "03:20", title: "Recording the video" },
    ]);
  });

  // Point B: real rows + one blank row + pasted list -> real rows preserved,
  // blank row removed, pasted rows appended after them (never before).
  it("preserves real rows, drops the blank row, and appends pasted rows after the real ones", () => {
    const existing = [row("a", "00:00", "Intro"), row("b", "01:30", "Topic"), row("c", "", "")];
    const pasted = [pasteLine("03:00", "Editing"), pasteLine("05:00", "Export")];

    const merged = mergePastedChapterRows(existing, pasted, idGenerator());

    expect(merged.map((r) => ({ time: r.time, title: r.title }))).toEqual([
      { time: "00:00", title: "Intro" },
      { time: "01:30", title: "Topic" },
      { time: "03:00", title: "Editing" },
      { time: "05:00", title: "Export" },
    ]);
  });

  // Point C: a row with only a time (no title yet) or only a title (no time
  // yet) is partially filled, not blank, and must be preserved.
  it("preserves a partially filled row (time only)", () => {
    const existing = [row("a", "01:20", "")];
    const merged = mergePastedChapterRows(existing, [pasteLine("02:00", "Next")], idGenerator());
    expect(merged.map((r) => ({ time: r.time, title: r.title }))).toEqual([
      { time: "01:20", title: "" },
      { time: "02:00", title: "Next" },
    ]);
  });

  it("preserves a partially filled row (title only)", () => {
    const existing = [row("a", "", "Introduction")];
    const merged = mergePastedChapterRows(existing, [pasteLine("02:00", "Next")], idGenerator());
    expect(merged.map((r) => ({ time: r.time, title: r.title }))).toEqual([
      { time: "", title: "Introduction" },
      { time: "02:00", title: "Next" },
    ]);
  });

  it("treats a whitespace-only row as blank and drops it", () => {
    const existing = [row("a", "   ", "  ")];
    const merged = mergePastedChapterRows(existing, [pasteLine("00:00", "Intro")], idGenerator());
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ time: "00:00", title: "Intro" });
  });

  it("does not mutate the original rows array", () => {
    const existing = [row("a", "", "")];
    mergePastedChapterRows(existing, [pasteLine("00:00", "Intro")], idGenerator());
    expect(existing).toEqual([row("a", "", "")]);
  });

  it("assigns fresh ids to pasted rows via the provided generator, keeping existing ids untouched", () => {
    const existing = [row("existing-id", "00:00", "Intro")];
    const merged = mergePastedChapterRows(existing, [pasteLine("01:00", "Next")], idGenerator("paste"));
    expect(merged[0].id).toBe("existing-id");
    expect(merged[1].id).toBe("paste-1");
  });
});

describe("sortChapterRows", () => {
  it("sorts rows by parsed time ascending without mutating the input", () => {
    const rows = [row("a", "01:00", "Second"), row("b", "00:30", "First")];
    const sorted = sortChapterRows(rows);
    expect(sorted.map((r) => r.id)).toEqual(["b", "a"]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("sorts unparseable rows to the end, preserving relative order", () => {
    const rows = [row("a", "abc", "Bad"), row("b", "01:00", "Good"), row("c", "xyz", "Bad two")];
    expect(sortChapterRows(rows).map((r) => r.id)).toEqual(["b", "a", "c"]);
  });
});

describe("formatChaptersForCopy", () => {
  it("produces the exact YouTube-ready chapter block", () => {
    expect(formatChaptersForCopy(VALID_LIST)).toBe(
      "00:00 Introduction\n01:35 Choosing your topic\n04:20 Recording the video\n08:10 Editing workflow",
    );
  });

  it("omits rows with an invalid timestamp", () => {
    const rows = [row("a", "00:00", "Intro"), row("b", "1:75", "Broken")];
    expect(formatChaptersForCopy(rows)).toBe("00:00 Intro");
  });

  it("omits rows with a missing title", () => {
    const rows = [row("a", "00:00", "Intro"), row("b", "01:00", "")];
    expect(formatChaptersForCopy(rows)).toBe("00:00 Intro");
  });

  it("omits fully empty rows", () => {
    const rows = [row("a", "00:00", "Intro"), row("b", "", "")];
    expect(formatChaptersForCopy(rows)).toBe("00:00 Intro");
  });

  it("preserves user wording, punctuation, and capitalization exactly", () => {
    const rows = [row("a", "00:00", "Intro: Let's GO!")];
    expect(formatChaptersForCopy(rows)).toBe("00:00 Intro: Let's GO!");
  });

  it("preserves current row order rather than auto-sorting", () => {
    const rows = [row("a", "01:00", "Second"), row("b", "00:30", "First")];
    expect(formatChaptersForCopy(rows)).toBe("01:00 Second\n00:30 First");
  });
});
