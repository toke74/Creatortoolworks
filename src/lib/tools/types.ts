export type ToolStatus = "draft" | "live" | "deprecated";

export type ToolCategory =
  | "thumbnail"
  | "titles"
  | "descriptions"
  | "timestamps"
  | "chapters"
  | "monetization";

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  status: ToolStatus;
  /** Whether the tool has a working implementation — gates whether its page exists/renders at all (including direct-URL owner QA), independent of public discoverability or indexing. */
  implemented: boolean;
  /**
   * Intentionally surface this tool in the public catalog/homepage and related-tool
   * discovery while it is still `status: "draft"` (e.g. staged QA on the live site
   * before a full release). Has no effect once `status` is `"live"` (live tools are
   * always publicly discoverable). Never affects indexing or sitemap inclusion —
   * those stay strictly tied to `status === "live"` regardless of this flag.
   */
  visibleInCatalog?: boolean;
  summary: string;
  analyticsId: string;
  relatedToolIds: string[];
  sourceFacts?: string[];
}
