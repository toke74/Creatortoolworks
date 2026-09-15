import { describe, expect, it } from "vitest";
import {
  buildTitleReport,
  countEmoji,
  countTitleCharacters,
  normalizeRepeatedSpaces,
} from "@/lib/tools/title-checker/analyze";

describe("title checker analysis", () => {
  it("treats empty input as neutral", () => {
    expect(buildTitleReport("", 100)).toMatchObject({
      characterCount: 0,
      remainingCharacters: 100,
      wordCount: 0,
      status: "empty",
    });
  });

  it("handles the 99, 100, and 101 character boundaries", () => {
    expect(buildTitleReport("a".repeat(99), 100)).toMatchObject({
      characterCount: 99,
      remainingCharacters: 1,
      overLimitBy: 0,
      status: "ready",
    });
    expect(buildTitleReport("a".repeat(100), 100)).toMatchObject({
      characterCount: 100,
      remainingCharacters: 0,
      overLimitBy: 0,
      status: "ready",
    });
    expect(buildTitleReport("a".repeat(101), 100)).toMatchObject({
      characterCount: 101,
      remainingCharacters: -1,
      overLimitBy: 1,
      status: "error",
    });
  });

  it("counts surrogate-pair emoji as one character", () => {
    expect(countTitleCharacters("A 😀 B")).toBe(5);
    expect(countEmoji("A 😀 B")).toBe(1);
  });

  it("reports informational metrics without changing pass/fail status", () => {
    const report = buildTitleReport("EDIT 2026: Better Shorts 🚀", 100);

    expect(report.status).toBe("ready");
    expect(report.wordCount).toBe(5);
    expect(report.capitalLetterCount).toBe(6);
    expect(report.digitCount).toBe(4);
    expect(report.emojiCount).toBe(1);
  });

  it("normalizes repeated ordinary spaces and is idempotent", () => {
    const once = normalizeRepeatedSpaces("A   title  with spaces");
    expect(once).toBe("A title with spaces");
    expect(normalizeRepeatedSpaces(once)).toBe(once);
  });
});
