"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import { youtubeTitleMaxCharacters } from "@/lib/platform-facts/youtube-title";
import {
  buildTitleReport,
  countTitleCharacters,
  isTitleCopyAllowed,
  normalizeRepeatedSpaces,
} from "@/lib/tools/title-checker/analyze";

const MAX_CHARACTERS = youtubeTitleMaxCharacters.value;
const EXAMPLE_TITLE = "How I Edit a YouTube Short from Start to Finish";

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

interface YoutubeTitleCheckerProps {
  toolId: string;
}

export function YoutubeTitleChecker({ toolId }: YoutubeTitleCheckerProps) {
  const [title, setTitle] = useState("");
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

  const report = useMemo(() => buildTitleReport(title, MAX_CHARACTERS), [title]);
  const copyAllowed = isTitleCopyAllowed(report);
  const copyDisabled = !copyAllowed;
  const isEmptyState = report.status === "empty";
  const resultStatus = report.status === "error" ? "error" : "ready";

  const handleChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setCleanupMessage(null);
    setTitle(value);
  };

  const handleClear = () => {
    setCopyStatus("idle");
    setCleanupMessage(null);
    setTitle("");
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setCleanupMessage(null);
    setTitle(EXAMPLE_TITLE);
  };

  const handleNormalizeSpaces = () => {
    markStarted();
    setCopyStatus("idle");
    const before = countTitleCharacters(title);
    const normalized = normalizeRepeatedSpaces(title);
    const after = countTitleCharacters(normalized);
    setTitle(normalized);

    const removed = before - after;
    setCleanupMessage(
      removed > 0
        ? `Removed ${removed} repeated space${removed === 1 ? "" : "s"}.`
        : "No repeated spaces found - nothing to change.",
    );
  };

  const handleCopy = async () => {
    if (!copyAllowed || !title) return;
    const success = await copyTextToClipboard(title);
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
        <label htmlFor="title-textarea" className="text-sm font-medium text-[var(--text)]">
          Video title
        </label>
        <textarea
          id="title-textarea"
          value={title}
          onChange={(event) => handleChange(event.target.value)}
          rows={5}
          aria-invalid={report.status === "error" ? true : undefined}
          aria-describedby="title-character-status"
          className="mt-2 w-full min-w-0 break-words rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 focus-visible:border-[var(--accent)]"
          placeholder="Paste or write your YouTube title here..."
        />

        <p
          id="title-character-status"
          role={report.status === "error" ? "alert" : undefined}
          className={`mt-2 text-sm ${report.status === "error" ? "font-medium text-[#8f232a]" : "text-[var(--text-muted)]"}`}
        >
          {report.status === "error" ? <span aria-hidden="true">✕ </span> : null}
          {report.characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters
          {report.status === "error"
            ? ` - remove ${report.overLimitBy.toLocaleString()} character${report.overLimitBy === 1 ? "" : "s"} to enable copying.`
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
          <p className="text-sm font-medium text-[var(--text)]">Cleanup</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Optional, explicit cleanup only. Nothing modifies your title automatically while you type.
          </p>
          <button
            type="button"
            onClick={handleNormalizeSpaces}
            disabled={!title}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Normalize repeated spaces
          </button>
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
            Enter or paste a title to see the official character-limit check, word count, informational signals, and
            exact preview here.
          </p>
        ) : (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[resultStatus]}`}>
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[resultStatus]}</span>{" "}
                {report.status === "error" ? "Over the character limit" : "Ready to copy"}
                <span className="sr-only"> ({STATUS_LABEL[resultStatus]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">
                {report.status === "error"
                  ? `Your title is ${report.overLimitBy.toLocaleString()} character${report.overLimitBy === 1 ? "" : "s"} over YouTube's 100-character limit. Copying is disabled until it's back at or under the limit.`
                  : "Your title is within YouTube's published 100-character limit and ready to copy."}
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
              <MetricCard label="Capital letters" value={report.capitalLetterCount.toLocaleString()} />
              <MetricCard label="Digits" value={report.digitCount.toLocaleString()} />
              <MetricCard label="Emoji" value={report.emojiCount.toLocaleString()} />
            </dl>

            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Informational: </span>
              {report.repeatedSpaceRuns > 0
                ? `${report.repeatedSpaceRuns.toLocaleString()} repeated-space run${report.repeatedSpaceRuns === 1 ? "" : "s"} detected.`
                : "No repeated-space runs detected."}{" "}
              These signals are not YouTube pass/fail requirements.
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">Exact preview</p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {title}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={copyDisabled}
              aria-describedby={report.status === "error" ? "copy-title-blocked-note" : undefined}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy title
            </button>

            {report.status === "error" ? (
              <p id="copy-title-blocked-note" role="alert" className="mt-2 text-sm text-[#8f232a]">
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
