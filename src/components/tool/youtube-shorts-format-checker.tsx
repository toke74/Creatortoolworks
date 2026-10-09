"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  analyzeShortsFormat,
  formatShortsDuration,
  formatShortsFileSize,
  formatShortsOrientation,
} from "@/lib/tools/shorts-format-checker/analyze";
import type { ShortsFormatInput } from "@/lib/tools/shorts-format-checker/types";

const STATUS_CLASSES = {
  neutral: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text)]",
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
} as const;

const CHECK_CLASSES = {
  pass: "border border-[var(--border)] border-l-4 border-l-[var(--success)]",
  fail: "border border-[var(--border)] border-l-4 border-l-[var(--danger)]",
} as const;

const EXAMPLE_METADATA: ShortsFormatInput = {
  widthPx: 1080,
  heightPx: 1920,
  durationSeconds: 150,
  fileName: "Illustrative example metadata",
};

interface YoutubeShortsFormatCheckerProps {
  toolId: string;
}

export function YoutubeShortsFormatChecker({ toolId }: YoutubeShortsFormatCheckerProps) {
  const [metadata, setMetadata] = useState<ShortsFormatInput | null>(null);
  const [metadataError, setMetadataError] = useState("");
  const [manualWidth, setManualWidth] = useState("");
  const [manualHeight, setManualHeight] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [sourceLabel, setSourceLabel] = useState<"file" | "manual" | "example" | "empty">("empty");
  const [isReading, setIsReading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef("");
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    trackToolEvent({ name: "tool_view", toolId });
    // Fire once per mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revokeCurrentObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeCurrentObjectUrl();
    };
  }, [revokeCurrentObjectUrl]);

  const markStarted = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackToolEvent({ name: "tool_started", toolId });
    }
  }, [toolId]);

  const manualInput = useMemo<ShortsFormatInput | null>(() => {
    if (!manualWidth && !manualHeight && !manualDuration) return null;
    if (!manualWidth || !manualHeight || !manualDuration) return null;

    return {
      widthPx: Number(manualWidth),
      heightPx: Number(manualHeight),
      durationSeconds: Number(manualDuration),
      fileName: "Manual metadata",
    };
  }, [manualDuration, manualHeight, manualWidth]);

  const activeMetadata = sourceLabel === "manual" ? manualInput : metadata;
  const analysis = analyzeShortsFormat(activeMetadata);

  useEffect(() => {
    if (analysis?.status === "ready" && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      trackToolEvent({ name: "tool_completed", toolId });
    }
  }, [analysis?.status, toolId]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    markStarted();
    revokeCurrentObjectUrl();
    setIsReading(true);
    setMetadata(null);
    setMetadataError("");
    setSourceLabel("file");
    setManualWidth("");
    setManualHeight("");
    setManualDuration("");

    if (file.type && !file.type.startsWith("video/")) {
      setIsReading(false);
      setMetadataError("That file does not look like a video. Choose a video file or enter metadata manually.");
      trackToolEvent({ name: "tool_error", toolId });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    video.onloadedmetadata = () => {
      const nextMetadata = {
        widthPx: video.videoWidth,
        heightPx: video.videoHeight,
        durationSeconds: video.duration,
        fileName: file.name,
        fileSizeBytes: file.size,
      };

      setMetadata(nextMetadata);
      setMetadataError("");
      setIsReading(false);
    };

    video.onerror = () => {
      revokeCurrentObjectUrl();
      setMetadata(null);
      setMetadataError(
        "Browser metadata could not be read for this file. Enter width, height, and duration manually below.",
      );
      setIsReading(false);
      trackToolEvent({ name: "tool_error", toolId });
    };

    video.src = objectUrl;
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleManualChange = (field: "width" | "height" | "duration", value: string) => {
    markStarted();
    setMetadataError("");
    setSourceLabel("manual");
    if (field === "width") setManualWidth(value);
    if (field === "height") setManualHeight(value);
    if (field === "duration") setManualDuration(value);
  };

  const handleLoadExample = () => {
    markStarted();
    revokeCurrentObjectUrl();
    setMetadata(EXAMPLE_METADATA);
    setMetadataError("");
    setManualWidth("");
    setManualHeight("");
    setManualDuration("");
    setSourceLabel("example");
    setIsReading(false);
  };

  const handleClear = () => {
    revokeCurrentObjectUrl();
    setMetadata(null);
    setMetadataError("");
    setManualWidth("");
    setManualHeight("");
    setManualDuration("");
    setSourceLabel("empty");
    setIsReading(false);
    hasStartedRef.current = false;
    hasCompletedRef.current = false;
    trackToolEvent({ name: "reset_clicked", toolId });
    inputRef.current?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0">
        <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center">
          <label htmlFor="shorts-video-input" className="block cursor-pointer">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.6"
              className="mx-auto"
            >
              <rect x="7.5" y="3.5" width="9" height="17" rx="2.25" />
              <path d="M11 9l4 3-4 3z" strokeLinejoin="round" />
            </svg>
            <p className="mt-3 font-semibold text-[var(--text)]">Choose or replace video</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Your video stays in your browser. CreatorToolWorks reads only local metadata needed for this check.
              The video is not uploaded.
            </p>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]">
              Choose video file
            </span>
          </label>
          <input
            ref={inputRef}
            id="shorts-video-input"
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Load example metadata
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            Clear
          </button>
        </div>

        <fieldset className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--text)]">Manual fallback</legend>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Use this only when browser metadata is unavailable, or when you want to check known metadata without
            selecting a file.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-[var(--text)]">
              Width
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={manualWidth}
                onChange={(event) => handleManualChange("width", event.target.value)}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-[var(--text)]">
              Height
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={manualHeight}
                onChange={(event) => handleManualChange("height", event.target.value)}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-[var(--text)]">
              Duration seconds
              <input
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                value={manualDuration}
                onChange={(event) => handleManualChange("duration", event.target.value)}
                className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm"
              />
            </label>
          </div>
        </fieldset>
      </div>

      <div className="min-w-0" aria-live="polite">
        {sourceLabel === "empty" && !metadataError ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Choose a video file to check duration and square-or-vertical format, or use the manual fallback when local
            metadata cannot be read.
          </p>
        ) : null}

        {isReading ? <p role="status">Reading local video metadata...</p> : null}

        {metadataError ? (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 text-sm font-medium text-[#8f232a]"
          >
            {metadataError}
          </p>
        ) : null}

        {analysis ? (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_CLASSES[analysis.status]}`}>
              <p className="font-semibold">
                {analysis.status === "ready" ? "Ready for Shorts format" : "Shorts format issue"}
              </p>
              <p className="mt-1 text-sm leading-6">
                {analysis.status === "ready"
                  ? "This file matches the duration and square/vertical format conditions YouTube currently publishes for Shorts."
                  : "Fix the failed check before treating this as matching YouTube's published Shorts format conditions."}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <MetricCard label="Duration" value={formatShortsDuration(analysis.input.durationSeconds)} />
              <MetricCard label="Width x Height" value={`${analysis.input.widthPx} x ${analysis.input.heightPx}px`} />
              <MetricCard label="Orientation" value={formatShortsOrientation(analysis.orientation)} />
              <MetricCard label="File size" value={formatShortsFileSize(analysis.input.fileSizeBytes)} />
            </dl>

            <ul className="mt-6 space-y-3">
              {analysis.checks.map((check) => (
                <li key={check.id} className={`rounded-[var(--radius-md)] p-3 ${CHECK_CLASSES[check.status]}`}>
                  <p className="font-semibold text-[var(--text)]">
                    <span aria-hidden="true">{check.status === "pass" ? "OK" : "X"}</span> {check.label}:{" "}
                    {check.status === "pass" ? "Pass" : "Fail"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{check.message}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">Important limitations</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                This tool cannot determine Content ID claims, copyright status, channel or account restrictions,
                Community Guidelines issues, monetization eligibility, music licensing, or final YouTube
                processing/classification. YouTube says Shorts over one minute with an active Content ID or copyright
                claim can be blocked; local file metadata cannot detect those claims.
              </p>
            </div>

            {sourceLabel === "example" ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Example metadata is illustrative only. 1080 x 1920 is not a YouTube requirement.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
