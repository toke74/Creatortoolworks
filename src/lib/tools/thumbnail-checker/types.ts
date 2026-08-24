export type CheckStatus = "pass" | "warning" | "fail";

export interface ThumbnailCheck {
  id: "format" | "dimensions" | "aspectRatio" | "fileSize";
  label: string;
  status: CheckStatus;
  message: string;
}

export interface ThumbnailInput {
  widthPx: number;
  heightPx: number;
  fileSizeBytes: number;
  mimeType: string;
}

export interface AspectRatioSummary {
  decimal: number;
  label: string;
}

export interface ThumbnailAnalysis {
  input: ThumbnailInput;
  aspectRatio: AspectRatioSummary;
  checks: ThumbnailCheck[];
  overallStatus: CheckStatus;
}
