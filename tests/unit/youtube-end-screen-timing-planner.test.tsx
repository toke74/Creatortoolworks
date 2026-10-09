import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YoutubeEndScreenTimingPlanner } from "@/components/tool/youtube-end-screen-timing-planner";

describe("YoutubeEndScreenTimingPlanner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty neutral state", () => {
    render(<YoutubeEndScreenTimingPlanner toolId="youtube_end_screen_timing_planner" />);

    expect(screen.getByText(/enter a video duration and end screen length/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy timing/i })).not.toBeInTheDocument();
  });

  it("shows ready calculations for supported durations", () => {
    render(<YoutubeEndScreenTimingPlanner toolId="youtube_end_screen_timing_planner" />);

    fireEvent.change(screen.getByLabelText(/^Video duration$/), { target: { value: "12:35" } });
    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "15" } });

    expect(screen.getByText("End screen timing ready")).toBeInTheDocument();
    expect(screen.getByText("12:20")).toBeInTheDocument();
    expect(screen.getAllByText("12:35")).toHaveLength(2);
    expect(screen.getByText("15 seconds")).toBeInTheDocument();
  });

  it("shows precise validation errors", () => {
    render(<YoutubeEndScreenTimingPlanner toolId="youtube_end_screen_timing_planner" />);

    fireEvent.change(screen.getByLabelText(/^Video duration$/), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "5" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/video must be at least 25 seconds/i);

    fireEvent.change(screen.getByLabelText(/^Video duration$/), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "21" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/no more than 20 seconds/i);

    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "4" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 5 seconds/i);

    fireEvent.change(screen.getByLabelText(/^Video duration$/), { target: { value: "nope" } });
    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "5" } });
    expect(screen.getByRole("alert")).toHaveTextContent(/valid timestamp/i);
  });

  it("loads an illustrative example and clears back to neutral", () => {
    render(<YoutubeEndScreenTimingPlanner toolId="youtube_end_screen_timing_planner" />);

    fireEvent.click(screen.getByRole("button", { name: /load example/i }));
    expect(screen.getByDisplayValue("12:35")).toBeInTheDocument();
    expect(screen.getByDisplayValue("15")).toBeInTheDocument();
    expect(screen.getByText("12:20")).toBeInTheDocument();
    expect(screen.getByText(/not a recommendation, performance claim, or optimization target/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(screen.getByLabelText(/^Video duration$/)).toHaveValue("");
    expect(screen.getByLabelText(/End screen length/)).toHaveValue(null);
    expect(screen.getByText(/enter a video duration and end screen length/i)).toBeInTheDocument();
  });

  it("copies the displayed timing block exactly", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<YoutubeEndScreenTimingPlanner toolId="youtube_end_screen_timing_planner" />);

    fireEvent.change(screen.getByLabelText(/^Video duration$/), { target: { value: "12:35" } });
    fireEvent.change(screen.getByLabelText(/End screen length/), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /copy timing/i }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        [
          "YouTube end screen timing",
          "Video duration: 12:35",
          "Start: 12:20",
          "End: 12:35",
          "End screen length: 15 seconds",
        ].join("\n"),
      ),
    );
    expect(screen.getByText(/copied to your clipboard/i)).toBeInTheDocument();
  });
});
