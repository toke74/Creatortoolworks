import type { PlatformFact } from "./types";

// Source: https://support.google.com/youtube/answer/9314357 (verified 2026-09-15).
// Source: https://support.google.com/youtube/answer/72902 (verified 2026-09-15).
const RPM_SOURCE_URL = "https://support.google.com/youtube/answer/9314357";
const REVENUE_SOURCE_URL = "https://support.google.com/youtube/answer/72902";
const VERIFIED_AT = "2026-09-15";

export const youtubeRpmRevenuePerThousandViews: PlatformFact<string> = {
  key: "youtube.analytics.rpm.definition",
  value: "RPM is creator revenue per 1,000 views after YouTube revenue share.",
  sourceUrl: RPM_SOURCE_URL,
  verifiedAt: VERIFIED_AT,
  notes: "YouTube defines RPM as revenue earned per 1,000 views after YouTube revenue share.",
};

export const youtubeRpmIncludesMultipleRevenueSources: PlatformFact<string> = {
  key: "youtube.analytics.rpm.revenueSources",
  value:
    "RPM can include ads, channel memberships, YouTube Premium revenue, Super Chat, Super Stickers, Super Thanks, and Shopping.",
  sourceUrl: RPM_SOURCE_URL,
  verifiedAt: VERIFIED_AT,
  notes: "YouTube lists multiple revenue sources that can be included in RPM.",
};

export const youtubeShortsRpmUsesEngagedViews: PlatformFact<string> = {
  key: "youtube.analytics.rpm.shortsBasis",
  value: "For Shorts, RPM is based on engaged views.",
  sourceUrl: RPM_SOURCE_URL,
  verifiedAt: VERIFIED_AT,
  notes: "YouTube says Shorts RPM uses engaged views.",
};

export const youtubeVideoRpmUsesViews: PlatformFact<string> = {
  key: "youtube.analytics.rpm.videoBasis",
  value: "For videos, RPM is based on views.",
  sourceUrl: RPM_SOURCE_URL,
  verifiedAt: VERIFIED_AT,
  notes: "YouTube says video RPM uses views.",
};

export const youtubeFinalizedEarningsCanDiffer: PlatformFact<string> = {
  key: "youtube.analytics.estimatedRevenue.adjustments",
  value: "YouTube Analytics estimated revenue can be adjusted and finalized earnings can differ.",
  sourceUrl: REVENUE_SOURCE_URL,
  verifiedAt: VERIFIED_AT,
  notes: "YouTube documentation distinguishes estimated revenue from finalized earnings.",
};

export const youtubeEarningsFacts: readonly PlatformFact<string>[] = [
  youtubeRpmRevenuePerThousandViews,
  youtubeRpmIncludesMultipleRevenueSources,
  youtubeShortsRpmUsesEngagedViews,
  youtubeVideoRpmUsesViews,
  youtubeFinalizedEarningsCanDiffer,
];
