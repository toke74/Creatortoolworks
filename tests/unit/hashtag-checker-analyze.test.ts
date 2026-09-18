import { describe, expect, it } from "vitest";
import {
  buildHashtagReport,
  extractHashtags,
  removeDuplicateHashtagOccurrences,
} from "@/lib/tools/hashtag-checker/analyze";

describe("hashtag checker analysis", () => {
  it("treats empty input and no-hashtag text as neutral states", () => {
    expect(buildHashtagReport("", 60).status).toBe("empty");
    expect(buildHashtagReport("plain creator text", 60).status).toBe("none");
  });

  it("extracts one and several hashtags deterministically", () => {
    expect(extractHashtags("#CreatorTools").map((tag) => tag.value)).toEqual(["#CreatorTools"]);
    expect(extractHashtags("#CreatorTools #YouTubeTips #Shorts").map((tag) => tag.value)).toEqual([
      "#CreatorTools",
      "#YouTubeTips",
      "#Shorts",
    ]);
  });

  it("reports exactly 60 as ready and exactly 61 as error", () => {
    const sixty = Array.from({ length: 60 }, (_, index) => `#tag${index}`).join(" ");
    const sixtyOne = Array.from({ length: 61 }, (_, index) => `#tag${index}`).join(" ");

    expect(buildHashtagReport(sixty, 60)).toMatchObject({
      status: "ready",
      totalCount: 60,
      remainingUntilThreshold: 0,
      overThresholdBy: 0,
    });
    expect(buildHashtagReport(sixtyOne, 60)).toMatchObject({
      status: "error",
      totalCount: 61,
      remainingUntilThreshold: 0,
      overThresholdBy: 1,
    });
  });

  it("counts duplicates exactly and preserves capitalization behavior", () => {
    const report = buildHashtagReport("#Creator #creator #Creator", 60);

    expect(report.totalCount).toBe(3);
    expect(report.uniqueCount).toBe(2);
    expect(report.duplicateCount).toBe(1);
    expect(report.hashtags.map((tag) => [tag.value, tag.duplicate])).toEqual([
      ["#Creator", false],
      ["#creator", false],
      ["#Creator", true],
    ]);
  });

  it("extracts Unicode hashtags and excludes adjacent punctuation", () => {
    expect(extractHashtags("Try (#naive), #Cafe_2026. #creator-tools #東京").map((tag) => tag.value)).toEqual([
      "#naive",
      "#Cafe_2026",
      "#creator",
      "#東京",
    ]);
  });

  it("handles multiline descriptions and no-spaces behavior without inferring intent", () => {
    const input = "Title #Creator Tools\nDescription #VideoTips\n#Creator Tools again";

    expect(extractHashtags(input).map((tag) => tag.value)).toEqual(["#Creator", "#VideoTips", "#Creator"]);
  });

  it("removes exact duplicate occurrences while preserving first occurrence order", () => {
    const input = "Intro #B #A #B middle #A #a";

    expect(removeDuplicateHashtagOccurrences(input)).toBe("Intro #B #A  middle  #a");
  });

  it("duplicate cleanup is idempotent", () => {
    const once = removeDuplicateHashtagOccurrences("#A #B #A #C #B");
    const twice = removeDuplicateHashtagOccurrences(once);

    expect(once).toBe("#A #B  #C ");
    expect(twice).toBe(once);
  });

  it("builds displayed output exactly as newline-separated extracted hashtags", () => {
    expect(buildHashtagReport("#One text #Two #One", 60).displayedOutput).toBe("#One\n#Two\n#One");
  });
});
