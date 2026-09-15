import type { TitleReport, TitleStatus } from "./types";

/**
 * Count by Unicode code point rather than UTF-16 code unit, matching the
 * project's existing text-tool convention for emoji and other surrogate pairs.
 */
export function countTitleCharacters(title: string): number {
  return Array.from(title).length;
}

export function countTitleWords(title: string): number {
  const trimmed = title.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countCapitalLetters(title: string): number {
  return Array.from(title.matchAll(/\p{Lu}/gu)).length;
}

export function countDigits(title: string): number {
  return Array.from(title.matchAll(/\p{Number}/gu)).length;
}

export function countEmoji(title: string): number {
  return Array.from(title.matchAll(/\p{Extended_Pictographic}/gu)).length;
}

export function countRepeatedSpaceRuns(title: string): number {
  return title.match(/ {2,}/g)?.length ?? 0;
}

export function normalizeRepeatedSpaces(title: string): string {
  return title.replace(/ {2,}/g, " ");
}

export function buildTitleReport(title: string, maxCharacters: number): TitleReport {
  const characterCount = countTitleCharacters(title);
  const overLimitBy = Math.max(0, characterCount - maxCharacters);
  const status: TitleStatus = characterCount === 0 ? "empty" : overLimitBy > 0 ? "error" : "ready";

  return {
    characterCount,
    remainingCharacters: maxCharacters - characterCount,
    overLimitBy,
    wordCount: countTitleWords(title),
    capitalLetterCount: countCapitalLetters(title),
    digitCount: countDigits(title),
    emojiCount: countEmoji(title),
    repeatedSpaceRuns: countRepeatedSpaceRuns(title),
    status,
  };
}

export function isTitleCopyAllowed(report: TitleReport): boolean {
  return report.status === "ready";
}
