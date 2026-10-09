import { describe, expect, it } from "vitest";
import {
  analyzeEndScreenTiming,
  formatEndScreenTimingForCopy,
} from "@/lib/tools/end-screen-timing-planner/analyze";

describe("analyzeEndScreenTiming", () => {
  it("treats empty and incomplete inputs as neutral", () => {
    expect(analyzeEndScreenTiming({ videoDuration: "", endScreenLength: "" }).status).toBe("neutral");
    expect(analyzeEndScreenTiming({ videoDuration: "12:35", endScreenLength: "" }).status).toBe("neutral");
  });

  it("validates video duration boundaries", () => {
    expect(analyzeEndScreenTiming({ videoDuration: "24", endScreenLength: "5" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "24.99", endScreenLength: "5" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "25", endScreenLength: "5" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "5" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "12:35", endScreenLength: "15" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "1:02:15", endScreenLength: "20" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "invalid", endScreenLength: "5" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "0", endScreenLength: "5" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "-1", endScreenLength: "5" }).status).toBe("error");
  });

  it("treats 25:00 as 25 minutes", () => {
    const result = analyzeEndScreenTiming({ videoDuration: "25:00", endScreenLength: "20" });

    expect(result.status).toBe("ready");
    expect(result.display?.videoDuration).toBe("25:00");
    expect(result.display?.start).toBe("24:40");
  });

  it("validates end-screen length boundaries", () => {
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "4" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "5" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "20" }).status).toBe("ready");
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "21" }).status).toBe("error");
    expect(analyzeEndScreenTiming({ videoDuration: "30", endScreenLength: "5.5" }).status).toBe("error");
  });

  it("calculates exact start and end times", () => {
    expect(analyzeEndScreenTiming({ videoDuration: "25", endScreenLength: "5" }).display).toMatchObject({
      start: "00:20",
      end: "00:25",
      length: "5 seconds",
    });
    expect(analyzeEndScreenTiming({ videoDuration: "25", endScreenLength: "20" }).display).toMatchObject({
      start: "00:05",
      end: "00:25",
      length: "20 seconds",
    });
    expect(analyzeEndScreenTiming({ videoDuration: "12:35", endScreenLength: "15" }).display).toMatchObject({
      start: "12:20",
      end: "12:35",
      length: "15 seconds",
    });
    expect(analyzeEndScreenTiming({ videoDuration: "1:02:15", endScreenLength: "20" }).display).toMatchObject({
      start: "1:01:55",
      end: "1:02:15",
      length: "20 seconds",
    });
  });

  it("formats the exact copy block", () => {
    const result = analyzeEndScreenTiming({ videoDuration: "12:35", endScreenLength: "15" });

    expect(formatEndScreenTimingForCopy(result)).toBe(
      [
        "YouTube end screen timing",
        "Video duration: 12:35",
        "Start: 12:20",
        "End: 12:35",
        "End screen length: 15 seconds",
      ].join("\n"),
    );
  });
});
