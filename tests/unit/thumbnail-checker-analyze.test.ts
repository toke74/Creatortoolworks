import { describe, expect, it } from "vitest";
import {
  analyzeThumbnail,
  describeAspectRatio,
  formatFileSize,
  formatImageFormatLabel,
  summarizeOverallStatus,
} from "@/lib/tools/thumbnail-checker/analyze";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("describeAspectRatio", () => {
  it("labels a standard 16:9 image", () => {
    expect(describeAspectRatio(1920, 1080).label).toBe("16:9");
  });

  it("labels a square image", () => {
    expect(describeAspectRatio(1000, 1000).label).toBe("1:1");
  });

  it("falls back to a decimal ratio for unrecognized shapes", () => {
    const result = describeAspectRatio(1000, 333);
    expect(result.label).toBe("3.00:1");
  });
});

describe("formatImageFormatLabel", () => {
  it("labels a JPEG mime type", () => {
    expect(formatImageFormatLabel("image/jpeg")).toBe("JPEG");
  });

  it("labels a PNG mime type", () => {
    expect(formatImageFormatLabel("image/png")).toBe("PNG");
  });

  it("uppercases an unrecognized but well-formed mime subtype", () => {
    expect(formatImageFormatLabel("image/webp")).toBe("WebP");
    expect(formatImageFormatLabel("image/heic")).toBe("HEIC");
  });

  it("falls back to Unknown for an empty mime type", () => {
    expect(formatImageFormatLabel("")).toBe("Unknown");
  });
});

describe("analyzeThumbnail", () => {
  it("passes every check for a recommended landscape JPG", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/jpeg",
    });

    expect(result.overallStatus).toBe("pass");
    expect(result.checks.every((check) => check.status === "pass")).toBe(true);
  });

  it("warns on a portrait image", () => {
    const result = analyzeThumbnail({
      widthPx: 1080,
      heightPx: 1920,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/png",
    });

    const aspectRatioCheck = result.checks.find((check) => check.id === "aspectRatio");
    expect(aspectRatioCheck?.status).toBe("warning");
    expect(result.overallStatus).toBe("warning");
  });

  it("fails dimensions below the current minimum width", () => {
    const result = analyzeThumbnail({
      widthPx: 500,
      heightPx: 281,
      fileSizeBytes: 200 * 1024,
      mimeType: "image/jpeg",
    });

    const dimensionsCheck = result.checks.find((check) => check.id === "dimensions");
    expect(dimensionsCheck?.status).toBe("fail");
    expect(result.overallStatus).toBe("fail");
  });

  it("warns on width between the minimum and the recommended resolution", () => {
    const result = analyzeThumbnail({
      widthPx: 1280,
      heightPx: 720,
      fileSizeBytes: 200 * 1024,
      mimeType: "image/jpeg",
    });

    const dimensionsCheck = result.checks.find((check) => check.id === "dimensions");
    expect(dimensionsCheck?.status).toBe("warning");
  });

  it("passes file size under the mobile upload limit", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 1 * 1024 * 1024,
      mimeType: "image/jpeg",
    });

    expect(result.checks.find((check) => check.id === "fileSize")?.status).toBe("pass");
  });

  it("warns on file size between the mobile and desktop limits", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 5 * 1024 * 1024,
      mimeType: "image/jpeg",
    });

    expect(result.checks.find((check) => check.id === "fileSize")?.status).toBe("warning");
  });

  it("fails file size above the desktop upload limit", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 60 * 1024 * 1024,
      mimeType: "image/jpeg",
    });

    expect(result.checks.find((check) => check.id === "fileSize")?.status).toBe("fail");
    expect(result.overallStatus).toBe("fail");
  });

  it("passes an accepted PNG format", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/png",
    });

    expect(result.checks.find((check) => check.id === "format")?.status).toBe("pass");
  });

  it("fails an unsupported format like WEBP", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/webp",
    });

    const formatCheck = result.checks.find((check) => check.id === "format");
    expect(formatCheck?.status).toBe("fail");
    expect(formatCheck?.message).toContain("image/webp");
  });

  it("fails an empty/unknown format without crashing", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 500 * 1024,
      mimeType: "",
    });

    expect(result.checks.find((check) => check.id === "format")?.status).toBe("fail");
  });
});

describe("summarizeOverallStatus", () => {
  it("explains a full pass in plain language", () => {
    const result = analyzeThumbnail({
      widthPx: 3840,
      heightPx: 2160,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/jpeg",
    });

    expect(summarizeOverallStatus(result)).toBe("This thumbnail passes every current YouTube check and is ready to upload.");
  });

  it("counts warnings when explaining a warning result", () => {
    const result = analyzeThumbnail({
      widthPx: 1080,
      heightPx: 1920,
      fileSizeBytes: 500 * 1024,
      mimeType: "image/png",
    });

    // Portrait 1080x1920 trips both the dimensions warning (below recommended width)
    // and the aspect-ratio warning (not 16:9).
    expect(summarizeOverallStatus(result)).toContain("2 results are worth reviewing");
  });

  it("counts failures when explaining a fail result", () => {
    const result = analyzeThumbnail({
      widthPx: 500,
      heightPx: 281,
      fileSizeBytes: 200 * 1024,
      mimeType: "image/jpeg",
    });

    expect(summarizeOverallStatus(result)).toBe("This thumbnail fails 1 check. Fix it before uploading.");
  });
});
