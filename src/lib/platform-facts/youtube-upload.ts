import type { PlatformFact } from "./types";

const YOUTUBE_UPLOAD_LENGTH_SOURCE_URL = "https://support.google.com/youtube/answer/71673";
const YOUTUBE_UPLOAD_FORMATS_SOURCE_URL = "https://support.google.com/youtube/troubleshooter/2888402";
const YOUTUBE_UPLOAD_WORKFLOW_SOURCE_URL = "https://support.google.com/youtube/answer/57407";
const YOUTUBE_UPLOAD_VERIFIED_AT = "2026-09-19";

function fact<T>(key: string, value: T, sourceUrl: string, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl,
    verifiedAt: YOUTUBE_UPLOAD_VERIFIED_AT,
    notes,
  };
}

export const youtubeUploadMaxFileSizeBytes = fact(
  "youtube.upload.maxFileSizeBytes",
  256_000_000_000,
  YOUTUBE_UPLOAD_LENGTH_SOURCE_URL,
  "YouTube Help publishes the maximum upload size as 256 GB or 12 hours, whichever is less. This implementation uses decimal GB: 1 GB = 1,000,000,000 bytes.",
);

export const youtubeUploadMaxDurationSeconds = fact(
  "youtube.upload.maxDurationSeconds",
  43_200,
  YOUTUBE_UPLOAD_LENGTH_SOURCE_URL,
  "YouTube Help publishes the maximum upload duration as 12 hours or 256 GB, whichever is less.",
);

export const youtubeUploadDefaultDurationSeconds = fact(
  "youtube.upload.defaultDurationSeconds",
  900,
  YOUTUBE_UPLOAD_LENGTH_SOURCE_URL,
  "YouTube Help says users can upload videos up to 15 minutes by default, and verified accounts can upload videos longer than 15 minutes.",
);

export const youtubeUploadLongerVideosRequireVerification = fact(
  "youtube.upload.longerVideosRequireVerification",
  true,
  YOUTUBE_UPLOAD_LENGTH_SOURCE_URL,
  "YouTube Help says verified accounts can upload videos longer than 15 minutes.",
);

export const youtubeUploadSupportedFormatsAreSeparate = fact(
  "youtube.upload.supportedFormatsAreSeparate",
  true,
  YOUTUBE_UPLOAD_FORMATS_SOURCE_URL,
  "YouTube publishes supported video formats on a separate Help page. Filename extensions and browser MIME types are informational in this checker.",
);

export const youtubeUploadDailyLimitExists = fact(
  "youtube.upload.dailyLimitExists",
  true,
  YOUTUBE_UPLOAD_WORKFLOW_SOURCE_URL,
  "YouTube Help says there is a limit to how many videos a channel can upload each day, but this tool does not know or check a channel's current daily limit.",
);

export const youtubeUploadFacts = [
  youtubeUploadMaxFileSizeBytes,
  youtubeUploadMaxDurationSeconds,
  youtubeUploadDefaultDurationSeconds,
  youtubeUploadLongerVideosRequireVerification,
  youtubeUploadSupportedFormatsAreSeparate,
  youtubeUploadDailyLimitExists,
] as const;
