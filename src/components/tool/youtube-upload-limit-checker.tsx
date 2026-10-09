"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  analyzeUploadLimit,
  formatUploadDuration,
  formatUploadFileSize,
} from "@/lib/tools/upload-limit-checker/analyze";
import type { UploadLimitInput } from "@/lib/tools/upload-limit-checker/types";

const STATUS_CLASSES = {
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
} as const;

const CHECK_CLASSES = {
  pass: "border border-[var(--border)] border-l-4 border-l-[var(--success)]",
  fail: "border border-[var(--border)] border-l-4 border-l-[var(--danger)]",
  info: "border border-[var(--border)] border-l-4 border-l-[var(--accent)]",
} as const;

const EXAMPLE_METADATA: UploadLimitInput = {
  fileName: "Illustrative example metadata",
  fileSizeBytes: 2_500_000_000,
  durationSeconds: 24 * 60,
  mimeType: "video/mp4",
};

interface YoutubeUploadLimitCheckerProps {
  toolId: string;
}

export function YoutubeUploadLimitChecker({ toolId }: YoutubeUploadLimitCheckerProps) {
  const [metadata, setMetadata] = useState<UploadLimitInput | null>(null);
  const [metadataError, setMetadataError] = useState("");
  const [manualSizeGb, setManualSizeGb] = useState("");
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

  const manualInput = useMemo<UploadLimitInput | null>(() => {
    if (!manualSizeGb && !manualDuration) return null;
    if (!manualSizeGb || !manualDuration) return null;

    return {
      fileName: "Manual metadata",
      fileSizeBytes: Number(manualSizeGb) * 1_000_000_000,
      durationSeconds: Number(manualDuration),
    };
  }, [manualDuration, manualSizeGb]);

  const activeMetadata = sourceLabel === "manual" ? manualInput : metadata;
  const analysis = analyzeUploadLimit(activeMetadata);

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
    setManualSizeGb("");
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
      setMetadata({
        fileName: file.name,
        fileSizeBytes: file.size,
        durationSeconds: video.duration,
        mimeType: file.type || undefined,
      });
      setMetadataError("");
      setIsReading(false);
    };

    video.onerror = () => {
      revokeCurrentObjectUrl();
      setMetadata(null);
      setMetadataError(
        "Browser metadata could not be read for this file. Enter file size and duration manually below.",
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

  const handleManualChange = (field: "size" | "duration", value: string) => {
    markStarted();
    setMetadataError("");
    setSourceLabel("manual");
    if (field === "size") setManualSizeGb(value);
    if (field === "duration") setManualDuration(value);
  };

  const handleLoadExample = () => {
    markStarted();
    revokeCurrentObjectUrl();
    setMetadata(EXAMPLE_METADATA);
    setMetadataError("");
    setManualSizeGb("");
    setManualDuration("");
    setSourceLabel("example");
    setIsReading(false);
  };

  const handleClear = () => {
    revokeCurrentObjectUrl();
    setMetadata(null);
    setMetadataError("");
    setManualSizeGb("");
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
          <label htmlFor="upload-limit-video-input" className="block cursor-pointer">
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
              <path d="M12 3v11" strokeLinecap="round" />
              <path d="M8.5 6.5 12 3l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="4.5" y="14" width="15" height="6.5" rx="2" />
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
            id="upload-limit-video-input"
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
            Use this only when browser metadata is unavailable, or when you want to check hypothetical size and
            duration values without selecting a file.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--text)]">
              File size in GB
              <input
                type="number"
                min="0.001"
                step="0.001"
                inputMode="decimal"
                value={manualSizeGb}
                onChange={(event) => handleManualChange("size", event.target.value)}
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
            Choose a video file to check its local file size and browser-readable duration, or use the manual
            fallback for hypothetical checks.
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
                {analysis.status === "ready" ? "Within published upload limits" : "Upload limit issue"}
              </p>
              <p className="mt-1 text-sm leading-6">
                {analysis.status === "ready"
                  ? "This file is within YouTube's currently published 256 GB and 12-hour upload limits."
                  : "Fix the failed limit check before treating this file as within YouTube's published upload limits."}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <MetricCard label="File name" value={analysis.input.fileName ?? "Not available"} />
              <MetricCard label="File size" value={formatUploadFileSize(analysis.input.fileSizeBytes)} />
              <MetricCard label="Duration" value={formatUploadDuration(analysis.input.durationSeconds)} />
              <MetricCard label="Type" value={analysis.input.mimeType ?? "Informational only"} />
            </dl>

            <ul className="mt-6 space-y-3">
              {analysis.checks.map((check) => (
                <li key={check.id} className={`rounded-[var(--radius-md)] p-3 ${CHECK_CLASSES[check.status]}`}>
                  <p className="font-semibold text-[var(--text)]">
                    <span aria-hidden="true">{check.status === "pass" ? "OK" : check.status === "fail" ? "X" : "i"}</span>{" "}
                    {check.label}: {check.status === "pass" ? "Pass" : check.status === "fail" ? "Fail" : "Info"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{check.message}</p>
                </li>
              ))}
            </ul>

            {sourceLabel === "example" ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Example metadata is illustrative only. 2.5 GB and 24 minutes are not recommended upload targets.
              </p>
            ) : null}

            <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">Important limitations</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Passing this checker does not guarantee that YouTube will accept, process, publish, monetize, or
                retain the upload. This tool cannot determine account verification status, copyright or Content ID
                issues, channel restrictions, daily upload limits, codec validity, processing success, monetization
                eligibility, or Community Guidelines compliance.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
