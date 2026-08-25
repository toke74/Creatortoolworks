export type DescriptionStatus = "empty" | "ready" | "error";

export interface DescriptionCounts {
  characterCount: number;
  remainingCharacters: number;
  wordCount: number;
  lineCount: number;
  linkCount: number;
  hashtagCount: number;
}

export interface DescriptionReport extends DescriptionCounts {
  status: DescriptionStatus;
  /** 0 while at or under the limit; otherwise the number of characters to remove. */
  overLimitBy: number;
}
