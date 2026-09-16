import type {
  EarningsEstimate,
  EarningsEstimatorError,
  EarningsEstimatorInput,
  EarningsEstimatorReport,
} from "./types";

const DECIMAL_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)$/;
const WHOLE_NUMBER_PATTERN = /^(?:\d+|\d{1,3}(?:,\d{3})+)$/;

export function parseViewsInput(value: string): number | null {
  const trimmed = value.trim();
  if (!WHOLE_NUMBER_PATTERN.test(trimmed)) return null;

  const parsed = Number(trimmed.replaceAll(",", ""));
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseRpmInput(value: string): number | null {
  const trimmed = value.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function validateViews(value: string): { value: number | null; error: EarningsEstimatorError | null } {
  if (!hasValue(value)) return { value: null, error: null };
  const parsed = parseViewsInput(value);

  if (parsed === null) {
    return {
      value: null,
      error: {
        field: "views",
        message: "Enter views or engaged views as a non-negative whole number.",
      },
    };
  }

  return { value: parsed, error: null };
}

function validateRpm(
  field: "lowRpm" | "highRpm",
  value: string,
): { value: number | null; error: EarningsEstimatorError | null } {
  if (!hasValue(value)) return { value: null, error: null };
  const parsed = parseRpmInput(value);

  if (parsed === null) {
    return {
      value: null,
      error: {
        field,
        message: field === "lowRpm" ? "Enter low RPM as a non-negative decimal." : "Enter high RPM as a non-negative decimal.",
      },
    };
  }

  return { value: parsed, error: null };
}

export function calculateEstimate(views: number, lowRpm: number, highRpm: number): EarningsEstimate | null {
  const lowEstimate = (views / 1000) * lowRpm;
  const highEstimate = (views / 1000) * highRpm;

  if (
    !Number.isFinite(lowEstimate) ||
    !Number.isFinite(highEstimate) ||
    Math.abs(lowEstimate) > Number.MAX_SAFE_INTEGER ||
    Math.abs(highEstimate) > Number.MAX_SAFE_INTEGER
  ) {
    return null;
  }

  return {
    views,
    lowRpm,
    highRpm,
    lowEstimate,
    highEstimate,
    isSingleEstimate: lowRpm === highRpm,
  };
}

export function buildEarningsEstimatorReport(input: EarningsEstimatorInput): EarningsEstimatorReport {
  const viewsResult = validateViews(input.views);
  const lowRpmResult = validateRpm("lowRpm", input.lowRpm);
  const highRpmResult = validateRpm("highRpm", input.highRpm);
  const errors = [viewsResult.error, lowRpmResult.error, highRpmResult.error].filter(
    (error): error is EarningsEstimatorError => error !== null,
  );

  if (
    lowRpmResult.value !== null &&
    highRpmResult.value !== null &&
    highRpmResult.value < lowRpmResult.value
  ) {
    errors.push({
      field: "highRpm",
      message: "High RPM must be greater than or equal to low RPM.",
    });
  }

  const allComplete = hasValue(input.views) && hasValue(input.lowRpm) && hasValue(input.highRpm);
  if (errors.length > 0) return { status: "error", errors, estimate: null };
  if (!allComplete || viewsResult.value === null || lowRpmResult.value === null || highRpmResult.value === null) {
    return { status: "empty", errors: [], estimate: null };
  }

  const estimate = calculateEstimate(viewsResult.value, lowRpmResult.value, highRpmResult.value);
  if (!estimate) {
    return {
      status: "error",
      errors: [
        {
          field: "views",
          message: "Enter smaller values so the estimate can be handled safely.",
        },
      ],
      estimate: null,
    };
  }

  return { status: "ready", errors: [], estimate };
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", options).format(value);
}

export function formatEstimateAmount(value: number): string {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRpm(value: number): string {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function buildEstimateCopyText(estimate: EarningsEstimate): string {
  const resultLine = estimate.isSingleEstimate
    ? `Estimated revenue: ${formatEstimateAmount(estimate.lowEstimate)}`
    : `Estimated revenue range: ${formatEstimateAmount(estimate.lowEstimate)} to ${formatEstimateAmount(
        estimate.highEstimate,
      )}`;

  return [
    "YouTube Earnings Estimator",
    `Views/engaged views: ${formatNumber(estimate.views)}`,
    `Low RPM: ${formatRpm(estimate.lowRpm)}`,
    `High RPM: ${formatRpm(estimate.highRpm)}`,
    "Formula: views / 1,000 x RPM",
    resultLine,
    "Currency: same currency as the RPM values entered; no conversion.",
    "Estimate only, not guaranteed earnings.",
  ].join("\n");
}

export function isEarningsCopyAllowed(report: EarningsEstimatorReport): boolean {
  return report.status === "ready" && report.estimate !== null;
}
