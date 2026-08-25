"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackToolEvent } from "@/lib/analytics/events";
import { MetricCard } from "@/components/tool/metric-card";
import {
  applyAllSafeCleanup,
  buildDescriptionReport,
  countCharacters,
  isDescriptionCopyAllowed,
  normalizeExcessiveBlankLines,
  trimLeadingTrailingBlankLines,
  trimTrailingWhitespace,
} from "@/lib/tools/description-formatter/analyze";
import { youtubeDescriptionMaxCharacters } from "@/lib/platform-facts/youtube-description";

const MAX_CHARACTERS = youtubeDescriptionMaxCharacters.value;

const EXAMPLE_DESCRIPTION =
  "\n\nLearn how to edit vertical video for Shorts in under 10 minutes.   \n\nIn this video:\n- Import your clip  \n- Crop to 9:16\n- Add captions\n\n\n\nWatch the full tutorial: https://example.com/tutorial\n\n\nSubscribe for more editing tips.\n\n#shorts #videoediting   #contentcreator\n\n";

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

const STATUS_ICON: Record<"ready" | "error", string> = { ready: "✓", error: "✕" };
const STATUS_LABEL: Record<"ready" | "error", string> = { ready: "Ready", error: "Error" };
const STATUS_BANNER_CLASSES: Record<"ready" | "error", string> = {
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
};

interface CleanupAction {
  label: string;
  description: string;
  run: (text: string) => string;
}

const CLEANUP_ACTIONS: CleanupAction[] = [
  { label: "Trim trailing whitespace", description: "trailing whitespace", run: trimTrailingWhitespace },
  {
    label: "Normalize excessive blank lines",
    description: "extra blank lines",
    run: normalizeExcessiveBlankLines,
  },
  {
    label: "Trim leading/trailing blank lines",
    description: "leading/trailing blank lines",
    run: trimLeadingTrailingBlankLines,
  },
  { label: "Apply all safe cleanup", description: "extra whitespace", run: applyAllSafeCleanup },
];

interface YoutubeDescriptionFormatterProps {
  toolId: string;
}

export function YoutubeDescriptionFormatter({ toolId }: YoutubeDescriptionFormatterProps) {
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

  const report = useMemo(() => buildDescriptionReport(text, MAX_CHARACTERS), [text]);
  const copyAllowed = isDescriptionCopyAllowed(report);
  const isEmptyState = report.status === "empty";
  const copyDisabled = report.status !== "ready";

  const handleChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setCleanupMessage(null);
    setText(value);
  };

  const handleClear = () => {
    setCopyStatus("idle");
    setCleanupMessage(null);
    setText("");
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setCleanupMessage(null);
    setText(EXAMPLE_DESCRIPTION);
  };

  const handleCleanup = (action: CleanupAction) => {
    markStarted();
    setCopyStatus("idle");
    const before = countCharacters(text);
    const cleaned = action.run(text);
    const after = countCharacters(cleaned);
    setText(cleaned);

    const removed = before - after;
    setCleanupMessage(
      removed > 0
        ? `Removed ${removed} character${removed === 1 ? "" : "s"} of ${action.description}.`
        : `No ${action.description} found — nothing to change.`,
    );
  };

  const handleCopy = async () => {
    if (!copyAllowed || !text) return;
    const success = await copyTextToClipboard(text);
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
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0">
        <label htmlFor="description-textarea" className="text-sm font-medium text-[var(--text)]">
          Video description
        </label>
        <textarea
          id="description-textarea"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          rows={16}
          aria-invalid={report.status === "error" ? true : undefined}
          aria-describedby="description-character-status"
          className="mt-2 w-full min-w-0 break-words rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 focus-visible:border-[var(--accent)]"
          placeholder="Paste or write your YouTube description here…"
        />

        <p
          id="description-character-status"
          role={report.status === "error" ? "alert" : undefined}
          className={`mt-2 text-sm ${report.status === "error" ? "font-medium text-[#8f232a]" : "text-[var(--text-muted)]"}`}
        >
          {report.status === "error" ? <span aria-hidden="true">✕ </span> : null}
          {report.characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters
          {report.status === "error"
            ? ` — remove ${report.overLimitBy.toLocaleString()} character${report.overLimitBy === 1 ? "" : "s"} to enable copying.`
            : ` (${report.remainingCharacters.toLocaleString()} remaining)`}
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
          <p className="text-sm font-medium text-[var(--text)]">Formatting controls</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Explicit, non-destructive cleanup. Nothing runs automatically while you type — your wording, links,
            hashtags, and timestamps are never changed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLEANUP_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleCleanup(action)}
                disabled={!text}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
          {cleanupMessage ? (
            <p role="status" className="mt-3 text-sm font-medium text-[var(--text)]">
              <span aria-hidden="true">✓</span> {cleanupMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0" aria-live="polite">
        {isEmptyState ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Enter or paste a description to see character, word, and line counts, plus a formatted preview, here.
          </p>
        ) : (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[report.status === "error" ? "error" : "ready"]}`}>
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[report.status === "error" ? "error" : "ready"]}</span>{" "}
                {report.status === "error" ? "Over the character limit" : "Ready to copy"}
                <span className="sr-only"> ({STATUS_LABEL[report.status === "error" ? "error" : "ready"]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">
                {report.status === "error"
                  ? `Your description is ${report.overLimitBy.toLocaleString()} character${report.overLimitBy === 1 ? "" : "s"} over YouTube's 5,000-character limit. Copying is disabled until it's back at or under the limit.`
                  : "Your description is within YouTube's character limit and ready to copy."}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Characters" value={report.characterCount.toLocaleString()} />
              <MetricCard
                label="Remaining"
                value={
                  report.remainingCharacters < 0
                    ? `${Math.abs(report.remainingCharacters).toLocaleString()} over`
                    : report.remainingCharacters.toLocaleString()
                }
              />
              <MetricCard label="Words" value={report.wordCount.toLocaleString()} />
              <MetricCard label="Lines" value={report.lineCount.toLocaleString()} />
              <MetricCard label="Links" value={report.linkCount.toLocaleString()} />
              <MetricCard label="Hashtags" value={report.hashtagCount.toLocaleString()} />
            </dl>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">Preview</p>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {text}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={copyDisabled}
              aria-describedby={report.status === "error" ? "copy-blocked-note" : undefined}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy description
            </button>

            {report.status === "error" ? (
              <p id="copy-blocked-note" role="alert" className="mt-2 text-sm text-[#8f232a]">
                <span aria-hidden="true">✕</span> Remove {report.overLimitBy.toLocaleString()} character
                {report.overLimitBy === 1 ? "" : "s"} above before copying.
              </p>
            ) : null}
            {copyStatus === "copied" ? (
              <p role="status" className="mt-2 text-sm font-medium text-[var(--success)]">
                <span aria-hidden="true">✓</span> Copied to your clipboard.
              </p>
            ) : null}
            {copyStatus === "error" ? (
              <p role="alert" className="mt-2 text-sm text-[#8f232a]">
                Couldn&apos;t copy automatically. Select the preview text above and copy it manually.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
