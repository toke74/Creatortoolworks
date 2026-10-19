import type { PlatformFact } from "./types";

// Re-verified 2026-10-18 against https://support.google.com/youtube/answer/57407:
// "Video titles have a character limit of 100 characters and cannot include
// invalid characters."
const YOUTUBE_TITLE_SOURCE_URL = "https://support.google.com/youtube/answer/57407";
const YOUTUBE_TITLE_VERIFIED_AT = "2026-10-18";

function fact<T>(key: string, value: T, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl: YOUTUBE_TITLE_SOURCE_URL,
    verifiedAt: YOUTUBE_TITLE_VERIFIED_AT,
    notes,
  };
}

export const youtubeTitleMaxCharacters = fact(
  "youtube.title.maxCharacters",
  100,
  "YouTube video titles have a maximum length of 100 characters.",
);

export const youtubeTitleFacts = [youtubeTitleMaxCharacters] as const;
