import type { ToolDefinition } from "./types";

export const tools: readonly ToolDefinition[] = [
  {
    id: "thumbnail-size-checker",
    name: "Thumbnail Size Checker",
    slug: "thumbnail-size-checker",
    category: "thumbnail",
    status: "live",
    implemented: true,
    summary: "Check thumbnail dimensions, aspect ratio, and file details in your browser.",
    analyticsId: "thumbnail_size_checker",
    relatedToolIds: ["youtube-title-checker"],
    sourceFacts: [
      "youtube.thumbnail.recommendedWidthPx",
      "youtube.thumbnail.minWidthPx",
      "youtube.thumbnail.recommendedAspectRatio",
      "youtube.thumbnail.acceptedMimeTypes",
      "youtube.thumbnail.maxFileSizeMobileBytes",
      "youtube.thumbnail.maxFileSizeDesktopBytes",
    ],
  },
  {
    id: "youtube-timestamp-generator",
    name: "YouTube Timestamp Generator",
    slug: "youtube-timestamp-generator",
    category: "timestamps",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary:
      "Create and format YouTube timestamps for descriptions and comments. Clean pasted lists, fix timestamp formatting, sort entries, and copy the finished result.",
    analyticsId: "youtube_timestamp_generator",
    relatedToolIds: ["thumbnail-size-checker", "youtube-chapter-generator", "youtube-description-formatter"],
    sourceFacts: [
      "youtube.chapters.firstTimestampMustBeZero",
      "youtube.chapters.minimumCount",
      "youtube.chapters.requireAscendingOrder",
      "youtube.chapters.minimumLengthSeconds",
      "youtube.chapters.manualOverridesAutomatic",
    ],
  },
  {
    id: "youtube-description-formatter",
    name: "YouTube Description Formatter",
    slug: "youtube-description-formatter",
    category: "descriptions",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary: "Clean, check, and format a YouTube video description before publishing.",
    analyticsId: "youtube_description_formatter",
    relatedToolIds: ["youtube-timestamp-generator", "youtube-chapter-generator"],
    sourceFacts: ["youtube.description.maxCharacters"],
  },
  {
    id: "youtube-chapter-generator",
    name: "YouTube Chapter Generator",
    slug: "youtube-chapter-generator",
    category: "chapters",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary:
      "Build a timestamped chapter list and check it against YouTube's manual-chapter requirements before you paste it into a description.",
    analyticsId: "youtube_chapter_generator",
    relatedToolIds: ["youtube-timestamp-generator", "youtube-description-formatter"],
    sourceFacts: [
      "youtube.chapters.firstTimestampMustBeZero",
      "youtube.chapters.minimumCount",
      "youtube.chapters.requireAscendingOrder",
      "youtube.chapters.minimumLengthSeconds",
      "youtube.chapters.manualOverridesAutomatic",
    ],
  },
  {
    id: "youtube-earnings-estimator",
    name: "YouTube Earnings Estimator",
    slug: "youtube-earnings-estimator",
    category: "monetization",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary: "Estimate revenue ranges from views and adjustable monetization assumptions.",
    analyticsId: "youtube_earnings_estimator",
    relatedToolIds: ["youtube-title-checker", "youtube-description-formatter"],
    sourceFacts: [
      "youtube.analytics.rpm.definition",
      "youtube.analytics.rpm.revenueSources",
      "youtube.analytics.rpm.shortsBasis",
      "youtube.analytics.rpm.videoBasis",
      "youtube.analytics.estimatedRevenue.adjustments",
    ],
  },
  {
    id: "youtube-title-checker",
    name: "YouTube Title Checker",
    slug: "youtube-title-checker",
    category: "titles",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary: "Check a YouTube video title against the official 100-character limit.",
    analyticsId: "youtube_title_checker",
    relatedToolIds: ["thumbnail-size-checker", "youtube-description-formatter"],
    sourceFacts: ["youtube.title.maxCharacters"],
  },
  {
    id: "youtube-hashtag-checker",
    name: "YouTube Hashtag Checker",
    slug: "youtube-hashtag-checker",
    category: "hashtags",
    status: "live",
    implemented: true,
    visibleInCatalog: true,
    summary: "Extract hashtags from YouTube text and check the official 60-hashtag threshold.",
    analyticsId: "youtube_hashtag_checker",
    relatedToolIds: ["youtube-description-formatter", "youtube-title-checker"],
    sourceFacts: [
      "youtube.hashtags.allowedLocations",
      "youtube.hashtags.noSpaces",
      "youtube.hashtags.ignoreAllAboveCount",
      "youtube.hashtags.descriptionMayDisplayCount",
      "youtube.hashtags.displayDeterminedByYoutube",
      "youtube.hashtags.mustFollowPolicies",
    ],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * Whether a tool should surface in public discovery surfaces (catalog, homepage,
 * related-tool links): it must be implemented, and either fully `"live"` or a
 * draft explicitly opted in via `visibleInCatalog`. This is deliberately separate
 * from indexing/sitemap eligibility, which stays strictly `status === "live"`
 * (see `src/app/sitemap.ts` and the tool page's `generateMetadata`).
 */
export function isPubliclyDiscoverable(tool: ToolDefinition): boolean {
  return tool.implemented && (tool.status === "live" || tool.visibleInCatalog === true);
}

/** Tools safe to list/link to for visitors on the catalog and homepage. */
export function getVisitorFacingTools(): ToolDefinition[] {
  return tools.filter(isPubliclyDiscoverable);
}

export function getRelatedTools(tool: ToolDefinition): ToolDefinition[] {
  const related: ToolDefinition[] = [];

  for (const id of tool.relatedToolIds) {
    const match = tools.find((candidate) => candidate.id === id);
    if (match && isPubliclyDiscoverable(match)) related.push(match);
  }

  return related;
}
