import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/57404?hl=en (verified 2026-08-25):
// "Video descriptions have a character limit of 5,000 characters and cannot include
// invalid characters." Cross-checked against
// https://support.google.com/youtube/answer/12948449?hl=en, which separately states
// "The description allows a maximum of 5000 characters."
const YOUTUBE_DESCRIPTION_SOURCE_URL = "https://support.google.com/youtube/answer/57404?hl=en";
const YOUTUBE_DESCRIPTION_VERIFIED_AT = "2026-08-25";

function fact<T>(key: string, value: T, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl: YOUTUBE_DESCRIPTION_SOURCE_URL,
    verifiedAt: YOUTUBE_DESCRIPTION_VERIFIED_AT,
    notes,
  };
}

export const youtubeDescriptionMaxCharacters = fact(
  "youtube.description.maxCharacters",
  5000,
  "YouTube video descriptions have a maximum length of 5,000 characters.",
);

export const youtubeDescriptionFacts = [youtubeDescriptionMaxCharacters] as const;
