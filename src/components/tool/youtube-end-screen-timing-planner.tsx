"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  analyzeEndScreenTiming,
  formatEndScreenTimingForCopy,
} from "@/lib/tools/end-screen-timing-planner/analyze";

const EXAMPLE_DURATION = "12:35";
const EXAMPLE_LENGTH = "15";

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy fallback below
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

const STATUS_CLASSES = {
  neutral: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)]",
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
} as const;

interface YoutubeEndScreenTimingPlannerProps {
  toolId: string;
}

export function YoutubeEndScreenTimingPlanner({ toolId }: YoutubeEndScreenTimingPlannerProps) {
  const [videoDuration, setVideoDuration] = useState("");
  const [endScreenLength, setEndScreenLength] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [loadedExample, setLoadedExample] = useState(false);

  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    trackToolEvent({ name: "tool_view", toolId });
    // Fire once per mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markStarted = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackToolEvent({ name: "tool_started", toolId });
    }
  }, [toolId]);

  const result = useMemo(
    () => analyzeEndScreenTiming({ videoDuration, endScreenLength }),
    [endScreenLength, videoDuration],
  );
  const copyText = useMemo(() => formatEndScreenTimingForCopy(result), [result]);

  useEffect(() => {
    if (result.status === "error") trackToolEvent({ name: "tool_error", toolId });
    if (result.status === "ready" && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      trackToolEvent({ name: "tool_completed", toolId });
    }
  }, [result.status, toolId]);

  const handleDurationChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setLoadedExample(false);
    setVideoDuration(value);
  };

  const handleLengthChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setLoadedExample(false);
    setEndScreenLength(value);
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setLoadedExample(true);
    setVideoDuration(EXAMPLE_DURATION);
    setEndScreenLength(EXAMPLE_LENGTH);
  };

  const handleClear = () => {
    setVideoDuration("");
    setEndScreenLength("");
    setCopyStatus("idle");
    setLoadedExample(false);
    hasStartedRef.current = false;
    hasCompletedRef.current = false;
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleCopy = async () => {
    if (!copyText) return;
    const success = await copyTextToClipboard(copyText);
    setCopyStatus(success ? "copied" : "error");
    trackToolEvent({ name: success ? "copy_clicked" : "tool_error", toolId });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text)]">
            Video duration
            <input
              type="text"
              inputMode="numeric"
              value={videoDuration}
              onChange={(event) => handleDurationChange(event.target.value)}
              aria-invalid={result.status === "error" && result.message.toLowerCase().includes("video") ? true : undefined}
              aria-describedby="end-screen-duration-help"
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm focus-visible:border-[var(--accent)]"
              placeholder="12:35"
            />
          </label>
          <label className="text-sm font-medium text-[var(--text)]">
            End screen length (seconds)
            <input
              type="number"
              min="5"
              max="20"
              step="1"
              inputMode="numeric"
              value={endScreenLength}
              onChange={(event) => handleLengthChange(event.target.value)}
              aria-invalid={result.status === "error" && result.message.toLowerCase().includes("length") ? true : undefined}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-sm focus-visible:border-[var(--accent)]"
            />
          </label>
        </div>
        <p id="end-screen-duration-help" className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Use whole seconds, m:ss, or h:mm:ss. For example, 25 is 25 seconds, while 25:00 is 25 minutes.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            Clear
          </button>
        </div>

        {loadedExample ? (
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Example timing is illustrative only. It is not a recommendation, performance claim, or optimization target.
          </p>
        ) : null}
      </div>

      <div className="min-w-0" aria-live="polite">
        <div
          role={result.status === "error" ? "alert" : result.status === "ready" ? "status" : undefined}
          className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_CLASSES[result.status]}`}
        >
          <p className="font-semibold">{result.title}</p>
          <p className="mt-1 text-sm leading-6">{result.message}</p>
        </div>

        {result.status === "ready" && result.display ? (
          <div className="mt-6">
            <dl className="grid grid-cols-2 gap-3">
              <MetricCard label="Video duration" value={result.display.videoDuration} />
              <MetricCard label="End screen starts" value={result.display.start} />
              <MetricCard label="End screen ends" value={result.display.end} />
              <MetricCard label="End screen length" value={result.display.length} />
            </dl>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">Copy preview</p>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {copyText}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
            >
              Copy timing
            </button>

            {copyStatus === "copied" ? (
              <p role="status" className="mt-2 text-sm font-medium text-[var(--success)]">
                Copied to your clipboard.
              </p>
            ) : null}
            {copyStatus === "error" ? (
              <p role="alert" className="mt-2 text-sm text-[#8f232a]">
                Couldn&apos;t copy automatically. Select the preview text above and copy it manually.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
