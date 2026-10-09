import type { PlatformFact } from "./types";

const YOUTUBE_END_SCREENS_SOURCE_URL = "https://support.google.com/youtube/answer/6388789";
const YOUTUBE_UPLOAD_WORKFLOW_SOURCE_URL = "https://support.google.com/youtube/answer/57407";
const YOUTUBE_END_SCREENS_VERIFIED_AT = "2026-09-29";

function fact<T>(key: string, value: T, sourceUrl: string, notes: string): PlatformFact<T> {
  return {
    key,
    value,
    sourceUrl,
    verifiedAt: YOUTUBE_END_SCREENS_VERIFIED_AT,
    notes,
  };
}

export const youtubeEndScreenMinWindowSeconds = fact(
  "youtube.endScreens.minWindowSeconds",
  5,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says end screens can be added to the last 5-20 seconds of a video.",
);

export const youtubeEndScreenMaxWindowSeconds = fact(
  "youtube.endScreens.maxWindowSeconds",
  20,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says end screens can be added to the last 5-20 seconds of a video.",
);

export const youtubeEndScreenMinVideoDurationSeconds = fact(
  "youtube.endScreens.minVideoDurationSeconds",
  25,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says a video has to be at least 25 seconds long to have an end screen.",
);

export const youtubeEndScreenStandardAspectMaxElements = fact(
  "youtube.endScreens.standardAspectMaxElements",
  4,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says videos with standard 16:9 aspect ratio can have up to four end-screen elements.",
);

export const youtubeEndScreenOtherAspectRatiosMayHaveLowerLimit = fact(
  "youtube.endScreens.otherAspectRatiosMayHaveLowerLimit",
  true,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says other aspect ratios may have a lower element limit.",
);

export const youtubeEndScreenMadeForKidsUnavailable = fact(
  "youtube.endScreens.madeForKidsUnavailable",
  true,
  YOUTUBE_END_SCREENS_SOURCE_URL,
  "YouTube Help says end screens are not available for videos set as made for kids.",
);

export const youtubeEndScreenUploadWorkflowMinimumDuration = fact(
  "youtube.endScreens.uploadWorkflowMinimumDuration",
  25,
  YOUTUBE_UPLOAD_WORKFLOW_SOURCE_URL,
  "YouTube's upload workflow documentation says a video must be 25 seconds or longer to add an end screen.",
);

export const youtubeEndScreenFacts = [
  youtubeEndScreenMinWindowSeconds,
  youtubeEndScreenMaxWindowSeconds,
  youtubeEndScreenMinVideoDurationSeconds,
  youtubeEndScreenStandardAspectMaxElements,
  youtubeEndScreenOtherAspectRatiosMayHaveLowerLimit,
  youtubeEndScreenMadeForKidsUnavailable,
  youtubeEndScreenUploadWorkflowMinimumDuration,
] as const;
