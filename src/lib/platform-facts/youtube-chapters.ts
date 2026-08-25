import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/9884579?hl=en (verified 2026-08-23).
// These describe YouTube's requirements for formal, creator-added "video chapters" —
// NOT this tool's own validation rules. The Timestamp Generator is a general-purpose
// formatter and does not enforce these; see docs/tools/02-YOUTUBE-TIMESTAMP-GENERATOR.md.
const YOUTUBE_CHAPTERS_SOURCE_URL = "https://support.google.com/youtube/answer/9884579?hl=en";
const YOUTUBE_CHAPTERS_VERIFIED_AT = "2026-08-23";

function fact<T>(key: string, value: T, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl: YOUTUBE_CHAPTERS_SOURCE_URL,
    verifiedAt: YOUTUBE_CHAPTERS_VERIFIED_AT,
    notes,
  };
}

export const youtubeChaptersFirstTimestampMustBeZero = fact(
  "youtube.chapters.firstTimestampMustBeZero",
  true,
  "YouTube requires the first manual chapter timestamp to start at 00:00.",
);

export const youtubeChaptersMinimumCount = fact(
  "youtube.chapters.minimumCount",
  3,
  "YouTube requires at least three timestamps for manual video chapters to be recognized.",
);

export const youtubeChaptersRequireAscendingOrder = fact(
  "youtube.chapters.requireAscendingOrder",
  true,
  "YouTube requires manual chapter timestamps to be listed in ascending order.",
);

export const youtubeChaptersMinimumLengthSeconds = fact(
  "youtube.chapters.minimumLengthSeconds",
  10,
  "YouTube requires each manual video chapter to be at least 10 seconds long.",
);

export const youtubeChaptersManualOverridesAutomatic = fact(
  "youtube.chapters.manualOverridesAutomatic",
  true,
  "Adding manual chapters overrides YouTube's automatically generated chapters for that video.",
);

export const youtubeChaptersFacts = [
  youtubeChaptersFirstTimestampMustBeZero,
  youtubeChaptersMinimumCount,
  youtubeChaptersRequireAscendingOrder,
  youtubeChaptersMinimumLengthSeconds,
  youtubeChaptersManualOverridesAutomatic,
] as const;
