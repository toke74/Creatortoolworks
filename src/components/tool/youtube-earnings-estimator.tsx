"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "@/components/tool/metric-card";
import { trackToolEvent } from "@/lib/analytics/events";
import {
  buildEarningsEstimatorReport,
  buildEstimateCopyText,
  formatEstimateAmount,
  formatNumber,
  formatRpm,
  isEarningsCopyAllowed,
} from "@/lib/tools/earnings-estimator/calculate";
import type { EarningsEstimatorField, EarningsEstimatorInput } from "@/lib/tools/earnings-estimator/types";

const EXAMPLE_INPUT: EarningsEstimatorInput = {
  views: "100000",
  lowRpm: "1.00",
  highRpm: "2.00",
};

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

const STATUS_ICON: Record<"ready" | "error", string> = { ready: "OK", error: "!" };
const STATUS_LABEL: Record<"ready" | "error", string> = { ready: "Ready", error: "Error" };
const STATUS_BANNER_CLASSES: Record<"ready" | "error", string> = {
  ready: "border-[var(--success-border)] bg-[var(--success-soft)] text-[#0d5b3f]",
  error: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[#8f232a]",
};

interface YoutubeEarningsEstimatorProps {
  toolId: string;
}

function emptyInput(): EarningsEstimatorInput {
  return { views: "", lowRpm: "", highRpm: "" };
}

export function YoutubeEarningsEstimator({ toolId }: YoutubeEarningsEstimatorProps) {
  const [input, setInput] = useState<EarningsEstimatorInput>(emptyInput);
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

  const report = useMemo(() => buildEarningsEstimatorReport(input), [input]);
  const copyAllowed = isEarningsCopyAllowed(report);
  const fieldErrors = useMemo(() => {
    const grouped: Partial<Record<EarningsEstimatorField, string[]>> = {};
    for (const error of report.errors) {
      grouped[error.field] = [...(grouped[error.field] ?? []), error.message];
    }
    return grouped;
  }, [report.errors]);

  const updateField = (field: EarningsEstimatorField, value: string) => {
    markStarted();
    setCopyStatus("idle");
    setInput((current) => ({ ...current, [field]: value }));
  };

  const handleLoadExample = () => {
    markStarted();
    setCopyStatus("idle");
    setInput(EXAMPLE_INPUT);
  };

  const handleClear = () => {
    setCopyStatus("idle");
    setInput(emptyInput());
    trackToolEvent({ name: "reset_clicked", toolId });
  };

  const handleCopy = async () => {
    if (!copyAllowed || !report.estimate) return;
    const success = await copyTextToClipboard(buildEstimateCopyText(report.estimate));
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

  const estimate = report.estimate;
  const resultStatus = report.status === "error" ? "error" : "ready";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <div className="min-w-0">
        <div className="space-y-4">
          <div>
            <label htmlFor="earnings-views" className="text-sm font-medium text-[var(--text)]">
              Views / engaged views
            </label>
            <input
              id="earnings-views"
              value={input.views}
              onChange={(event) => updateField("views", event.target.value)}
              inputMode="numeric"
              aria-invalid={fieldErrors.views ? true : undefined}
              aria-describedby={fieldErrors.views ? "earnings-views-error" : "earnings-views-help"}
              className="mt-2 min-h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm focus-visible:border-[var(--accent)]"
              placeholder="100000"
            />
            {fieldErrors.views ? (
              <p id="earnings-views-error" role="alert" className="mt-2 text-sm font-medium text-[#8f232a]">
                <span aria-hidden="true">! </span>
                {fieldErrors.views[0]}
              </p>
            ) : (
              <p id="earnings-views-help" className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                Use video views for video RPM, or engaged views for Shorts RPM.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="earnings-low-rpm" className="text-sm font-medium text-[var(--text)]">
                Low RPM
              </label>
              <input
                id="earnings-low-rpm"
                value={input.lowRpm}
                onChange={(event) => updateField("lowRpm", event.target.value)}
                inputMode="decimal"
                aria-invalid={fieldErrors.lowRpm ? true : undefined}
                aria-describedby={fieldErrors.lowRpm ? "earnings-low-rpm-error" : "earnings-rpm-help"}
                className="mt-2 min-h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm focus-visible:border-[var(--accent)]"
                placeholder="1.00"
              />
              {fieldErrors.lowRpm ? (
                <p id="earnings-low-rpm-error" role="alert" className="mt-2 text-sm font-medium text-[#8f232a]">
                  <span aria-hidden="true">! </span>
                  {fieldErrors.lowRpm[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="earnings-high-rpm" className="text-sm font-medium text-[var(--text)]">
                High RPM
              </label>
              <input
                id="earnings-high-rpm"
                value={input.highRpm}
                onChange={(event) => updateField("highRpm", event.target.value)}
                inputMode="decimal"
                aria-invalid={fieldErrors.highRpm ? true : undefined}
                aria-describedby={fieldErrors.highRpm ? "earnings-high-rpm-error" : "earnings-rpm-help"}
                className="mt-2 min-h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm focus-visible:border-[var(--accent)]"
                placeholder="2.00"
              />
              {fieldErrors.highRpm ? (
                <p id="earnings-high-rpm-error" role="alert" className="mt-2 text-sm font-medium text-[#8f232a]">
                  <span aria-hidden="true">! </span>
                  {fieldErrors.highRpm[0]}
                </p>
              ) : null}
            </div>
          </div>

          <p id="earnings-rpm-help" className="text-sm leading-6 text-[var(--text-muted)]">
            Enter RPM in whatever currency you want the result to use. This tool does not convert currencies.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
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
          <p className="text-sm font-medium text-[var(--text)]">Illustrative example only</p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Load example uses 100,000 views with 1.00 to 2.00 RPM purely to demonstrate the math. Those are not
            average, typical, recommended, or official YouTube RPM values.
          </p>
        </div>
      </div>

      <div className="min-w-0" aria-live="polite">
        {report.status === "empty" ? (
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Enter views or engaged views, low RPM, and high RPM to estimate a revenue scenario. Incomplete fields are
            neutral - no result is shown until all required values are valid.
          </p>
        ) : (
          <div>
            <div className={`rounded-[var(--radius-lg)] border p-4 ${STATUS_BANNER_CLASSES[resultStatus]}`}>
              <p className="font-semibold">
                <span aria-hidden="true">{STATUS_ICON[resultStatus]}</span>{" "}
                {report.status === "error" ? "Check the highlighted inputs" : "Estimate ready"}
                <span className="sr-only"> ({STATUS_LABEL[resultStatus]})</span>
              </p>
              <p className="mt-1 text-sm leading-6">
                {report.status === "error"
                  ? "Fix the input errors before copying an estimate."
                  : "This is an assumption-based estimate using your RPM values, not guaranteed YouTube earnings."}
              </p>
            </div>

            {estimate ? (
              <>
                <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                    Estimated revenue {estimate.isSingleEstimate ? "amount" : "range"}
                  </p>
                  <p className="mt-2 break-words text-3xl font-bold tracking-tight text-[var(--text)]">
                    {estimate.isSingleEstimate
                      ? formatEstimateAmount(estimate.lowEstimate)
                      : `${formatEstimateAmount(estimate.lowEstimate)} to ${formatEstimateAmount(estimate.highEstimate)}`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Same currency as your RPM inputs. No currency conversion is performed.
                  </p>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <MetricCard label="Views used" value={formatNumber(estimate.views)} />
                  <MetricCard label="Low RPM" value={formatRpm(estimate.lowRpm)} />
                  <MetricCard label="High RPM" value={formatRpm(estimate.highRpm)} />
                  <MetricCard
                    label="Per 1,000 views"
                    value={estimate.isSingleEstimate ? formatRpm(estimate.lowRpm) : `${formatRpm(estimate.lowRpm)} to ${formatRpm(estimate.highRpm)}`}
                  />
                </dl>

                <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
                  <span className="font-semibold text-[var(--text)]">Formula: </span>
                  views / 1,000 x RPM. For this input, {formatNumber(estimate.views)} / 1,000 x{" "}
                  {estimate.isSingleEstimate
                    ? formatRpm(estimate.lowRpm)
                    : `${formatRpm(estimate.lowRpm)} to ${formatRpm(estimate.highRpm)}`}
                  .
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
                >
                  Copy estimate
                </button>
              </>
            ) : null}

            {copyStatus === "copied" ? (
              <p role="status" className="mt-2 text-sm font-medium text-[var(--success)]">
                <span aria-hidden="true">OK </span>Copied to your clipboard.
              </p>
            ) : null}
            {copyStatus === "error" ? (
              <p role="alert" className="mt-2 text-sm text-[#8f232a]">
                Couldn&apos;t copy automatically. Select the estimate text and copy it manually.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
