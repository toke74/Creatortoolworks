"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import { youtubeHashtagsIgnoreAllAboveCount } from "@/lib/platform-facts/youtube-hashtags";
import { buildHashtagReport, removeDuplicateHashtagOccurrences } from "@/lib/tools/hashtag-checker/analyze";

const HASHTAG_THRESHOLD = youtubeHashtagsIgnoreAllAboveCount.value;
const EXAMPLE_TEXT = `Example only - not a recommended hashtag strategy.

Publishing a creator workflow today.
#CreatorTools #YouTubeTips #VideoWorkflow #CreatorTools #Shorts`;

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
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
} as const;

interface YoutubeHashtagCheckerProps {
  toolId: string;
}

export function YoutubeHashtagChecker({ toolId }: YoutubeHashtagCheckerProps) {
  const [text, setText] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

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

  const report = useMemo(() => buildHashtagReport(text, HASHTAG_THRESHOLD), [text]);
  const copyAllowed = report.status === "ready";

  const handleChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setCleanupMessage(null);
    setText(value);
  };

  const handleClear = () => {
    setText("");
    setCopyStatus("idle");
    setCleanupMessage(null);
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleLoadExample = () => {
    markStarted();
    setText(EXAMPLE_TEXT);
    setCopyStatus("idle");
    setCleanupMessage(null);
  };

  const handleRemoveDuplicates = () => {
    markStarted();
    setCopyStatus("idle");
    const nextText = removeDuplicateHashtagOccurrences(text);
    const before = report.duplicateCount;
    setText(nextText);
    setCleanupMessage(
      before > 0
        ? `Removed ${before.toLocaleString()} duplicate hashtag occurrence${before === 1 ? "" : "s"}.`
        : "No exact duplicate hashtags found - nothing to change.",
    );
  };

  const handleCopy = async () => {
    if (!copyAllowed || !report.displayedOutput) return;
    const success = await copyTextToClipboard(report.displayedOutput);
    setCopyStatus(success ? "copied" : "error");
    if (success) {
      trackToolEvent({ name: "copy_clicked", toolId });
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        trackToolEvent({ name: "tool_completed", toolId });
      }
    } else {
      trackToolEvent({ name: "tool_error", toolId });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0">
        <label htmlFor="hashtag-textarea" className="text-sm font-medium text-[var(--text)]">
          Paste title, description, or hashtag text
        </label>
        <textarea
          id="hashtag-textarea"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          rows={10}
          aria-invalid={report.status === "error" ? true : undefined}
          aria-describedby="hashtag-input-guidance"
          className="mt-2 w-full min-w-0 break-words rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 focus-visible:border-[var(--accent)]"
          placeholder="#CreatorTools&#10;#YouTubeTips&#10;Paste a full description here too..."
        />
        <p id="hashtag-input-guidance" className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Hashtags are extracted exactly as no-space hashtag tokens. Text like <code>#Creator Tools</code> is treated
          as <code>#Creator</code> followed by normal text, not silently rewritten.
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

        <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-medium text-[var(--text)]">Duplicate cleanup</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Optional exact-match cleanup. It preserves the first occurrence, order, spelling, and capitalization.
          </p>
          <button
            type="button"
            onClick={handleRemoveDuplicates}
            disabled={!text || report.totalCount === 0}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove duplicate hashtags
          </button>
          {cleanupMessage ? (
            <p role="status" className="mt-3 text-sm font-medium text-[var(--text)]">
              {cleanupMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0" aria-live="polite">
        {report.status === "empty" ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Paste text to extract hashtags, count duplicates, and compare the total with YouTube&apos;s published
            60-hashtag threshold.
          </p>
        ) : null}

        {report.status === "none" ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-semibold text-[var(--text)]">No hashtags found</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              This is neutral. Add text beginning with <code>#</code> and no spaces, such as <code>#CreatorTools</code>,
              to see hashtag counts.
            </p>
          </div>
        ) : null}

        {report.status === "ready" || report.status === "error" ? (
          <div>
            <div
              className={`rounded-[var(--radius-lg)] border p-4 ${
                report.status === "error" ? STATUS_CLASSES.error : STATUS_CLASSES.ready
              }`}
            >
              <p className="font-semibold">
                {report.status === "error" ? "Over YouTube's hashtag threshold" : "Ready"}
              </p>
              <p className="mt-1 text-sm leading-6">
                {report.status === "error"
                  ? `YouTube's published policy says that if content has more than ${HASHTAG_THRESHOLD} hashtags, it ignores every hashtag on that content. Remove ${report.overThresholdBy.toLocaleString()} hashtag${report.overThresholdBy === 1 ? "" : "s"} to return to Ready.`
                  : `${report.totalCount.toLocaleString()} of ${HASHTAG_THRESHOLD.toLocaleString()} hashtags found; ${report.remainingUntilThreshold.toLocaleString()} remaining before the threshold.`}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Total hashtags" value={report.totalCount.toLocaleString()} />
              <MetricCard label="Unique hashtags" value={report.uniqueCount.toLocaleString()} />
              <MetricCard label="Duplicates" value={report.duplicateCount.toLocaleString()} />
            </dl>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Extracted hashtag preview
              </p>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {report.displayedOutput}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!copyAllowed}
              aria-describedby={report.status === "error" ? "copy-hashtags-blocked-note" : undefined}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy hashtags
            </button>

            {report.status === "error" ? (
              <p id="copy-hashtags-blocked-note" role="alert" className="mt-2 text-sm text-[#8f232a]">
                Copy is disabled until the list is back at {HASHTAG_THRESHOLD.toLocaleString()} or fewer hashtags.
              </p>
            ) : null}
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
