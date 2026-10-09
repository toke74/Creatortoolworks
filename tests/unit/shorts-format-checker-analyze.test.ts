import { describe, expect, it } from "vitest";
import {
  analyzeShortsFormat,
  formatShortsDuration,
  getShortsOrientation,
} from "@/lib/tools/shorts-format-checker/analyze";

describe("shorts format analyzer", () => {
  it("returns neutral when there is no metadata", () => {
    expect(analyzeShortsFormat(null)).toBeNull();
  });

  it("passes vertical video under one minute", () => {
    const result = analyzeShortsFormat({ widthPx: 1080, heightPx: 1920, durationSeconds: 59 });
    expect(result?.status).toBe("ready");
    expect(result?.orientation).toBe("vertical");
  });

  it("passes vertical video at exactly 180 seconds", () => {
    expect(analyzeShortsFormat({ widthPx: 1080, heightPx: 1920, durationSeconds: 180 })?.status).toBe("ready");
  });

  it("fails vertical video above 180 seconds", () => {
    expect(analyzeShortsFormat({ widthPx: 1080, heightPx: 1920, durationSeconds: 180.001 })?.status).toBe("error");
  });

  it("passes square video at or under 180 seconds", () => {
    const result = analyzeShortsFormat({ widthPx: 1080, heightPx: 1080, durationSeconds: 120 });
    expect(result?.status).toBe("ready");
    expect(result?.orientation).toBe("square");
  });

  it("fails horizontal video at or under 180 seconds", () => {
    const result = analyzeShortsFormat({ widthPx: 1920, heightPx: 1080, durationSeconds: 120 });
    expect(result?.status).toBe("error");
    expect(result?.checks.find((check) => check.id === "aspect")?.status).toBe("fail");
  });

  it("classifies square, vertical, and horizontal dimensions", () => {
    expect(getShortsOrientation(1080, 1080)).toBe("square");
    expect(getShortsOrientation(1080, 1920)).toBe("vertical");
    expect(getShortsOrientation(1920, 1080)).toBe("horizontal");
  });

  it("rejects zero and negative dimensions or durations", () => {
    expect(analyzeShortsFormat({ widthPx: 0, heightPx: 1080, durationSeconds: 10 })?.status).toBe("error");
    expect(analyzeShortsFormat({ widthPx: 1080, heightPx: 0, durationSeconds: 10 })?.status).toBe("error");
    expect(analyzeShortsFormat({ widthPx: -1080, heightPx: 1920, durationSeconds: 10 })?.status).toBe("error");
    expect(analyzeShortsFormat({ widthPx: 1080, heightPx: 1920, durationSeconds: 0 })?.status).toBe("error");
    expect(analyzeShortsFormat({ widthPx: 1080, heightPx: 1920, durationSeconds: -1 })?.status).toBe("error");
  });

  it("formats duration with enough precision for fractional overages", () => {
    expect(formatShortsDuration(59)).toBe("0:59");
    expect(formatShortsDuration(60)).toBe("1:00");
    expect(formatShortsDuration(150)).toBe("2:30");
    expect(formatShortsDuration(180)).toBe("3:00");
    expect(formatShortsDuration(181)).toBe("3:01");
    expect(formatShortsDuration(180.001)).toBe("3:00.001");
  });
});
