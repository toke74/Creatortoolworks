import { describe, expect, it } from "vitest";
import {
  buildTimestampRowReports,
  formatTimestamp,
  formatTimestampsForCopy,
  isTimestampCopyAllowed,
  parsePastedTimestampList,
  parseTimestamp,
  sortTimestampRows,
  summarizeOverallTimestampStatus,
} from "@/lib/tools/timestamp-generator/parse";
import type { TimestampRowInput } from "@/lib/tools/timestamp-generator/types";

function row(id: string, time: string, label = ""): TimestampRowInput {
  return { id, time, label };
}

describe("parseTimestamp", () => {
  const validCases: [string, number][] = [
    ["0", 0],
    ["5", 5],
    ["59", 59],
    ["60", 60],
    ["90", 90],
    ["0:00", 0],
    ["0:05", 5],
    ["1:05", 65],
    ["01:05", 65],
    ["59:59", 3599],
    ["60:00", 3600],
    ["90:00", 5400],
    ["1:00:00", 3600],
    ["1:02:03", 3723],
    ["12:59:59", 46799],
  ];

  it.each(validCases)("accepts %s as %i total seconds", (input, expected) => {
    const result = parseTimestamp(input);
    expect(result.ok).toBe(true);
    expect(result.ok && result.totalSeconds).toBe(expected);
  });

  const invalidCases = ["-5", "abc", "1:60", "1:75", "1:60:00", "1:00:60", "1::20", ":::", "1.30"];

  it.each(invalidCases)("rejects %s", (input) => {
    const result = parseTimestamp(input);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(parseTimestamp("").ok).toBe(false);
    expect(parseTimestamp("   ").ok).toBe(false);
  });
});

describe("formatTimestamp", () => {
  const cases: [number, string][] = [
    [0, "00:00"],
    [5, "00:05"],
    [59, "00:59"],
    [60, "01:00"],
    [90, "01:30"],
    [3599, "59:59"],
    [3600, "1:00:00"],
    [5400, "1:30:00"],
    [3723, "1:02:03"],
    [46799, "12:59:59"],
  ];

  it.each(cases)("formats %i seconds as %s", (input, expected) => {
    expect(formatTimestamp(input)).toBe(expected);
  });

  it("never zero-pads hours", () => {
    expect(formatTimestamp(3600)).toBe("1:00:00");
    expect(formatTimestamp(12 * 3600)).toBe("12:00:00");
  });
});

describe("parsePastedTimestampList", () => {
  it("parses a normal timestamp-first line", () => {
    expect(parsePastedTimestampList("0:00 Intro")).toEqual([{ timeText: "0:00", label: "Intro" }]);
  });

  it("strips a leading hyphen separator", () => {
    expect(parsePastedTimestampList("0:00 - Intro")).toEqual([{ timeText: "0:00", label: "Intro" }]);
  });

  it("strips a leading en dash separator", () => {
    expect(parsePastedTimestampList("0:00 – Intro")).toEqual([{ timeText: "0:00", label: "Intro" }]);
  });

  it("strips a leading em dash separator", () => {
    expect(parsePastedTimestampList("0:00 — Intro")).toEqual([{ timeText: "0:00", label: "Intro" }]);
  });

  it("strips a leading pipe separator", () => {
    expect(parsePastedTimestampList("0:00 | Intro")).toEqual([{ timeText: "0:00", label: "Intro" }]);
  });

  it("ignores blank lines", () => {
    expect(parsePastedTimestampList("0:00 Intro\n\n\n1:00 Next")).toEqual([
      { timeText: "0:00", label: "Intro" },
      { timeText: "1:00", label: "Next" },
    ]);
  });

  it("trims extra whitespace around the separator", () => {
    expect(parsePastedTimestampList("  1:05   -   Setup  ")).toEqual([{ timeText: "1:05", label: "Setup" }]);
  });

  it("handles CRLF line endings", () => {
    expect(parsePastedTimestampList("0:00 Intro\r\n1:00 Next")).toEqual([
      { timeText: "0:00", label: "Intro" },
      { timeText: "1:00", label: "Next" },
    ]);
  });

  it("handles LF line endings", () => {
    expect(parsePastedTimestampList("0:00 Intro\n1:00 Next")).toEqual([
      { timeText: "0:00", label: "Intro" },
      { timeText: "1:00", label: "Next" },
    ]);
  });

  it("preserves duplicate timestamps for downstream validation", () => {
    expect(parsePastedTimestampList("0:00 Intro\n0:00 Intro again")).toEqual([
      { timeText: "0:00", label: "Intro" },
      { timeText: "0:00", label: "Intro again" },
    ]);
  });

  it("keeps an invalid first token as-is for downstream validation", () => {
    expect(parsePastedTimestampList("abc Intro")).toEqual([{ timeText: "abc", label: "Intro" }]);
  });

  it("preserves punctuation inside a label", () => {
    expect(parsePastedTimestampList("0:00 Intro: Welcome!")).toEqual([
      { timeText: "0:00", label: "Intro: Welcome!" },
    ]);
  });

  it("preserves inner colons and hyphens in a label after the leading separator", () => {
    expect(parsePastedTimestampList("1:05 - Q&A - Part 1")).toEqual([{ timeText: "1:05", label: "Q&A - Part 1" }]);
  });

  it("handles a line with no label", () => {
    expect(parsePastedTimestampList("0:00")).toEqual([{ timeText: "0:00", label: "" }]);
  });
});

describe("buildTimestampRowReports", () => {
  it("treats a fully blank row as empty, not an error", () => {
    const reports = buildTimestampRowReports([row("a", "", "")]);
    expect(reports[0].status).toBe("empty");
  });

  it("marks a valid row as ready when a label is present", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "Intro")]);
    expect(reports[0].status).toBe("ready");
    expect(reports[0].formatted).toBe("00:05");
  });

  it("flags an invalid timestamp as an error", () => {
    const reports = buildTimestampRowReports([row("a", "1:75", "Intro")]);
    expect(reports[0].status).toBe("error");
  });

  it("flags a missing label as a warning, not an error", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "")]);
    expect(reports[0].status).toBe("warning");
    expect(reports[0].messages).toContain("Missing label.");
  });

  it("flags duplicate timestamps as warnings on both rows", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "One"), row("b", "0:05", "Two")]);
    expect(reports[0].status).toBe("warning");
    expect(reports[1].status).toBe("warning");
    expect(reports[0].messages).toContain("Duplicate timestamp.");
  });

  it("flags an out-of-order row without touching the earlier row", () => {
    const reports = buildTimestampRowReports([row("a", "1:00", "One"), row("b", "0:30", "Two")]);
    expect(reports[0].status).toBe("ready");
    expect(reports[1].status).toBe("warning");
    expect(reports[1].messages).toContain("Out of order.");
  });

  it("does not silently reorder or delete anything — it only reports", () => {
    const rows = [row("a", "1:00", "One"), row("b", "0:30", "Two")];
    buildTimestampRowReports(rows);
    expect(rows).toEqual([row("a", "1:00", "One"), row("b", "0:30", "Two")]);
  });
});

describe("summarizeOverallTimestampStatus", () => {
  it("is ready when every row is empty or ready", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "One")]);
    expect(summarizeOverallTimestampStatus(reports)).toBe("ready");
  });

  it("is warning when a row has a warning but no errors", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "")]);
    expect(summarizeOverallTimestampStatus(reports)).toBe("warning");
  });

  it("is error when any row has an error, even alongside warnings", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", ""), row("b", "1:75", "Bad")]);
    expect(summarizeOverallTimestampStatus(reports)).toBe("error");
  });
});

describe("isTimestampCopyAllowed", () => {
  it("allows copying when every row is ready", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "Intro")]);
    expect(isTimestampCopyAllowed(reports)).toBe(true);
  });

  it("allows copying when a row only has a warning", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", ""), row("b", "0:05", "Dup")]);
    expect(reports.some((r) => r.status === "warning")).toBe(true);
    expect(isTimestampCopyAllowed(reports)).toBe(true);
  });

  it("blocks copying when any row has an error, even alongside ready/warning rows", () => {
    const reports = buildTimestampRowReports([row("a", "0:05", "One"), row("b", "1:75", "Bad")]);
    expect(isTimestampCopyAllowed(reports)).toBe(false);
  });

  it("allows copying again once the erroring row is corrected", () => {
    const before = buildTimestampRowReports([row("a", "1:75", "Bad")]);
    expect(isTimestampCopyAllowed(before)).toBe(false);

    const after = buildTimestampRowReports([row("a", "1:05", "Fixed")]);
    expect(isTimestampCopyAllowed(after)).toBe(true);
  });
});

describe("sortTimestampRows", () => {
  it("sorts rows by parsed time ascending", () => {
    const rows = [row("a", "1:00", "Second"), row("b", "0:30", "First")];
    expect(sortTimestampRows(rows).map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("only sorts on explicit call — never mutates the input array", () => {
    const rows = [row("a", "1:00", "Second"), row("b", "0:30", "First")];
    const sorted = sortTimestampRows(rows);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
    expect(sorted).not.toBe(rows);
  });

  it("sorts unparseable rows to the end, preserving their relative order", () => {
    const rows = [row("a", "abc", "Bad one"), row("b", "1:00", "Good"), row("c", "xyz", "Bad two")];
    expect(sortTimestampRows(rows).map((r) => r.id)).toEqual(["b", "a", "c"]);
  });
});

describe("formatTimestampsForCopy", () => {
  it("produces plain text lines with no bullets, markdown, or numbering", () => {
    const rows = [row("a", "0:00", "Introduction"), row("b", "1:25", "Setup")];
    expect(formatTimestampsForCopy(rows)).toBe("00:00 Introduction\n01:25 Setup");
  });

  it("omits a row with an invalid timestamp", () => {
    const rows = [row("a", "0:00", "Introduction"), row("b", "1:75", "Broken")];
    expect(formatTimestampsForCopy(rows)).toBe("00:00 Introduction");
  });

  it("omits fully empty rows", () => {
    const rows = [row("a", "0:00", "Introduction"), row("b", "", "")];
    expect(formatTimestampsForCopy(rows)).toBe("00:00 Introduction");
  });

  it("includes a row with a warning (duplicate/order/missing label)", () => {
    const rows = [row("a", "0:00", "")];
    expect(formatTimestampsForCopy(rows)).toBe("00:00");
  });

  it("preserves the current row order rather than auto-sorting", () => {
    const rows = [row("a", "1:00", "Second"), row("b", "0:30", "First")];
    expect(formatTimestampsForCopy(rows)).toBe("01:00 Second\n00:30 First");
  });
});
