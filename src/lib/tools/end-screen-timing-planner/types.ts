export type EndScreenTimingStatus = "neutral" | "ready" | "error";

export interface EndScreenTimingInput {
  videoDuration: string;
  endScreenLength: string;
}

export interface EndScreenTimingResult {
  status: EndScreenTimingStatus;
  title: string;
  message: string;
  videoDurationSeconds: number | null;
  endScreenLengthSeconds: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  display: {
    videoDuration: string;
    start: string;
    end: string;
    length: string;
  } | null;
}
