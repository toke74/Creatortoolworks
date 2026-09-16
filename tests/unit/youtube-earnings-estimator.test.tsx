import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeEarningsEstimator } from "@/components/tool/youtube-earnings-estimator";

function getViewsInput() {
  return screen.getByLabelText(/views \/ engaged views/i) as HTMLInputElement;
}

function getLowRpmInput() {
  return screen.getByLabelText(/^low rpm$/i) as HTMLInputElement;
}

function getHighRpmInput() {
  return screen.getByLabelText(/^high rpm$/i) as HTMLInputElement;
}

describe("YoutubeEarningsEstimator", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an empty neutral state", () => {
    render(<YoutubeEarningsEstimator toolId="youtube_earnings_estimator" />);

    expect(getViewsInput()).toHaveValue("");
    expect(screen.getByText(/incomplete fields are neutral/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy estimate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calculates a valid range and copies exact output", async () => {
    render(<YoutubeEarningsEstimator toolId="youtube_earnings_estimator" />);

    fireEvent.change(getViewsInput(), { target: { value: "100000" } });
    fireEvent.change(getLowRpmInput(), { target: { value: "1.00" } });
    fireEvent.change(getHighRpmInput(), { target: { value: "2.00" } });

    expect(await screen.findByText("100.00 to 200.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy estimate" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
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
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("shows a single estimate when low and high RPM match", async () => {
    render(<YoutubeEarningsEstimator toolId="youtube_earnings_estimator" />);

    fireEvent.change(getViewsInput(), { target: { value: "1000" } });
    fireEvent.change(getLowRpmInput(), { target: { value: "1" } });
    fireEvent.change(getHighRpmInput(), { target: { value: "1" } });

    expect(await screen.findByText(/estimated revenue amount/i)).toBeInTheDocument();
    expect(screen.getAllByText("1.00").length).toBeGreaterThan(0);
  });

  it("rejects high RPM below low RPM", async () => {
    render(<YoutubeEarningsEstimator toolId="youtube_earnings_estimator" />);

    fireEvent.change(getViewsInput(), { target: { value: "1000" } });
    fireEvent.change(getLowRpmInput(), { target: { value: "3" } });
    fireEvent.change(getHighRpmInput(), { target: { value: "2" } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/high rpm must be greater than or equal/i);
    expect(screen.queryByRole("button", { name: "Copy estimate" })).not.toBeInTheDocument();
  });

  it("loads an illustrative example and clears it", async () => {
    render(<YoutubeEarningsEstimator toolId="youtube_earnings_estimator" />);

    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await waitFor(() => expect(getViewsInput()).toHaveValue("100000"));
    expect(getLowRpmInput()).toHaveValue("1.00");
    expect(getHighRpmInput()).toHaveValue("2.00");
    expect(screen.getByText(/not average, typical, recommended, or official/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(getViewsInput()).toHaveValue(""));
    expect(getLowRpmInput()).toHaveValue("");
    expect(getHighRpmInput()).toHaveValue("");
  });
});
