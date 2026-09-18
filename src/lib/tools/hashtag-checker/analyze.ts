import type { ExtractedHashtag, HashtagReport, HashtagStatus } from "./types";

const HASHTAG_PATTERN = /(^|[\s([{"'<>])#([\p{L}\p{N}\p{M}_]+)/gu;

export function extractHashtags(input: string): ExtractedHashtag[] {
  const counts = new Map<string, number>();
  const hashtags: ExtractedHashtag[] = [];

  for (const match of input.matchAll(HASHTAG_PATTERN)) {
    const prefix = match[1] ?? "";
    const body = match[2] ?? "";
    if (!body) continue;

    const value = `#${body}`;
    const startIndex = (match.index ?? 0) + prefix.length;
    const endIndex = startIndex + value.length;
    const occurrence = (counts.get(value) ?? 0) + 1;
    counts.set(value, occurrence);

    hashtags.push({
      value,
      startIndex,
      endIndex,
      occurrence,
      duplicate: occurrence > 1,
    });
  }

  return hashtags;
}

export function buildHashtagReport(input: string, threshold: number): HashtagReport {
  const hashtags = extractHashtags(input);
  const totalCount = hashtags.length;
  const uniqueCount = new Set(hashtags.map((hashtag) => hashtag.value)).size;
  const duplicateCount = totalCount - uniqueCount;
  const overThresholdBy = Math.max(0, totalCount - threshold);
  const remainingUntilThreshold = Math.max(0, threshold - totalCount);
  const status: HashtagStatus =
    input.length === 0 ? "empty" : totalCount === 0 ? "none" : overThresholdBy > 0 ? "error" : "ready";

  return {
    status,
    hashtags,
    totalCount,
    uniqueCount,
    duplicateCount,
    threshold,
    remainingUntilThreshold,
    overThresholdBy,
    displayedOutput: hashtags.map((hashtag) => hashtag.value).join("\n"),
  };
}

export function removeDuplicateHashtagOccurrences(input: string): string {
  const hashtags = extractHashtags(input);
  if (!hashtags.some((hashtag) => hashtag.duplicate)) return input;

  let output = "";
  let cursor = 0;

  for (const hashtag of hashtags) {
    output += input.slice(cursor, hashtag.startIndex);
    if (!hashtag.duplicate) output += input.slice(hashtag.startIndex, hashtag.endIndex);
    cursor = hashtag.endIndex;
  }

  output += input.slice(cursor);
  return output;
}
