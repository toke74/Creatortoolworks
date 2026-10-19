import type { PlatformFact } from "./types";

const verifiedAt = "2026-10-18";
const sourceUrl = "https://support.google.com/youtube/answer/12340300";

function fact(key: string, value: string): PlatformFact<string> {
  return { key, value, sourceUrl, verifiedAt };
}

export const youtubeThumbnailPreviewImage: PlatformFact<string> = {
  key: "youtube.thumbnail.previewImage",
  value: "Custom thumbnails give viewers a snapshot of a video and serve as preview images in the embedded player.",
  sourceUrl: "https://support.google.com/youtube/answer/72431",
  verifiedAt,
};
export const youtubeThumbnailTitleViewerDecision = fact(
  "youtube.thumbnailTitle.viewerDecision",
  "Viewers usually see the thumbnail and title first when deciding whether to watch a video.",
);
export const youtubeThumbnailTitleDeviceVariation = fact(
  "youtube.thumbnailTitle.deviceVariation",
  "Thumbnails appear differently across devices.",
);
export const youtubeThumbnailTitlePartialTitle = fact(
  "youtube.thumbnailTitle.partialTitle",
  "Viewers may see only part of a video title.",
);

export const youtubeThumbnailTitleFacts = [
  youtubeThumbnailPreviewImage,
  youtubeThumbnailTitleViewerDecision,
  youtubeThumbnailTitleDeviceVariation,
  youtubeThumbnailTitlePartialTitle,
] as const;
