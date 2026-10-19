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
  it("contains eleven implemented tools", () => {
    expect(tools).toHaveLength(11);
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
      "youtube-hashtag-checker",
      "youtube-shorts-format-checker",
      "youtube-upload-limit-checker",
      "youtube-end-screen-timing-planner",
      "youtube-thumbnail-title-previewer",
    ]);
  });

  it("keeps the thumbnail/title previewer live, implemented, and catalog-visible", () => {
    expect(getToolBySlug("youtube-thumbnail-title-previewer")).toMatchObject({
      status: "live", implemented: true, visibleInCatalog: true, category: "thumbnails",
    });
  });

  it("has the end screen timing planner live, implemented, catalog-visible, and indexable", () => {
    const endScreenPlanner = getToolBySlug("youtube-end-screen-timing-planner");
    expect(endScreenPlanner?.status).toBe("live");
    expect(endScreenPlanner?.implemented).toBe(true);
    expect(endScreenPlanner?.visibleInCatalog).toBe(true);
    expect(endScreenPlanner?.category).toBe("end-screens");
    expect(endScreenPlanner?.sourceFacts).toEqual([
      "youtube.endScreens.minWindowSeconds",
      "youtube.endScreens.maxWindowSeconds",
      "youtube.endScreens.minVideoDurationSeconds",
      "youtube.endScreens.standardAspectMaxElements",
      "youtube.endScreens.otherAspectRatiosMayHaveLowerLimit",
      "youtube.endScreens.madeForKidsUnavailable",
      "youtube.endScreens.uploadWorkflowMinimumDuration",
    ]);
  });

  it("has the upload limit checker live, implemented, catalog-visible, and indexable", () => {
    const uploadLimitChecker = getToolBySlug("youtube-upload-limit-checker");
    expect(uploadLimitChecker?.status).toBe("live");
    expect(uploadLimitChecker?.implemented).toBe(true);
    expect(uploadLimitChecker?.visibleInCatalog).toBe(true);
    expect(uploadLimitChecker?.category).toBe("uploads");
    expect(uploadLimitChecker?.sourceFacts).toEqual([
      "youtube.upload.maxFileSizeBytes",
      "youtube.upload.maxDurationSeconds",
      "youtube.upload.defaultDurationSeconds",
      "youtube.upload.longerVideosRequireVerification",
      "youtube.upload.supportedFormatsAreSeparate",
      "youtube.upload.dailyLimitExists",
    ]);
  });

  it("has the Shorts format checker live, implemented, catalog-visible, and indexable", () => {
    const shortsChecker = getToolBySlug("youtube-shorts-format-checker");
    expect(shortsChecker?.status).toBe("live");
    expect(shortsChecker?.implemented).toBe(true);
    expect(shortsChecker?.visibleInCatalog).toBe(true);
    expect(shortsChecker?.category).toBe("shorts");
    expect(shortsChecker?.sourceFacts).toEqual([
      "youtube.shorts.maxDurationSeconds",
      "youtube.shorts.allowsSquareOrVertical",
      "youtube.shorts.uploadRequiresSquareOrVertical",
      "youtube.shorts.standardChannelClassificationStartDate",
      "youtube.shorts.officialArtistClassificationStartDate",
      "youtube.shorts.overOneMinuteContentIdClaimLimitation",
    ]);
  });

  it("has the hashtag checker live, implemented, and catalog-visible", () => {
    const hashtagChecker = getToolBySlug("youtube-hashtag-checker");
    expect(hashtagChecker?.status).toBe("live");
    expect(hashtagChecker?.implemented).toBe(true);
    expect(hashtagChecker?.visibleInCatalog).toBe(true);
    expect(hashtagChecker?.category).toBe("hashtags");
    expect(hashtagChecker?.sourceFacts).toEqual([
      "youtube.hashtags.allowedLocations",
      "youtube.hashtags.noSpaces",
      "youtube.hashtags.ignoreAllAboveCount",
      "youtube.hashtags.descriptionMayDisplayCount",
      "youtube.hashtags.displayDeterminedByYoutube",
      "youtube.hashtags.mustFollowPolicies",
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
