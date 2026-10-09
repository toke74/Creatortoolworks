import type { PlatformFact } from "./types";

const YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL = "https://support.google.com/youtube/answer/15424877";
const YOUTUBE_SHORTS_UPLOAD_SOURCE_URL = "https://support.google.com/youtubecreatorstudio/answer/12779649";
const YOUTUBE_SHORTS_VERIFIED_AT = "2026-09-18";

function fact<T>(key: string, value: T, sourceUrl: string, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl,
    verifiedAt: YOUTUBE_SHORTS_VERIFIED_AT,
    notes,
  };
}

export const youtubeShortsMaxDurationSeconds = fact(
  "youtube.shorts.maxDurationSeconds",
  180,
  YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL,
  "YouTube Help says Shorts can be up to three minutes in length.",
);

export const youtubeShortsAllowsSquareOrVertical = fact(
  "youtube.shorts.allowsSquareOrVertical",
  true,
  YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL,
  "YouTube Help says square or vertical videos up to three minutes are categorized as Shorts under the published timing rules.",
);

export const youtubeShortsUploadRequiresSquareOrVertical = fact(
  "youtube.shorts.uploadRequiresSquareOrVertical",
  true,
  YOUTUBE_SHORTS_UPLOAD_SOURCE_URL,
  "YouTube Studio Help tells creators to select a video up to three minutes with a square or vertical aspect ratio.",
);

export const youtubeShortsStandardChannelClassificationStartDate = fact(
  "youtube.shorts.standardChannelClassificationStartDate",
  "2024-10-15",
  YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL,
  "For standard channels, YouTube says videos uploaded on or after October 15, 2024 with a square or vertical aspect ratio up to three minutes are categorized as Shorts.",
);

export const youtubeShortsOfficialArtistClassificationStartDate = fact(
  "youtube.shorts.officialArtistClassificationStartDate",
  "2025-12-08",
  YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL,
  "For Official Artist Channels, YouTube says matching uploads on or after December 8, 2025 are categorized as Shorts.",
);

export const youtubeShortsOverOneMinuteContentIdClaimLimitation = fact(
  "youtube.shorts.overOneMinuteContentIdClaimLimitation",
  true,
  YOUTUBE_SHORTS_THREE_MINUTE_SOURCE_URL,
  "As verified on 2026-09-18, YouTube Help says Shorts longer than one minute with active copyright or Content ID claims can be blocked, with an announced September 24, 2026 change for new claimed Shorts.",
);

export const youtubeShortsFacts = [
  youtubeShortsMaxDurationSeconds,
  youtubeShortsAllowsSquareOrVertical,
  youtubeShortsUploadRequiresSquareOrVertical,
  youtubeShortsStandardChannelClassificationStartDate,
  youtubeShortsOfficialArtistClassificationStartDate,
  youtubeShortsOverOneMinuteContentIdClaimLimitation,
] as const;
