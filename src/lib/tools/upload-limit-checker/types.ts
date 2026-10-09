export type UploadLimitStatus = "ready" | "error";
export type UploadLimitCheckStatus = "pass" | "fail" | "info";

export interface UploadLimitInput {
  fileName?: string;
  fileSizeBytes: number;
  durationSeconds: number;
  mimeType?: string;
}

export interface UploadLimitCheck {
  id: "size" | "duration" | "verification" | "format";
  status: UploadLimitCheckStatus;
  label: string;
  message: string;
}

export interface UploadLimitAnalysis {
  status: UploadLimitStatus;
  input: UploadLimitInput;
  checks: UploadLimitCheck[];
  requiresVerification: boolean;
}
