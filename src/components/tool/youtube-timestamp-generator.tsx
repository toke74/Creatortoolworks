"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  buildTimestampRowReports,
  formatTimestampsForCopy,
  isTimestampCopyAllowed,
  parsePastedTimestampList,
  sortTimestampRows,
  summarizeOverallTimestampStatus,
} from "@/lib/tools/timestamp-generator/parse";
import type { TimestampRowInput, TimestampRowStatus } from "@/lib/tools/timestamp-generator/types";

// Purely a client-side counter — never called during the initial render, which
// must stay identical between server and client to avoid a hydration mismatch.
// (Default/example rows below use fixed literal ids for exactly that reason.)
let rowIdCounter = 0;
function createRowId(): string {
  rowIdCounter += 1;
  return `row-${rowIdCounter}`;
}

function createDefaultRows(): TimestampRowInput[] {
  return [
    { id: "default-row-1", time: "00:00", label: "" },
    { id: "default-row-2", time: "", label: "" },
    { id: "default-row-3", time: "", label: "" },
  ];
}

function createExampleRows(): TimestampRowInput[] {
  return [
    { id: "example-row-1", time: "00:00", label: "Introduction" },
    { id: "example-row-2", time: "01:35", label: "What you'll learn" },
    { id: "example-row-3", time: "04:20", label: "Step-by-step walkthrough" },
    { id: "example-row-4", time: "08:15", label: "Final tips" },
  ];
}

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

const ROW_BORDER_CLASSES: Record<TimestampRowStatus, string> = {
  empty: "border-[var(--border)]",
  ready: "border-[var(--border)]",
  warning: "border-[var(--border)] border-l-4 border-l-[var(--warning)]",
  error: "border-[var(--border)] border-l-4 border-l-[var(--danger)]",
};

function summarizeHeadline(overall: "ready" | "warning" | "error", errorCount: number, warningCount: number): string {
  if (overall === "error") return errorCount === 1 ? "1 timestamp error" : `${errorCount} timestamp errors`;
  if (overall === "warning") return warningCount === 1 ? "1 recommendation" : `${warningCount} recommendations`;
  return "Ready to copy";
}

function summarizeMessage(overall: "ready" | "warning" | "error", errorCount: number, warningCount: number): string {
  if (overall === "error") {
    return errorCount === 1
      ? "1 timestamp can't be read. Copying is disabled until you fix it."
      : `${errorCount} timestamps can't be read. Copying is disabled until you fix them.`;
  }
  if (overall === "warning") {
    return warningCount === 1
      ? "1 result is worth reviewing before you copy."
      : `${warningCount} results are worth reviewing before you copy.`;
  }
  return "Every timestamp is valid and ready to copy.";
}

interface YoutubeTimestampGeneratorProps {
  toolId: string;
}

export function YoutubeTimestampGenerator({ toolId }: YoutubeTimestampGeneratorProps) {
  const [rows, setRows] = useState<TimestampRowInput[]>(() => createDefaultRows());
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

  const reports = useMemo(() => buildTimestampRowReports(rows), [rows]);
  const overall = useMemo(() => summarizeOverallTimestampStatus(reports), [reports]);
  const outputText = useMemo(() => formatTimestampsForCopy(rows), [rows]);
  const copyAllowed = useMemo(() => isTimestampCopyAllowed(reports), [reports]);
  const isEmptyState = reports.every((report) => report.status === "empty");

  const errorCount = reports.filter((report) => report.status === "error").length;
  const warningCount = reports.filter((report) => report.status === "warning").length;
  const copyDisabled = !copyAllowed || outputText.length === 0;

  const updateRow = (id: string, patch: Partial<Pick<TimestampRowInput, "time" | "label">>) => {
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
    setRows((prev) => [...prev, { id: createRowId(), time: "", label: "" }]);
  };

  const handleSort = () => {
    markStarted();
    setCopyStatus("idle");
    setRows((prev) => sortTimestampRows(prev));
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setRows(createExampleRows());
  };

  const handleClearAll = () => {
    setCopyStatus("idle");
    setPasteOpen(false);
    setPasteText("");
    setRows(createDefaultRows());
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleAddPastedLines = (event: FormEvent) => {
    event.preventDefault();
    const parsedLines = parsePastedTimestampList(pasteText);
    setPasteText("");
    setPasteOpen(false);
    if (parsedLines.length === 0) return;

    markStarted();
    setCopyStatus("idle");
    setRows((prev) => [
      ...prev,
      ...parsedLines.map((line) => ({ id: createRowId(), time: line.timeText, label: line.label })),
    ]);
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            + Add timestamp
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen((open) => !open)}
            aria-expanded={pasteOpen}
            aria-controls="paste-timestamps-panel"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Paste timestamp list
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
            Clear all
          </button>
        </div>

        {pasteOpen ? (
          <form
            id="paste-timestamps-panel"
            onSubmit={handleAddPastedLines}
            className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
          >
            <label htmlFor="paste-timestamps-input" className="text-sm font-medium text-[var(--text)]">
              Paste timestamps
            </label>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              One per line, timestamp first — e.g. <code>0:00 Intro</code> or <code>0:00 - Intro</code>.
            </p>
            <textarea
              id="paste-timestamps-input"
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm focus-visible:border-[var(--accent)]"
              placeholder={"0:00 Intro\n1:35 - What you'll learn"}
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

        <ul className="mt-4 space-y-3" data-testid="timestamp-rows">
          {rows.map((row, index) => {
            const report = reports[index];
            const messageId = `timestamp-row-${row.id}-message`;

            return (
              <li key={row.id} className={`rounded-[var(--radius-md)] p-3 ${ROW_BORDER_CLASSES[report.status]} border`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <div className="sm:w-24 sm:shrink-0">
                    <label htmlFor={`time-${row.id}`} className="sr-only">
                      Time for row {index + 1}
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
                    <label htmlFor={`label-${row.id}`} className="sr-only">
                      Label for row {index + 1}
                    </label>
                    <input
                      id={`label-${row.id}`}
                      type="text"
                      placeholder="Label (optional)"
                      value={row.label}
                      onChange={(event) => updateRow(row.id, { label: event.target.value })}
                      aria-describedby={report.messages.length ? messageId : undefined}
                      className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-sm focus-visible:border-[var(--accent)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove row ${index + 1}`}
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

      <div aria-live="polite">
        {isEmptyState ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Add a time and label for each moment, or paste an existing list, to see the formatted output here.
          </p>
        ) : (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[overall]}`}>
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[overall]}</span>{" "}
                {summarizeHeadline(overall, errorCount, warningCount)}
                <span className="sr-only"> ({STATUS_LABEL[overall]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">{summarizeMessage(overall, errorCount, warningCount)}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">Preview</p>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm text-[var(--text)]">
                {copyAllowed
                  ? outputText || "Nothing to copy yet."
                  : "Preview unavailable while a timestamp above has an error."}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={copyDisabled}
              aria-describedby={!copyAllowed ? "copy-blocked-note" : undefined}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy timestamps
            </button>

            {!copyAllowed ? (
              <p id="copy-blocked-note" role="alert" className="mt-2 text-sm text-[#8f232a]">
                <span aria-hidden="true">✕</span> Fix the invalid timestamp{errorCount === 1 ? "" : "s"} above before
                copying.
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
