import type { UploadLimitAnalysis, UploadLimitInput } from "@/lib/tools/upload-limit-checker/types";

export const YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES = 256_000_000_000;
export const YOUTUBE_UPLOAD_MAX_DURATION_SECONDS = 12 * 60 * 60;
export const YOUTUBE_UPLOAD_DEFAULT_DURATION_SECONDS = 15 * 60;

export function formatUploadFileSize(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "Invalid";
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  if (unitIndex === 0) return `${value} ${units[unitIndex]}`;

  const formatted = value >= 100 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}

export function formatUploadDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "Invalid";

  const wholeSeconds = Math.floor(seconds);
  const milliseconds = Math.round((seconds - wholeSeconds) * 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
  const secondsText = remainingSeconds.toString().padStart(2, "0");
  const base =
    hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${secondsText}`
      : `${minutes}:${secondsText}`;

  if (milliseconds <= 0) return base;
  if (milliseconds >= 1000) return formatUploadDuration(wholeSeconds + 1);

  const decimals = `.${milliseconds.toString().padStart(3, "0").replace(/0+$/, "")}`;
  return `${base}${decimals}`;
}

export function analyzeUploadLimit(input: UploadLimitInput | null): UploadLimitAnalysis | null {
  if (!input) return null;

  const hasValidSize = Number.isFinite(input.fileSizeBytes) && input.fileSizeBytes > 0;
  const hasValidDuration = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0;
  const sizePasses = hasValidSize && input.fileSizeBytes <= YOUTUBE_UPLOAD_MAX_FILE_SIZE_BYTES;
  const durationPasses = hasValidDuration && input.durationSeconds <= YOUTUBE_UPLOAD_MAX_DURATION_SECONDS;
  const requiresVerification = hasValidDuration && input.durationSeconds > YOUTUBE_UPLOAD_DEFAULT_DURATION_SECONDS;

  const checks: UploadLimitAnalysis["checks"] = [
    {
      id: "size",
      label: "Size limit check",
      status: sizePasses ? "pass" : "fail",
      message: sizePasses
        ? "The file size is greater than zero and no more than YouTube's published 256 GB upload limit."
        : hasValidSize
          ? "The file is larger than YouTube's published 256 GB upload limit."
          : "File size must be greater than zero.",
    },
    {
      id: "duration",
      label: "Duration limit check",
      status: durationPasses ? "pass" : "fail",
      message: durationPasses
        ? "The duration is greater than zero and no more than YouTube's published 12-hour upload limit."
        : hasValidDuration
          ? "The duration is longer than YouTube's published 12-hour upload limit."
          : "Duration must be greater than zero seconds.",
    },
    {
      id: "verification",
      label: "Account-verification information",
      status: "info",
      message: requiresVerification
        ? "Account verification required for longer uploads. YouTube says videos longer than 15 minutes require a verified account."
        : "This duration does not exceed YouTube's default 15-minute upload duration.",
    },
  ];

  if (input.mimeType) {
    checks.push({
      id: "format",
      label: "Browser-reported type",
      status: "info",
      message: `${input.mimeType}. This is informational only; it does not prove the actual codec or container contents.`,
    });
  }

  return {
    status: sizePasses && durationPasses ? "ready" : "error",
    input,
    checks,
    requiresVerification,
  };
}
