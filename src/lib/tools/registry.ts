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
    relatedToolIds: ["youtube-title-analyzer"],
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
    status: "draft",
    implemented: false,
    summary: "Create clean timestamps for video descriptions and comments.",
    analyticsId: "youtube_timestamp_generator",
    relatedToolIds: ["youtube-chapter-generator", "video-description-formatter"],
  },
  {
    id: "video-description-formatter",
    name: "Video Description Formatter",
    slug: "video-description-formatter",
    category: "descriptions",
    status: "draft",
    implemented: false,
    summary: "Format YouTube descriptions into readable, reusable sections.",
    analyticsId: "video_description_formatter",
    relatedToolIds: ["youtube-timestamp-generator", "youtube-chapter-generator"],
  },
  {
    id: "youtube-chapter-generator",
    name: "YouTube Chapter Generator",
    slug: "youtube-chapter-generator",
    category: "chapters",
    status: "draft",
    implemented: false,
    summary: "Turn timestamped sections into a clean chapter list.",
    analyticsId: "youtube_chapter_generator",
    relatedToolIds: ["youtube-timestamp-generator", "video-description-formatter"],
  },
  {
    id: "youtube-earnings-estimator",
    name: "YouTube Earnings Estimator",
    slug: "youtube-earnings-estimator",
    category: "monetization",
    status: "draft",
    implemented: false,
    summary: "Estimate revenue ranges from views and adjustable monetization assumptions.",
    analyticsId: "youtube_earnings_estimator",
    relatedToolIds: ["youtube-title-analyzer"],
  },
  {
    id: "youtube-title-analyzer",
    name: "YouTube Title Analyzer",
    slug: "youtube-title-analyzer",
    category: "titles",
    status: "draft",
    implemented: false,
    summary: "Review title length, structure, readability signals, and possible improvements.",
    analyticsId: "youtube_title_analyzer",
    relatedToolIds: ["thumbnail-size-checker", "video-description-formatter"],
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
