import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/57404?hl=en (verified 2026-09-05):
// "Video titles have a character limit of 100 characters and cannot include
// invalid characters."
const YOUTUBE_TITLE_SOURCE_URL = "https://support.google.com/youtube/answer/57404?hl=en";
const YOUTUBE_TITLE_VERIFIED_AT = "2026-09-05";

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
