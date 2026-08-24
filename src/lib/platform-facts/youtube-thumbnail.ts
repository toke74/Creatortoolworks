import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/72431?hl=en (verified 2026-08-20).
// Do not hard-code older "1280x720 / 2 MB everywhere" assumptions; re-verify before changing these values.
const YOUTUBE_THUMBNAIL_SOURCE_URL = "https://support.google.com/youtube/answer/72431?hl=en";
const YOUTUBE_THUMBNAIL_VERIFIED_AT = "2026-08-20";

function fact<T>(key: string, value: T, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl: YOUTUBE_THUMBNAIL_SOURCE_URL,
    verifiedAt: YOUTUBE_THUMBNAIL_VERIFIED_AT,
    notes,
  };
}

export const youtubeThumbnailRecommendedWidthPx = fact(
  "youtube.thumbnail.recommendedWidthPx",
  3840,
  "YouTube recommends a 3840x2160 resolution for standard 16:9 video thumbnails.",
);

export const youtubeThumbnailMinWidthPx = fact(
  "youtube.thumbnail.minWidthPx",
  640,
  "YouTube states a minimum thumbnail width of 640 pixels for standard videos.",
);

export const youtubeThumbnailRecommendedAspectRatio = fact(
  "youtube.thumbnail.recommendedAspectRatio",
  16 / 9,
  "YouTube recommends a 16:9 aspect ratio for standard video thumbnails.",
);

export const youtubeThumbnailAcceptedMimeTypes = fact(
  "youtube.thumbnail.acceptedMimeTypes",
  ["image/jpeg", "image/png"] as const,
  "YouTube's custom thumbnail uploader accepts JPG or PNG files.",
);

export const youtubeThumbnailMaxFileSizeMobileBytes = fact(
  "youtube.thumbnail.maxFileSizeMobileBytes",
  2 * 1024 * 1024,
  "Uploading a custom thumbnail from the YouTube mobile app is limited to 2 MB.",
);

export const youtubeThumbnailMaxFileSizeDesktopBytes = fact(
  "youtube.thumbnail.maxFileSizeDesktopBytes",
  50 * 1024 * 1024,
  "Uploading a custom thumbnail from YouTube Studio on the web is limited to 50 MB.",
);

export const youtubeThumbnailFacts = [
  youtubeThumbnailRecommendedWidthPx,
  youtubeThumbnailMinWidthPx,
  youtubeThumbnailRecommendedAspectRatio,
  youtubeThumbnailAcceptedMimeTypes,
  youtubeThumbnailMaxFileSizeMobileBytes,
  youtubeThumbnailMaxFileSizeDesktopBytes,
] as const;
