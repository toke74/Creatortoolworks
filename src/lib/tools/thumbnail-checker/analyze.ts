import {
  youtubeThumbnailAcceptedMimeTypes,
  youtubeThumbnailMaxFileSizeDesktopBytes,
  youtubeThumbnailMaxFileSizeMobileBytes,
  youtubeThumbnailMinWidthPx,
  youtubeThumbnailRecommendedAspectRatio,
  youtubeThumbnailRecommendedWidthPx,
} from "@/lib/platform-facts/youtube-thumbnail";
import type {
  AspectRatioSummary,
  CheckStatus,
  ThumbnailAnalysis,
  ThumbnailCheck,
  ThumbnailInput,
} from "./types";

const ASPECT_RATIO_TOLERANCE = 0.015;

const KNOWN_ASPECT_RATIOS: readonly { label: string; value: number }[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

function isWithinTolerance(decimal: number, target: number): boolean {
  return Math.abs(decimal - target) / target <= ASPECT_RATIO_TOLERANCE;
}

export function describeAspectRatio(widthPx: number, heightPx: number): AspectRatioSummary {
  const decimal = heightPx > 0 ? widthPx / heightPx : 0;
  const known = KNOWN_ASPECT_RATIOS.find((ratio) => isWithinTolerance(decimal, ratio.value));

  return {
    decimal,
    label: known ? known.label : `${decimal.toFixed(2)}:1`,
  };
}

const FORMAT_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
  "image/avif": "AVIF",
  "image/bmp": "BMP",
  "image/tiff": "TIFF",
  "image/svg+xml": "SVG",
};

/** Human-friendly label for a MIME type, e.g. "image/png" -> "PNG". */
export function formatImageFormatLabel(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  if (!normalized) return "Unknown";
  if (FORMAT_LABELS[normalized]) return FORMAT_LABELS[normalized];

  const subtype = normalized.split("/")[1];
  return subtype ? subtype.toUpperCase() : "Unknown";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function checkFormat(mimeType: string): ThumbnailCheck {
  const accepted = youtubeThumbnailAcceptedMimeTypes.value as readonly string[];
  const normalized = mimeType.toLowerCase();

  if (accepted.includes(normalized)) {
    return {
      id: "format",
      label: "File format",
      status: "pass",
      message: "JPG and PNG files are accepted by YouTube's thumbnail uploader.",
    };
  }

  return {
    id: "format",
    label: "File format",
    status: "fail",
    message: normalized
      ? `YouTube accepts JPG or PNG thumbnails; this file is detected as ${normalized}. Re-export it as a JPG or PNG before uploading.`
      : "This file's image format could not be confirmed as JPG or PNG. Re-export it as a JPG or PNG before uploading.",
  };
}

function checkDimensions(widthPx: number): ThumbnailCheck {
  const minWidth = youtubeThumbnailMinWidthPx.value;
  const recommendedWidth = youtubeThumbnailRecommendedWidthPx.value;

  if (widthPx < minWidth) {
    return {
      id: "dimensions",
      label: "Dimensions",
      status: "fail",
      message: `Width is ${widthPx}px, below YouTube's minimum of ${minWidth}px. Use a larger source image.`,
    };
  }

  if (widthPx < recommendedWidth) {
    return {
      id: "dimensions",
      label: "Dimensions",
      status: "warning",
      message: `Width is ${widthPx}px. YouTube recommends ${recommendedWidth}px wide for the sharpest result on large screens; this still clears the ${minWidth}px minimum.`,
    };
  }

  return {
    id: "dimensions",
    label: "Dimensions",
    status: "pass",
    message: `Width is ${widthPx}px, which meets YouTube's recommended ${recommendedWidth}px resolution.`,
  };
}

function checkAspectRatio(aspectRatio: AspectRatioSummary): ThumbnailCheck {
  const recommended = youtubeThumbnailRecommendedAspectRatio.value;

  if (isWithinTolerance(aspectRatio.decimal, recommended)) {
    return {
      id: "aspectRatio",
      label: "Aspect ratio",
      status: "pass",
      message: "Matches YouTube's recommended 16:9 aspect ratio for standard video thumbnails.",
    };
  }

  return {
    id: "aspectRatio",
    label: "Aspect ratio",
    status: "warning",
    message: `Detected ratio is ${aspectRatio.label}. YouTube recommends 16:9 for standard video thumbnails; an off-ratio image may be cropped or padded in some placements.`,
  };
}

function checkFileSize(fileSizeBytes: number): ThumbnailCheck {
  const mobileLimit = youtubeThumbnailMaxFileSizeMobileBytes.value;
  const desktopLimit = youtubeThumbnailMaxFileSizeDesktopBytes.value;

  if (fileSizeBytes <= mobileLimit) {
    return {
      id: "fileSize",
      label: "File size",
      status: "pass",
      message: `${formatFileSize(fileSizeBytes)} is under YouTube's ${formatFileSize(mobileLimit)} mobile-app upload limit.`,
    };
  }

  if (fileSizeBytes <= desktopLimit) {
    return {
      id: "fileSize",
      label: "File size",
      status: "warning",
      message: `${formatFileSize(fileSizeBytes)} is over the ${formatFileSize(mobileLimit)} mobile-app limit but under the ${formatFileSize(desktopLimit)} web upload limit. Upload from a computer, or compress the file for mobile upload.`,
    };
  }

  return {
    id: "fileSize",
    label: "File size",
    status: "fail",
    message: `${formatFileSize(fileSizeBytes)} exceeds YouTube's ${formatFileSize(desktopLimit)} upload limit. Compress or re-export the image before uploading.`,
  };
}

const STATUS_SEVERITY: Record<CheckStatus, number> = { pass: 0, warning: 1, fail: 2 };

export function summarizeOverallStatus(analysis: ThumbnailAnalysis): string {
  const failCount = analysis.checks.filter((check) => check.status === "fail").length;
  const warningCount = analysis.checks.filter((check) => check.status === "warning").length;

  if (analysis.overallStatus === "fail") {
    return failCount === 1
      ? "This thumbnail fails 1 check. Fix it before uploading."
      : `This thumbnail fails ${failCount} checks. Fix these before uploading.`;
  }

  if (analysis.overallStatus === "warning") {
    return warningCount === 1
      ? "This thumbnail meets YouTube's requirements, but 1 result is worth reviewing before you upload."
      : `This thumbnail meets YouTube's requirements, but ${warningCount} results are worth reviewing before you upload.`;
  }

  return "This thumbnail passes every current YouTube check and is ready to upload.";
}

export function analyzeThumbnail(input: ThumbnailInput): ThumbnailAnalysis {
  const aspectRatio = describeAspectRatio(input.widthPx, input.heightPx);
  const checks: ThumbnailCheck[] = [
    checkFormat(input.mimeType),
    checkDimensions(input.widthPx),
    checkAspectRatio(aspectRatio),
    checkFileSize(input.fileSizeBytes),
  ];

  const overallStatus = checks.reduce<CheckStatus>(
    (worst, check) => (STATUS_SEVERITY[check.status] > STATUS_SEVERITY[worst] ? check.status : worst),
    "pass",
  );

  return { input, aspectRatio, checks, overallStatus };
}
