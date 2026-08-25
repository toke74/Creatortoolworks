import type { DescriptionReport, DescriptionStatus } from "./types";

/** Converts CRLF/CR line endings to LF so line-based logic treats them identically. */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Character count by Unicode code point (not UTF-16 code unit), so a single emoji
 * built from a surrogate pair counts as one character rather than two.
 */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Number of lines as a user would see them in the textarea; an empty description is 0 lines. */
export function countLines(text: string): number {
  if (text === "") return 0;
  return normalizeLineEndings(text).split("\n").length;
}

const URL_PATTERN = /https?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+\.[^\s<>"']+/gi;

export function detectLinks(text: string): number {
  return text.match(URL_PATTERN)?.length ?? 0;
}

const HASHTAG_PATTERN = /(^|\s)#[^\s#]+/g;

export function detectHashtags(text: string): number {
  return text.match(HASHTAG_PATTERN)?.length ?? 0;
}

/** Builds the full read-only analysis of a description against the official character limit. */
export function buildDescriptionReport(text: string, maxCharacters: number): DescriptionReport {
  const characterCount = countCharacters(text);
  const overLimitBy = Math.max(0, characterCount - maxCharacters);
  const status: DescriptionStatus = text.trim() === "" ? "empty" : overLimitBy > 0 ? "error" : "ready";

  return {
    characterCount,
    remainingCharacters: maxCharacters - characterCount,
    wordCount: countWords(text),
    lineCount: countLines(text),
    linkCount: detectLinks(text),
    hashtagCount: detectHashtags(text),
    overLimitBy,
    status,
  };
}

/** Copying is blocked only while the description exceeds the official character limit. */
export function isDescriptionCopyAllowed(report: DescriptionReport): boolean {
  return report.status !== "error";
}

/** Removes trailing spaces/tabs from every line without touching leading whitespace or content. */
export function trimTrailingWhitespace(text: string): string {
  return normalizeLineEndings(text)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");
}

/** Collapses runs of two or more consecutive blank lines down to a single blank line. */
export function normalizeExcessiveBlankLines(text: string): string {
  const lines = normalizeLineEndings(text).split("\n");
  const result: string[] = [];
  let previousBlank = false;

  for (const line of lines) {
    const isBlank = line.trim() === "";
    if (isBlank && previousBlank) continue;
    result.push(line);
    previousBlank = isBlank;
  }

  return result.join("\n");
}

/** Removes blank lines at the very start and end of the description; internal spacing is untouched. */
export function trimLeadingTrailingBlankLines(text: string): string {
  const lines = normalizeLineEndings(text).split("\n");
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;

  return lines.slice(start, end).join("\n");
}

/**
 * Runs every safe cleanup step in a fixed order. Never touches wording, capitalization,
 * punctuation, links, hashtags, or timestamps — only whitespace and blank-line structure.
 * Deterministic and idempotent: running it again on its own output is a no-op.
 */
export function applyAllSafeCleanup(text: string): string {
  const trimmedLines = trimTrailingWhitespace(text);
  const trimmedEdges = trimLeadingTrailingBlankLines(trimmedLines);
  return normalizeExcessiveBlankLines(trimmedEdges);
}
