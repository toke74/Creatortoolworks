import { describe, expect, it } from "vitest";
import {
  applyAllSafeCleanup,
  buildDescriptionReport,
  countCharacters,
  countLines,
  countWords,
  detectHashtags,
  detectLinks,
  isDescriptionCopyAllowed,
  normalizeExcessiveBlankLines,
  normalizeLineEndings,
  trimLeadingTrailingBlankLines,
  trimTrailingWhitespace,
} from "@/lib/tools/description-formatter/analyze";

const MAX = 5000;

describe("countCharacters", () => {
  it("counts an empty string as zero", () => {
    expect(countCharacters("")).toBe(0);
  });

  it("counts a plain ASCII string", () => {
    expect(countCharacters("hello world")).toBe(11);
  });

  it("counts a surrogate-pair emoji as one character", () => {
    expect(countCharacters("👍")).toBe(1);
    expect(countCharacters("hi 👍")).toBe(4);
  });
});

describe("countWords", () => {
  it("counts zero words for an empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("counts zero words for whitespace-only input", () => {
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("counts words separated by single spaces", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("counts words across multiple lines and repeated whitespace", () => {
    expect(countWords("one  two\nthree\n\nfour")).toBe(4);
  });
});

describe("countLines", () => {
  it("counts zero lines for an empty string", () => {
    expect(countLines("")).toBe(0);
  });

  it("counts a single line with no line breaks as one line", () => {
    expect(countLines("hello")).toBe(1);
  });

  it("counts lines separated by LF", () => {
    expect(countLines("a\nb\nc")).toBe(3);
  });

  it("counts lines separated by CRLF the same as LF", () => {
    expect(countLines("a\r\nb\r\nc")).toBe(3);
  });

  it("counts a trailing newline as an additional (empty) line", () => {
    expect(countLines("a\n")).toBe(2);
  });
});

describe("normalizeLineEndings", () => {
  it("converts CRLF to LF", () => {
    expect(normalizeLineEndings("a\r\nb")).toBe("a\nb");
  });

  it("converts lone CR to LF", () => {
    expect(normalizeLineEndings("a\rb")).toBe("a\nb");
  });

  it("leaves LF untouched", () => {
    expect(normalizeLineEndings("a\nb")).toBe("a\nb");
  });
});

describe("detectLinks", () => {
  it("detects zero links when none are present", () => {
    expect(detectLinks("just some text")).toBe(0);
  });

  it("detects an https link", () => {
    expect(detectLinks("Watch here: https://example.com/video")).toBe(1);
  });

  it("detects an http link", () => {
    expect(detectLinks("http://example.com")).toBe(1);
  });

  it("detects a www link without a scheme", () => {
    expect(detectLinks("Visit www.example.com for more")).toBe(1);
  });

  it("detects multiple links", () => {
    expect(detectLinks("https://a.com and https://b.com and www.c.com/page")).toBe(3);
  });
});

describe("detectHashtags", () => {
  it("detects zero hashtags when none are present", () => {
    expect(detectHashtags("just some text")).toBe(0);
  });

  it("detects a single hashtag", () => {
    expect(detectHashtags("Check this out #shorts")).toBe(1);
  });

  it("detects multiple space-separated hashtags", () => {
    expect(detectHashtags("#shorts #tutorial #editing")).toBe(3);
  });

  it("detects a hashtag at the start of a line", () => {
    expect(detectHashtags("line one\n#shorts")).toBe(1);
  });
});

describe("buildDescriptionReport", () => {
  it("reports empty status for an empty description", () => {
    const report = buildDescriptionReport("", MAX);
    expect(report.status).toBe("empty");
    expect(report.characterCount).toBe(0);
    expect(report.remainingCharacters).toBe(MAX);
    expect(report.overLimitBy).toBe(0);
  });

  it("reports ready status at exactly the 5,000-character limit", () => {
    const text = "a".repeat(5000);
    const report = buildDescriptionReport(text, MAX);
    expect(report.characterCount).toBe(5000);
    expect(report.status).toBe("ready");
    expect(report.remainingCharacters).toBe(0);
    expect(report.overLimitBy).toBe(0);
  });

  it("reports error status one character over the limit and states how many to remove", () => {
    const text = "a".repeat(5001);
    const report = buildDescriptionReport(text, MAX);
    expect(report.characterCount).toBe(5001);
    expect(report.status).toBe("error");
    expect(report.remainingCharacters).toBe(-1);
    expect(report.overLimitBy).toBe(1);
  });

  it("computes the correct overLimitBy for a description far over the limit", () => {
    const text = "a".repeat(5200);
    const report = buildDescriptionReport(text, MAX);
    expect(report.overLimitBy).toBe(200);
  });

  it("computes remaining characters for a short description", () => {
    const report = buildDescriptionReport("hello", MAX);
    expect(report.remainingCharacters).toBe(MAX - 5);
  });

  it("aggregates word, line, link, and hashtag counts", () => {
    const report = buildDescriptionReport("Watch here https://example.com\n#shorts #editing", MAX);
    expect(report.wordCount).toBe(5);
    expect(report.lineCount).toBe(2);
    expect(report.linkCount).toBe(1);
    expect(report.hashtagCount).toBe(2);
  });
});

describe("isDescriptionCopyAllowed", () => {
  it("allows copying at exactly the limit", () => {
    const report = buildDescriptionReport("a".repeat(5000), MAX);
    expect(isDescriptionCopyAllowed(report)).toBe(true);
  });

  it("allows copying under the limit", () => {
    const report = buildDescriptionReport("hello", MAX);
    expect(isDescriptionCopyAllowed(report)).toBe(true);
  });

  it("blocks copying one character over the limit", () => {
    const report = buildDescriptionReport("a".repeat(5001), MAX);
    expect(isDescriptionCopyAllowed(report)).toBe(false);
  });

  it("re-allows copying once an over-limit description is fixed", () => {
    const before = buildDescriptionReport("a".repeat(5001), MAX);
    expect(isDescriptionCopyAllowed(before)).toBe(false);

    const after = buildDescriptionReport("a".repeat(5000), MAX);
    expect(isDescriptionCopyAllowed(after)).toBe(true);
  });
});

describe("trimTrailingWhitespace", () => {
  it("removes trailing spaces and tabs from each line", () => {
    expect(trimTrailingWhitespace("hello   \nworld\t\t\nfoo")).toBe("hello\nworld\nfoo");
  });

  it("does not touch leading whitespace or interior content", () => {
    expect(trimTrailingWhitespace("  hello   \n  world")).toBe("  hello\n  world");
  });

  it("normalizes CRLF to LF while trimming", () => {
    expect(trimTrailingWhitespace("a  \r\nb  \r\n")).toBe("a\nb\n");
  });

  it("is idempotent", () => {
    const once = trimTrailingWhitespace("hello   \nworld  ");
    expect(trimTrailingWhitespace(once)).toBe(once);
  });
});

describe("normalizeExcessiveBlankLines", () => {
  it("collapses three consecutive blank lines down to one", () => {
    expect(normalizeExcessiveBlankLines("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("leaves a single blank line untouched", () => {
    expect(normalizeExcessiveBlankLines("a\n\nb")).toBe("a\n\nb");
  });

  it("leaves text with no blank lines untouched", () => {
    expect(normalizeExcessiveBlankLines("a\nb\nc")).toBe("a\nb\nc");
  });

  it("is idempotent", () => {
    const once = normalizeExcessiveBlankLines("a\n\n\n\n\nb\n\n\n\nc");
    expect(normalizeExcessiveBlankLines(once)).toBe(once);
  });
});

describe("trimLeadingTrailingBlankLines", () => {
  it("removes blank lines at the start and end", () => {
    expect(trimLeadingTrailingBlankLines("\n\nhello\nworld\n\n\n")).toBe("hello\nworld");
  });

  it("preserves internal blank lines", () => {
    expect(trimLeadingTrailingBlankLines("\nhello\n\nworld\n")).toBe("hello\n\nworld");
  });

  it("leaves text with no leading/trailing blank lines untouched", () => {
    expect(trimLeadingTrailingBlankLines("hello\nworld")).toBe("hello\nworld");
  });

  it("is idempotent", () => {
    const once = trimLeadingTrailingBlankLines("\n\nhello\n\n");
    expect(trimLeadingTrailingBlankLines(once)).toBe(once);
  });
});

describe("applyAllSafeCleanup", () => {
  it("trims trailing whitespace, blank edges, and excessive blank lines together", () => {
    const input = "\n\nhello   \n\n\n\nworld  \n\n";
    expect(applyAllSafeCleanup(input)).toBe("hello\n\nworld");
  });

  it("never touches wording, links, or hashtags", () => {
    const input = "  Check this out: https://example.com/video   \n\n\n#shorts #editing  ";
    const result = applyAllSafeCleanup(input);
    expect(result).toContain("https://example.com/video");
    expect(result).toContain("#shorts #editing");
    expect(result).toContain("Check this out:");
  });

  it("is idempotent — running it twice produces the same result", () => {
    const input = "\n\n  a  \n\n\n\n  b  \n\n\n";
    const once = applyAllSafeCleanup(input);
    const twice = applyAllSafeCleanup(once);
    expect(twice).toBe(once);
  });

  it("is a no-op on already-clean text", () => {
    const clean = "hello\n\nworld";
    expect(applyAllSafeCleanup(clean)).toBe(clean);
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(applyAllSafeCleanup("\n\n   \n\n")).toBe("");
  });
});
