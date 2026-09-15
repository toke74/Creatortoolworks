"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { trackToolEvent } from "@/lib/analytics/events";
import { parsePastedTimestampList } from "@/lib/tools/timestamp-generator/parse";
import {
  buildChapterRequirementChecks,
  buildChapterRowReports,
  buildChapterSummaryMessages,
  formatChaptersForCopy,
  isChapterCopyAllowed,
  mergePastedChapterRows,
  parseChapterDuration,
  sortChapterRows,
  summarizeOverallChapterStatus,
} from "@/lib/tools/chapter-generator/validate";
import type { ChapterRequirementCheck, ChapterRowInput, ChapterRowStatus } from "@/lib/tools/chapter-generator/types";

// Purely a client-side counter — never called during the initial render, which
// must stay identical between server and client to avoid a hydration mismatch.
// (Default/example rows below use fixed literal ids for exactly that reason.)
let rowIdCounter = 0;
function createRowId(): string {
  rowIdCounter += 1;
  return `chapter-row-${rowIdCounter}`;
}

// Unlike the Timestamp Generator, a missing chapter title is an error (not a
// warning) here — so the default scaffold starts fully blank rather than
// pre-filling 00:00, which would otherwise show an error before the user has
// typed anything.
function createDefaultRows(): ChapterRowInput[] {
  return [
    { id: "default-chapter-1", time: "", title: "" },
    { id: "default-chapter-2", time: "", title: "" },
    { id: "default-chapter-3", time: "", title: "" },
  ];
}

function createExampleRows(): ChapterRowInput[] {
  return [
    { id: "example-chapter-1", time: "00:00", title: "Introduction" },
    { id: "example-chapter-2", time: "01:35", title: "Choosing your topic" },
    { id: "example-chapter-3", time: "04:20", title: "Recording the video" },
    { id: "example-chapter-4", time: "08:10", title: "Editing workflow" },
  ];
}

// Comfortably beyond the last example chapter (08:10) so Load example demonstrates
// a fully verified Ready state out of the box, with every check passing rather than
// leaving the final chapter's length unverified. The field stays editable — clearing
// it afterward shows the informational "Final chapter length: Not verified" state.
const EXAMPLE_VIDEO_DURATION = "10:00";

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

const STATUS_ICON: Record<"ready" | "warning" | "error", string> = {
  ready: "✓",
  warning: "⚠",
  error: "✕",
};

const STATUS_LABEL: Record<"ready" | "warning" | "error", string> = {
  ready: "Ready",
  warning: "Warning",
  error: "Error",
};

const STATUS_BANNER_CLASSES: Record<"ready" | "warning" | "error", string> = {
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  warning: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[#7a4a05]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
};

const CHECK_ICON: Record<ChapterRequirementCheck["status"], string> = {
  pass: "✓",
  warning: "⚠",
  fail: "✕",
  info: "ℹ",
};

const CHECK_LABEL: Record<ChapterRequirementCheck["status"], string> = {
  pass: "Pass",
  warning: "Warning",
  fail: "Fail",
  info: "Not verified",
};

// "info" deliberately uses a neutral (not warning-yellow) border/text so an
// unverified-but-optional check never reads as something being wrong.
const CHECK_CLASSES: Record<ChapterRequirementCheck["status"], string> = {
  pass: "border border-[var(--border)] border-l-4 border-l-[var(--success)]",
  warning: "border border-[var(--border)] border-l-4 border-l-[var(--warning)]",
  fail: "border border-[var(--border)] border-l-4 border-l-[var(--danger)]",
  info: "border border-[var(--border)] border-l-4 border-l-[var(--text-muted)]",
};

const ROW_BORDER_CLASSES: Record<ChapterRowStatus, string> = {
  empty: "border-[var(--border)]",
  ready: "border-[var(--border)]",
  warning: "border-[var(--border)] border-l-4 border-l-[var(--warning)]",
  error: "border-[var(--border)] border-l-4 border-l-[var(--danger)]",
};

function summarizeHeadline(overall: "ready" | "warning" | "error", errorCount: number, warningCount: number): string {
  if (overall === "error") return errorCount === 1 ? "1 chapter error" : `${errorCount} chapter errors`;
  if (overall === "warning") return warningCount === 1 ? "1 thing to review" : `${warningCount} things to review`;
  return "Ready to copy";
}

function summarizeMessage(overall: "ready" | "warning" | "error"): string {
  if (overall === "error") return "Fix the errors below before copying — an invalid chapter list is never silently copied.";
  if (overall === "warning") return "You can still copy, but review the warnings below first.";
  return "This chapter list meets YouTube's manual-chapter requirements and is ready to copy.";
}

interface YoutubeChapterGeneratorProps {
  toolId: string;
}

export function YoutubeChapterGenerator({ toolId }: YoutubeChapterGeneratorProps) {
  const [rows, setRows] = useState<ChapterRowInput[]>(() => createDefaultRows());
  const [durationRaw, setDurationRaw] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

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

  const duration = useMemo(() => parseChapterDuration(durationRaw), [durationRaw]);
  const rowReports = useMemo(() => buildChapterRowReports(rows, duration.seconds), [rows, duration.seconds]);
  const summary = useMemo(() => buildChapterSummaryMessages(rowReports, durationRaw, duration), [rowReports, durationRaw, duration]);
  const overall = useMemo(() => summarizeOverallChapterStatus(rowReports, summary), [rowReports, summary]);
  const checks = useMemo(() => buildChapterRequirementChecks(rowReports, summary), [rowReports, summary]);
  const outputText = useMemo(() => formatChaptersForCopy(rows), [rows]);
  const copyAllowed = useMemo(() => isChapterCopyAllowed(overall), [overall]);
  const isEmptyState = overall === "empty";

  const errorCount = rowReports.filter((report) => report.status === "error").length + summary.errors.length;
  const warningCount = rowReports.filter((report) => report.status === "warning").length + summary.warnings.length;
  const copyDisabled = !copyAllowed || outputText.length === 0;

  const updateRow = (id: string, patch: Partial<Pick<ChapterRowInput, "time" | "title">>) => {
    markStarted();
    setCopyStatus("idle");
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    markStarted();
    setCopyStatus("idle");
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addRow = () => {
    markStarted();
    setCopyStatus("idle");
    setRows((prev) => [...prev, { id: createRowId(), time: "", title: "" }]);
  };

  const handleSort = () => {
    markStarted();
    setCopyStatus("idle");
    setRows((prev) => sortChapterRows(prev));
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setRows(createExampleRows());
    setDurationRaw(EXAMPLE_VIDEO_DURATION);
  };

  const handleClearAll = () => {
    setCopyStatus("idle");
    setPasteOpen(false);
    setPasteText("");
    setDurationRaw("");
    setRows(createDefaultRows());
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleDurationChange = (value: string) => {
    markStarted();
    setCopyStatus("idle");
    setDurationRaw(value);
  };

  const handleAddPastedLines = (event: FormEvent) => {
    event.preventDefault();
    const parsedLines = parsePastedTimestampList(pasteText);
    setPasteText("");
    setPasteOpen(false);
    if (parsedLines.length === 0) return;

    markStarted();
    setCopyStatus("idle");
    setRows((prev) => mergePastedChapterRows(prev, parsedLines, createRowId));
  };

  const handleCopy = async () => {
    if (!outputText) return;
    const success = await copyTextToClipboard(outputText);
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
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <div>
          <label htmlFor="video-duration-input" className="text-sm font-medium text-[var(--text)]">
            Video duration (optional)
          </label>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Needed to fully verify the final chapter is at least 10 seconds long.
          </p>
          <input
            id="video-duration-input"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12:45 or 1:02:03"
            value={durationRaw}
            onChange={(event) => handleDurationChange(event.target.value)}
            aria-invalid={duration.error ? true : undefined}
            aria-describedby={duration.error ? "video-duration-message" : undefined}
            className="mt-2 min-h-11 w-full max-w-xs rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm focus-visible:border-[var(--accent)]"
          />
          {duration.error ? (
            <p id="video-duration-message" role="alert" className="mt-2 text-sm text-[#8f232a]">
              <span aria-hidden="true">✕</span> {duration.error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + Add chapter
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen((open) => !open)}
            aria-expanded={pasteOpen}
            aria-controls="paste-chapters-panel"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Paste chapter list
          </button>
          <button
            type="button"
            onClick={handleSort}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Sort by time
          </button>
          <button
            type="button"
            onClick={handleLoadExample}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
          >
            Clear
          </button>
        </div>

        {pasteOpen ? (
          <form
            id="paste-chapters-panel"
            onSubmit={handleAddPastedLines}
            className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
          >
            <label htmlFor="paste-chapters-input" className="text-sm font-medium text-[var(--text)]">
              Paste chapters
            </label>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              One per line, timestamp first — e.g. <code>0:00 Intro</code> or <code>0:00 - Intro</code>.
            </p>
            <textarea
              id="paste-chapters-input"
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm focus-visible:border-[var(--accent)]"
              placeholder={"0:00 Intro\n1:35 - Choosing your topic"}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
              >
                Add lines
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasteOpen(false);
                  setPasteText("");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <ul className="mt-4 space-y-3" data-testid="chapter-rows">
          {rows.map((row, index) => {
            const report = rowReports[index];
            const messageId = `chapter-row-${row.id}-message`;

            return (
              <li key={row.id} className={`rounded-[var(--radius-md)] p-3 ${ROW_BORDER_CLASSES[report.status]} border`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <div className="sm:w-24 sm:shrink-0">
                    <label htmlFor={`time-${row.id}`} className="sr-only">
                      Time for chapter {index + 1}
                    </label>
                    <input
                      id={`time-${row.id}`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0:00"
                      value={row.time}
                      onChange={(event) => updateRow(row.id, { time: event.target.value })}
                      aria-invalid={report.status === "error" ? true : undefined}
                      aria-describedby={report.messages.length ? messageId : undefined}
                      className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm focus-visible:border-[var(--accent)]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`title-${row.id}`} className="sr-only">
                      Chapter title for chapter {index + 1}
                    </label>
                    <input
                      id={`title-${row.id}`}
                      type="text"
                      placeholder="Chapter title"
                      value={row.title}
                      onChange={(event) => updateRow(row.id, { title: event.target.value })}
                      aria-describedby={report.messages.length ? messageId : undefined}
                      className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm focus-visible:border-[var(--accent)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove chapter ${index + 1}`}
                    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center self-start rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)] sm:self-auto"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>

                {report.messages.length ? (
                  <p
                    id={messageId}
                    role={report.status === "error" ? "alert" : undefined}
                    className={`mt-2 text-sm ${report.status === "error" ? "text-[#8f232a]" : "text-[#7a4a05]"}`}
                  >
                    <span aria-hidden="true">{report.status === "error" ? "✕" : "⚠"}</span>{" "}
                    {report.messages.join(" ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div aria-live="polite" data-testid="chapter-results">
        {isEmptyState ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Add a time and title for each chapter, or paste an existing list, to see YouTube&apos;s chapter
            requirements checked here.
          </p>
        ) : (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[overall]}`}>
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[overall]}</span>{" "}
                {summarizeHeadline(overall, errorCount, warningCount)}
                <span className="sr-only"> ({STATUS_LABEL[overall]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">{summarizeMessage(overall)}</p>
            </div>

            {summary.errors.length || summary.warnings.length ? (
              <ul className="mt-4 space-y-2">
                {summary.errors.map((message) => (
                  <li key={message} role="alert" className="text-sm leading-6 text-[#8f232a]">
                    <span aria-hidden="true">✕</span> {message}
                  </li>
                ))}
                {summary.warnings.map((message) => (
                  <li key={message} className="text-sm leading-6 text-[#7a4a05]">
                    <span aria-hidden="true">⚠</span> {message}
                  </li>
                ))}
              </ul>
            ) : null}

            <ul className="mt-6 space-y-3">
              {checks.map((check) => (
                <li key={check.id} className={`rounded-[var(--radius-md)] p-3 ${CHECK_CLASSES[check.status]}`}>
                  <p className="font-semibold text-[var(--text)]">
                    <span aria-hidden="true">{CHECK_ICON[check.status]}</span> {check.label}:{" "}
                    {CHECK_LABEL[check.status]}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{check.message}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">Preview</p>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {copyAllowed
                  ? outputText || "Nothing to copy yet."
                  : "Preview unavailable while an error above is unresolved."}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={copyDisabled}
              aria-describedby={!copyAllowed ? "copy-blocked-note" : undefined}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy chapters
            </button>

            {!copyAllowed ? (
              <p id="copy-blocked-note" role="alert" className="mt-2 text-sm text-[#8f232a]">
                <span aria-hidden="true">✕</span> Fix the error{errorCount === 1 ? "" : "s"} above before copying.
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
