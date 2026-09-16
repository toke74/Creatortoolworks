import { describe, expect, it } from "vitest";
import {
  buildEarningsEstimatorReport,
  buildEstimateCopyText,
  formatEstimateAmount,
} from "@/lib/tools/earnings-estimator/calculate";

describe("earnings estimator calculation", () => {
  it("treats empty or incomplete input as neutral", () => {
    expect(buildEarningsEstimatorReport({ views: "", lowRpm: "", highRpm: "" })).toMatchObject({
      status: "empty",
      estimate: null,
      errors: [],
    });
    expect(buildEarningsEstimatorReport({ views: "1000", lowRpm: "1", highRpm: "" }).status).toBe("empty");
  });

  it("calculates 1,000 views x 1 RPM = 1", () => {
    const report = buildEarningsEstimatorReport({ views: "1000", lowRpm: "1", highRpm: "1" });

    expect(report.status).toBe("ready");
    expect(report.estimate?.lowEstimate).toBe(1);
    expect(report.estimate?.highEstimate).toBe(1);
    expect(report.estimate?.isSingleEstimate).toBe(true);
    expect(formatEstimateAmount(report.estimate!.lowEstimate)).toBe("1.00");
  });

  it("calculates 100,000 x 1-2 RPM = 100-200", () => {
    const report = buildEarningsEstimatorReport({ views: "100000", lowRpm: "1", highRpm: "2" });

    expect(report.status).toBe("ready");
    expect(report.estimate?.lowEstimate).toBe(100);
    expect(report.estimate?.highEstimate).toBe(200);
    expect(report.estimate?.isSingleEstimate).toBe(false);
  });

  it("supports decimal RPM, comma-formatted views, zero views, and zero RPM", () => {
    expect(buildEarningsEstimatorReport({ views: "1,500", lowRpm: "0.50", highRpm: "1.25" }).estimate).toMatchObject({
      views: 1500,
      lowEstimate: 0.75,
      highEstimate: 1.875,
    });
    expect(buildEarningsEstimatorReport({ views: "0", lowRpm: "1", highRpm: "2" }).estimate).toMatchObject({
      lowEstimate: 0,
      highEstimate: 0,
    });
    expect(buildEarningsEstimatorReport({ views: "1000", lowRpm: "0", highRpm: "0" }).estimate).toMatchObject({
      lowEstimate: 0,
      highEstimate: 0,
      isSingleEstimate: true,
    });
  });

  it("rejects invalid, negative, fractional, ordered, malformed, and unsafe inputs", () => {
    expect(buildEarningsEstimatorReport({ views: "-1", lowRpm: "1", highRpm: "2" }).status).toBe("error");
    expect(buildEarningsEstimatorReport({ views: "1.5", lowRpm: "1", highRpm: "2" }).status).toBe("error");
    expect(buildEarningsEstimatorReport({ views: "1000", lowRpm: "-1", highRpm: "2" }).status).toBe("error");
    expect(buildEarningsEstimatorReport({ views: "1000", lowRpm: "two", highRpm: "2" }).status).toBe("error");
    expect(buildEarningsEstimatorReport({ views: "1000", lowRpm: "3", highRpm: "2" }).status).toBe("error");
    expect(buildEarningsEstimatorReport({ views: "1,00", lowRpm: "1", highRpm: "2" }).status).toBe("error");
    expect(
      buildEarningsEstimatorReport({ views: String(Number.MAX_SAFE_INTEGER), lowRpm: "1000000000", highRpm: "1000000000" })
        .status,
    ).toBe("error");
  });

  it("builds exact copy output", () => {
    const report = buildEarningsEstimatorReport({ views: "100000", lowRpm: "1.00", highRpm: "2.00" });

    expect(buildEstimateCopyText(report.estimate!)).toBe(
      [
        "YouTube Earnings Estimator",
        "Views/engaged views: 100,000",
        "Low RPM: 1.00",
        "High RPM: 2.00",
        "Formula: views / 1,000 x RPM",
        "Estimated revenue range: 100.00 to 200.00",
        "Currency: same currency as the RPM values entered; no conversion.",
        "Estimate only, not guaranteed earnings.",
      ].join("\n"),
    );
  });
});
