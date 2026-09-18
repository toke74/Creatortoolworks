export type HashtagStatus = "empty" | "none" | "ready" | "error";

export interface ExtractedHashtag {
  value: string;
  startIndex: number;
  endIndex: number;
  occurrence: number;
  duplicate: boolean;
}

export interface HashtagReport {
  status: HashtagStatus;
  hashtags: ExtractedHashtag[];
  totalCount: number;
  uniqueCount: number;
  duplicateCount: number;
  threshold: number;
  remainingUntilThreshold: number;
  overThresholdBy: number;
  displayedOutput: string;
}
