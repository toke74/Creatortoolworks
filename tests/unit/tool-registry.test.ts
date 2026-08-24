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
    expect(getToolBySlug("youtube-title-analyzer")?.name).toBe("YouTube Title Analyzer");
  });

  it("only exposes tools with a working implementation to visitors", () => {
    const visitorFacingTools = getVisitorFacingTools();
    expect(visitorFacingTools.map((tool) => tool.id)).toEqual(["thumbnail-size-checker"]);
  });

  it("excludes unimplemented tools from related-tool links", () => {
    const titleAnalyzer = getToolBySlug("youtube-title-analyzer");
    expect(titleAnalyzer).toBeDefined();
    // youtube-title-analyzer relates to thumbnail-size-checker (implemented) and
    // video-description-formatter (not yet implemented); only the former should surface.
    expect(getRelatedTools(titleAnalyzer!).map((tool) => tool.id)).toEqual(["thumbnail-size-checker"]);
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
