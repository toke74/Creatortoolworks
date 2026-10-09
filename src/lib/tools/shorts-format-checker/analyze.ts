import type {
  ShortsFormatAnalysis,
  ShortsFormatInput,
  ShortsOrientation,
} from "@/lib/tools/shorts-format-checker/types";

export const YOUTUBE_SHORTS_MAX_DURATION_SECONDS = 180;

export function getShortsOrientation(widthPx: number, heightPx: number): ShortsOrientation {
  if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx) || widthPx <= 0 || heightPx <= 0) {
    return "unknown";
  }

  if (widthPx === heightPx) return "square";
  return widthPx < heightPx ? "vertical" : "horizontal";
}

export function formatShortsOrientation(orientation: ShortsOrientation): string {
  if (orientation === "vertical") return "Vertical";
  if (orientation === "square") return "Square";
  if (orientation === "horizontal") return "Horizontal";
  return "Unknown";
}

export function formatShortsDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "Invalid";

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  const fractional = seconds - wholeSeconds;
  const base = `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;

  if (fractional < 0.001) return base;

  const decimals = fractional.toFixed(3).slice(1).replace(/0+$/, "");
  return `${base}${decimals}`;
}

export function formatShortsFileSize(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "Not available";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"] as const;
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unitIndex]}`;
}

export function analyzeShortsFormat(input: ShortsFormatInput | null): ShortsFormatAnalysis | null {
  if (!input) return null;

  const orientation = getShortsOrientation(input.widthPx, input.heightPx);
  const hasValidDimensions = orientation !== "unknown";
  const hasValidDuration = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0;
  const aspectPasses = hasValidDimensions && input.widthPx <= input.heightPx;
  const durationPasses = hasValidDuration && input.durationSeconds <= YOUTUBE_SHORTS_MAX_DURATION_SECONDS;

  const checks = [
    {
      id: "aspect" as const,
      label: "Aspect check",
      status: aspectPasses ? ("pass" as const) : ("fail" as const),
      message: aspectPasses
        ? "The video is square or vertical, matching YouTube's published Shorts format condition."
        : hasValidDimensions
          ? "The selected video is horizontal and therefore does not meet YouTube's published square-or-vertical Shorts format condition."
          : "Width and height must both be greater than zero.",
    },
    {
      id: "duration" as const,
      label: "Duration check",
      status: durationPasses ? ("pass" as const) : ("fail" as const),
      message: durationPasses
        ? "The duration is greater than zero and no more than 3 minutes."
        : hasValidDuration
          ? "The duration is over 3 minutes, so it fails this Shorts format check."
          : "Duration must be greater than zero seconds.",
    },
  ];

  return {
    status: aspectPasses && durationPasses ? "ready" : "error",
    input,
    orientation,
    checks,
  };
}
