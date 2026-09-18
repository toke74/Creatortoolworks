import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/6390658 (verified 2026-09-16):
// YouTube Help documents where hashtags can be added, no-spaces guidance, the
// more-than-60 ignore-all threshold, description display behavior, and policy requirements.
const YOUTUBE_HASHTAGS_SOURCE_URL = "https://support.google.com/youtube/answer/6390658";
const YOUTUBE_HASHTAGS_VERIFIED_AT = "2026-09-16";

function fact<T>(key: string, value: T, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl: YOUTUBE_HASHTAGS_SOURCE_URL,
    verifiedAt: YOUTUBE_HASHTAGS_VERIFIED_AT,
    notes,
  };
}

export const youtubeHashtagsAllowedLocations = fact(
  "youtube.hashtags.allowedLocations",
  ["title", "description"] as const,
  "YouTube says hashtags may be added to video titles and descriptions.",
);

export const youtubeHashtagsNoSpaces = fact(
  "youtube.hashtags.noSpaces",
  true,
  "YouTube says hashtags do not contain spaces.",
);

export const youtubeHashtagsIgnoreAllAboveCount = fact(
  "youtube.hashtags.ignoreAllAboveCount",
  60,
  "YouTube says that if content has more than 60 hashtags, it ignores every hashtag on that content.",
);

export const youtubeHashtagsDescriptionMayDisplayCount = fact(
  "youtube.hashtags.descriptionMayDisplayCount",
  3,
  "YouTube says up to three description hashtags considered most engaging may appear by the video title.",
);

export const youtubeHashtagsDisplayDeterminedByYoutube = fact(
  "youtube.hashtags.displayDeterminedByYoutube",
  true,
  "YouTube determines which description hashtags are considered most engaging; tools cannot know which will display.",
);

export const youtubeHashtagsMustFollowPolicies = fact(
  "youtube.hashtags.mustFollowPolicies",
  true,
  "YouTube says hashtags must meet YouTube policies, including Community Guidelines and metadata policies.",
);

export const youtubeHashtagFacts = [
  youtubeHashtagsAllowedLocations,
  youtubeHashtagsNoSpaces,
  youtubeHashtagsIgnoreAllAboveCount,
  youtubeHashtagsDescriptionMayDisplayCount,
  youtubeHashtagsDisplayDeterminedByYoutube,
  youtubeHashtagsMustFollowPolicies,
] as const;
