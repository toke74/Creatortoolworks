export type ShortsOrientation = "vertical" | "square" | "horizontal" | "unknown";

export type ShortsFormatStatus = "neutral" | "ready" | "error";

export interface ShortsFormatInput {
  widthPx: number;
  heightPx: number;
  durationSeconds: number;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface ShortsFormatCheck {
  id: "aspect" | "duration";
  status: "pass" | "fail";
  label: string;
  message: string;
}

export interface ShortsFormatAnalysis {
  status: ShortsFormatStatus;
  input: ShortsFormatInput;
  orientation: ShortsOrientation;
  checks: ShortsFormatCheck[];
}
