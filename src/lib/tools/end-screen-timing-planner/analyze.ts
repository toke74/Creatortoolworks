import {
  youtubeEndScreenMaxWindowSeconds,
  youtubeEndScreenMinVideoDurationSeconds,
  youtubeEndScreenMinWindowSeconds,
} from "@/lib/platform-facts/youtube-end-screens";
import { formatTimestamp, parseTimestamp } from "@/lib/tools/timestamp-generator/parse";
import type { EndScreenTimingInput, EndScreenTimingResult } from "./types";

const MAX_SAFE_SECONDS = 24 * 60 * 60 * 365;

function neutral(message: string): EndScreenTimingResult {
  return {
    status: "neutral",
    title: "Enter timing details",
    message,
    videoDurationSeconds: null,
    endScreenLengthSeconds: null,
    startSeconds: null,
    endSeconds: null,
    display: null,
  };
}

function error(message: string, title = "Timing issue"): EndScreenTimingResult {
  return {
    status: "error",
    title,
    message,
    videoDurationSeconds: null,
    endScreenLengthSeconds: null,
    startSeconds: null,
    endSeconds: null,
    display: null,
  };
}

function parseEndScreenLength(raw: string): { ok: true; value: number } | { ok: false; reason: string } {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Enter an end screen length." };
  if (!/^\d+$/.test(value)) return { ok: false, reason: "End screen length must be a whole number of seconds." };

  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) return { ok: false, reason: "End screen length is outside safe numeric handling." };
  if (seconds < youtubeEndScreenMinWindowSeconds.value) {
    return { ok: false, reason: "End screen length must be at least 5 seconds." };
  }
  if (seconds > youtubeEndScreenMaxWindowSeconds.value) {
    return { ok: false, reason: "End screen length must be no more than 20 seconds." };
  }

  return { ok: true, value: seconds };
}

export function analyzeEndScreenTiming(input: EndScreenTimingInput): EndScreenTimingResult {
  const videoDurationText = input.videoDuration.trim();
  const endScreenLengthText = input.endScreenLength.trim();

  if (!videoDurationText && !endScreenLengthText) {
    return neutral("Enter a video duration and end screen length to calculate the start time.");
  }
  if (!videoDurationText) return neutral("Enter a video duration to calculate the end screen timing.");
  if (!endScreenLengthText) return neutral("Enter an end screen length between 5 and 20 seconds.");

  const parsedDuration = parseTimestamp(videoDurationText);
  if (!parsedDuration.ok) return error(parsedDuration.error);
  if (!Number.isSafeInteger(parsedDuration.totalSeconds) || parsedDuration.totalSeconds > MAX_SAFE_SECONDS) {
    return error("Video duration is outside safe numeric handling.");
  }
  if (parsedDuration.totalSeconds <= 0) return error("Video duration must be greater than zero.");
  if (parsedDuration.totalSeconds < youtubeEndScreenMinVideoDurationSeconds.value) {
    return error(
      "YouTube says a video must be at least 25 seconds long to have an end screen.",
      "Video is too short for an end screen",
    );
  }

  const parsedLength = parseEndScreenLength(endScreenLengthText);
  if (!parsedLength.ok) return error(parsedLength.reason);

  const startSeconds = parsedDuration.totalSeconds - parsedLength.value;
  return {
    status: "ready",
    title: "End screen timing ready",
    message:
      "This timing fits YouTube's published 5-20 second end-screen window for a video that is at least 25 seconds long.",
    videoDurationSeconds: parsedDuration.totalSeconds,
    endScreenLengthSeconds: parsedLength.value,
    startSeconds,
    endSeconds: parsedDuration.totalSeconds,
    display: {
      videoDuration: formatTimestamp(parsedDuration.totalSeconds),
      start: formatTimestamp(startSeconds),
      end: formatTimestamp(parsedDuration.totalSeconds),
      length: `${parsedLength.value} seconds`,
    },
  };
}

export function formatEndScreenTimingForCopy(result: EndScreenTimingResult): string {
  if (result.status !== "ready" || !result.display) return "";

  return [
    "YouTube end screen timing",
    `Video duration: ${result.display.videoDuration}`,
    `Start: ${result.display.start}`,
    `End: ${result.display.end}`,
    `End screen length: ${result.display.length}`,
  ].join("\n");
}
