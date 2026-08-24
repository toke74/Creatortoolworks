"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  analyzeThumbnail,
  formatFileSize,
  formatImageFormatLabel,
  summarizeOverallStatus,
} from "@/lib/tools/thumbnail-checker/analyze";
import { MetricCard } from "@/components/tool/metric-card";
import type { ThumbnailAnalysis } from "@/lib/tools/thumbnail-checker/types";

type ViewState = "empty" | "processing" | "result" | "error";

const STATUS_ICON: Record<ThumbnailAnalysis["overallStatus"], string> = {
  pass: "✓",
  warning: "⚠",
  fail: "✕",
};

const STATUS_LABEL: Record<ThumbnailAnalysis["overallStatus"], string> = {
  pass: "Pass",
  warning: "Warning",
  fail: "Fail",
};

const STATUS_BANNER_CLASSES: Record<ThumbnailAnalysis["overallStatus"], string> = {
  pass: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  warning: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[#7a4a05]",
  fail: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
};

const STATUS_CHECK_CLASSES: Record<ThumbnailAnalysis["overallStatus"], string> = {
  pass: "border border-[var(--border)] border-l-4 border-l-[var(--success)]",
  warning: "border border-[var(--border)] border-l-4 border-l-[var(--warning)]",
  fail: "border border-[var(--border)] border-l-4 border-l-[var(--danger)]",
};

function summarizeHeadline(analysis: ThumbnailAnalysis): string {
  if (analysis.overallStatus === "pass") return "Ready to upload";

  const issueCount = analysis.checks.filter((check) => check.status !== "pass").length;
  return issueCount === 1 ? "1 recommendation" : `${issueCount} recommendations`;
}

interface ThumbnailSizeCheckerProps {
  toolId: string;
}

export function ThumbnailSizeChecker({ toolId }: ThumbnailSizeCheckerProps) {
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [analysis, setAnalysis] = useState<ThumbnailAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef("");
  const hasStartedRef = useRef(false);

  useEffect(() => {
    trackToolEvent({ name: "tool_view", toolId });
    // Fire once per mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const revokeCurrentPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }, []);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        trackToolEvent({ name: "tool_started", toolId });
      }

      if (file.type && !file.type.startsWith("image/")) {
        revokeCurrentPreview();
        setPreviewUrl("");
        setAnalysis(null);
        setFileName(file.name);
        setErrorMessage("That file doesn't look like an image. Choose a JPG or PNG file.");
        setViewState("error");
        trackToolEvent({ name: "tool_error", toolId });
        return;
      }

      setViewState("processing");
      setFileName(file.name);
      setErrorMessage("");

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        revokeCurrentPreview();
        objectUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);

        const result = analyzeThumbnail({
          widthPx: image.naturalWidth,
          heightPx: image.naturalHeight,
          fileSizeBytes: file.size,
          mimeType: file.type,
        });

        setAnalysis(result);
        setViewState("result");
        trackToolEvent({ name: "tool_completed", toolId });
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        revokeCurrentPreview();
        setPreviewUrl("");
        setAnalysis(null);
        setErrorMessage("This image couldn't be opened. It may be corrupted or in an unsupported format.");
        setViewState("error");
        trackToolEvent({ name: "tool_error", toolId });
      };

      image.src = objectUrl;
    },
    [revokeCurrentPreview, toolId],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    revokeCurrentPreview();
    setPreviewUrl("");
    setAnalysis(null);
    setErrorMessage("");
    setFileName("");
    setViewState("empty");
    hasStartedRef.current = false;
    trackToolEvent({ name: "reset_clicked", toolId });
    inputRef.current?.focus();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div
          data-testid="thumbnail-dropzone"
          className={`rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? "border-[var(--accent)] bg-[var(--accent-soft)]"
              : "border-[var(--border)] bg-[var(--surface-muted)]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="thumbnail-file-input" className="block cursor-pointer">
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
              <path d="M12 15V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-3 font-semibold text-[var(--text)]">Drop an image here or choose a file</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">JPG or PNG. Nothing leaves your browser.</p>
            <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]">
              Choose an image
            </span>
          </label>
          <input
            ref={inputRef}
            id="thumbnail-file-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>

        {viewState !== "empty" ? (
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Check another thumbnail
          </button>
        ) : null}

        {previewUrl ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote asset */}
            <img
              src={previewUrl}
              alt={`Preview of ${fileName || "the selected thumbnail"}`}
              className="max-h-64 w-full rounded-[var(--radius-lg)] border border-[var(--border)] object-contain"
            />
          </div>
        ) : null}
      </div>

      <div aria-live="polite">
        {viewState === "empty" ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Select an image to see its dimensions, aspect ratio, file size, and current YouTube thumbnail
            compatibility.
          </p>
        ) : null}

        {viewState === "processing" ? <p role="status">Analyzing {fileName}…</p> : null}

        {viewState === "error" ? (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4 font-medium text-[#8f232a]"
          >
            {errorMessage}
          </p>
        ) : null}

        {viewState === "result" && analysis ? (
          <div>
            <div
              className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[analysis.overallStatus]}`}
            >
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[analysis.overallStatus]}</span>{" "}
                {summarizeHeadline(analysis)}
                <span className="sr-only"> ({STATUS_LABEL[analysis.overallStatus]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">{summarizeOverallStatus(analysis)}</p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <MetricCard label="Dimensions" value={`${analysis.input.widthPx} × ${analysis.input.heightPx}px`} />
              <MetricCard label="Aspect ratio" value={analysis.aspectRatio.label} />
              <MetricCard label="File size" value={formatFileSize(analysis.input.fileSizeBytes)} />
              <MetricCard label="Format" value={formatImageFormatLabel(analysis.input.mimeType)} />
            </dl>

            <ul className="mt-6 space-y-3">
              {analysis.checks.map((check) => (
                <li
                  key={check.id}
                  className={`rounded-[var(--radius-md)] p-3 ${STATUS_CHECK_CLASSES[check.status]}`}
                >
                  <p className="font-semibold text-[var(--text)]">
                    <span aria-hidden="true">{STATUS_ICON[check.status]}</span> {check.label}:{" "}
                    {STATUS_LABEL[check.status]}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{check.message}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
