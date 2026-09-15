export type TitleStatus = "empty" | "ready" | "error";

export interface TitleReport {
  characterCount: number;
  remainingCharacters: number;
  overLimitBy: number;
  wordCount: number;
  capitalLetterCount: number;
  digitCount: number;
  emojiCount: number;
  repeatedSpaceRuns: number;
  status: TitleStatus;
}
