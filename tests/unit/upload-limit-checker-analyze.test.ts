import { describe, expect, it } from "vitest";
import {
  analyzeUploadLimit,
  formatUploadDuration,
  formatUploadFileSize,
  YOUTUBE_UPLOAD_MAX_DURATION_SECONDS,
  YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES,
} from "@/lib/tools/upload-limit-checker/analyze";

describe("upload limit analyzer", () => {
  it("returns neutral when there is no metadata", () => {
    expect(analyzeUploadLimit(null)).toBeNull();
  });

  it("passes a small normal file", () => {
    const result = analyzeUploadLimit({ fileSizeBytes: 825_000_000, durationSeconds: 14 * 60 + 59 });
    expect(result?.status).toBe("ready");
    expect(result?.requiresVerification).toBe(false);
  });

  it("passes exactly 256 GB and fails slightly above 256 GB", () => {
    expect(analyzeUploadLimit({ fileSizeBytes: YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES, durationSeconds: 60 })?.status).toBe(
      "ready",
    );
    expect(
      analyzeUploadLimit({ fileSizeBytes: YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES + 1, durationSeconds: 60 })?.status,
    ).toBe("error");
  });

  it("passes exactly 12 hours and fails slightly above 12 hours", () => {
    expect(analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: YOUTUBE_UPLOAD_MAX_DURATION_SECONDS })?.status).toBe(
      "ready",
    );
    expect(
      analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: YOUTUBE_UPLOAD_MAX_DURATION_SECONDS + 0.001 })
        ?.status,
    ).toBe("error");
  });

  it("keeps over-15-minute uploads ready when size and 12-hour checks pass", () => {
    const atFifteen = analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: 15 * 60 });
    const overFifteen = analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: 15 * 60 + 0.01 });

    expect(atFifteen?.status).toBe("ready");
    expect(atFifteen?.requiresVerification).toBe(false);
    expect(overFifteen?.status).toBe("ready");
    expect(overFifteen?.requiresVerification).toBe(true);
    expect(overFifteen?.checks.find((check) => check.id === "verification")?.status).toBe("info");
  });

  it("rejects zero, negative, infinite, and very large invalid values safely", () => {
    expect(analyzeUploadLimit({ fileSizeBytes: 0, durationSeconds: 60 })?.status).toBe("error");
    expect(analyzeUploadLimit({ fileSizeBytes: -1, durationSeconds: 60 })?.status).toBe("error");
    expect(analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: 0 })?.status).toBe("error");
    expect(analyzeUploadLimit({ fileSizeBytes: 1_000_000, durationSeconds: -1 })?.status).toBe("error");
    expect(analyzeUploadLimit({ fileSizeBytes: Number.POSITIVE_INFINITY, durationSeconds: 60 })?.status).toBe("error");
    expect(analyzeUploadLimit({ fileSizeBytes: Number.MAX_SAFE_INTEGER, durationSeconds: 60 })?.status).toBe("error");
  });

  it("formats display values without losing validation precision", () => {
    expect(formatUploadFileSize(825_000_000)).toBe("825 MB");
    expect(formatUploadFileSize(4_200_000_000)).toBe("4.2 GB");
    expect(formatUploadFileSize(YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES)).toBe("256 GB");
    expect(formatUploadDuration(14 * 60 + 59)).toBe("14:59");
    expect(formatUploadDuration(15 * 60)).toBe("15:00");
    expect(formatUploadDuration(15 * 60 + 1)).toBe("15:01");
    expect(formatUploadDuration(90 * 60)).toBe("1:30:00");
    expect(formatUploadDuration(YOUTUBE_UPLOAD_MAX_DURATION_SECONDS)).toBe("12:00:00");
    expect(formatUploadDuration(YOUTUBE_UPLOAD_MAX_DURATION_SECONDS + 1)).toBe("12:00:01");
    expect(formatUploadDuration(900.01)).toBe("15:00.01");
  });
});
