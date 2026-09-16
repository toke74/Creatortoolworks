import { describe, expect, it } from "vitest";
import { getRelatedTools, getToolBySlug, getVisitorFacingTools, isPubliclyDiscoverable, tools } from "@/lib/tools/registry";
import type { ToolDefinition } from "@/lib/tools/types";

function fixture(overrides: Partial<ToolDefinition>): ToolDefinition {
  return {
    id: "fixture-tool",
    name: "Fixture Tool",
    slug: "fixture-tool",
    category: "titles",
    status: "draft",
    implemented: true,
    summary: "A fixture tool for registry unit tests.",
    analyticsId: "fixture_tool",
    relatedToolIds: [],
    ...overrides,
  };
}

describe("tool registry", () => {
  it("contains exactly the six MVP tools", () => {
    expect(tools).toHaveLength(6);
  });

  it("uses unique ids and slugs", () => {
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
  });

  it("resolves a tool by slug", () => {
    expect(getToolBySlug("youtube-title-checker")?.name).toBe("YouTube Title Checker");
  });

  it("only exposes tools with a working implementation to visitors", () => {
    const visitorFacingTools = getVisitorFacingTools();
    expect(visitorFacingTools.map((tool) => tool.id)).toEqual([
      "thumbnail-size-checker",
      "youtube-timestamp-generator",
      "youtube-description-formatter",
      "youtube-chapter-generator",
      "youtube-earnings-estimator",
      "youtube-title-checker",
    ]);
  });

  it("has the earnings estimator live and indexable", () => {
    const earningsEstimator = getToolBySlug("youtube-earnings-estimator");
    expect(earningsEstimator?.status).toBe("live");
    expect(earningsEstimator?.implemented).toBe(true);
    expect(earningsEstimator?.visibleInCatalog).toBe(true);
    expect(earningsEstimator?.sourceFacts).toEqual([
      "youtube.analytics.rpm.definition",
      "youtube.analytics.rpm.revenueSources",
      "youtube.analytics.rpm.shortsBasis",
      "youtube.analytics.rpm.videoBasis",
      "youtube.analytics.estimatedRevenue.adjustments",
    ]);
  });

  it("has the title checker live and indexable", () => {
    const titleChecker = getToolBySlug("youtube-title-checker");
    expect(titleChecker?.status).toBe("live");
    expect(titleChecker?.implemented).toBe(true);
    expect(titleChecker?.visibleInCatalog).toBe(true);
    expect(titleChecker?.sourceFacts).toEqual(["youtube.title.maxCharacters"]);
  });

  it("has the chapter generator live and indexable", () => {
    const chapterGenerator = getToolBySlug("youtube-chapter-generator");
    expect(chapterGenerator?.status).toBe("live");
    expect(chapterGenerator?.implemented).toBe(true);
    expect(chapterGenerator?.visibleInCatalog).toBe(true);
  });

  it("includes the live earnings estimator related tools", () => {
    const earningsEstimator = getToolBySlug("youtube-earnings-estimator");
    expect(earningsEstimator).toBeDefined();
    expect(getRelatedTools(earningsEstimator!).map((tool) => tool.id)).toEqual([
      "youtube-title-checker",
      "youtube-description-formatter",
    ]);
  });
});

describe("isPubliclyDiscoverable", () => {
  it("excludes an implemented draft tool by default (not intentionally enabled)", () => {
    expect(isPubliclyDiscoverable(fixture({ status: "draft", implemented: true }))).toBe(false);
  });

  it("includes an implemented draft tool explicitly opted in via visibleInCatalog", () => {
    expect(isPubliclyDiscoverable(fixture({ status: "draft", implemented: true, visibleInCatalog: true }))).toBe(true);
  });

  it("includes an implemented live tool regardless of visibleInCatalog", () => {
    expect(isPubliclyDiscoverable(fixture({ status: "live", implemented: true }))).toBe(true);
    expect(isPubliclyDiscoverable(fixture({ status: "live", implemented: true, visibleInCatalog: false }))).toBe(true);
  });

  it("excludes a tool that isn't implemented even if status is live or visibleInCatalog is set", () => {
    expect(isPubliclyDiscoverable(fixture({ status: "live", implemented: false }))).toBe(false);
    expect(isPubliclyDiscoverable(fixture({ status: "draft", implemented: false, visibleInCatalog: true }))).toBe(false);
  });
});
