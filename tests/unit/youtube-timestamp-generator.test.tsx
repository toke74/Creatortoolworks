import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeTimestampGenerator } from "@/components/tool/youtube-timestamp-generator";

function getRowInputs(index: number) {
  const rows = screen.getAllByRole("listitem");
  const row = rows[index];
  return {
    row,
    time: within(row).getByLabelText(new RegExp(`time for row ${index + 1}`, "i")),
    label: within(row).getByLabelText(new RegExp(`label for row ${index + 1}`, "i")),
  };
}

describe("YoutubeTimestampGenerator", () => {
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

  it("renders the default scaffold rows", () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).time).toHaveValue("00:00");
  });

  it("adds a new row", () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add timestamp" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("removes a row", () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    fireEvent.click(screen.getByRole("button", { name: "Remove row 3" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("edits a row's time and label", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { time, label } = getRowInputs(1);

    fireEvent.change(time, { target: { value: "1:35" } });
    fireEvent.change(label, { target: { value: "What you'll learn" } });

    await waitFor(() => expect(screen.getByText(/01:35 What you'll learn/)).toBeInTheDocument());
  });

  it("pastes a timestamp list and appends parsed rows", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);

    fireEvent.click(screen.getByRole("button", { name: "Paste timestamp list" }));
    fireEvent.change(screen.getByLabelText(/paste timestamps/i), {
      target: { value: "0:00 Intro\n1:35 - What you'll learn" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(5));
    expect(getRowInputs(3).time).toHaveValue("0:00");
    expect(getRowInputs(3).label).toHaveValue("Intro");
    expect(getRowInputs(4).label).toHaveValue("What you'll learn");
  });

  it("normalizes a raw timestamp in the preview output", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { label } = getRowInputs(0);
    fireEvent.change(label, { target: { value: "Introduction" } });

    await waitFor(() => expect(screen.getByText(/00:00 Introduction/)).toBeInTheDocument());
  });

  it("warns about a duplicate timestamp", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { time, label } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "0:00" } });
    fireEvent.change(label, { target: { value: "Also intro" } });

    await waitFor(() => expect(screen.getAllByText(/duplicate timestamp/i).length).toBeGreaterThan(0));
  });

  it("warns about out-of-order timestamps", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const first = getRowInputs(0);
    fireEvent.change(first.time, { target: { value: "5:00" } });

    const second = getRowInputs(1);
    fireEvent.change(second.time, { target: { value: "1:00" } });
    fireEvent.change(second.label, { target: { value: "Earlier" } });

    await waitFor(() => expect(screen.getByText(/out of order/i)).toBeInTheDocument());
  });

  it("sorts rows by time on explicit action", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const first = getRowInputs(0);
    fireEvent.change(first.time, { target: { value: "5:00" } });
    fireEvent.change(first.label, { target: { value: "Later" } });

    const second = getRowInputs(1);
    fireEvent.change(second.time, { target: { value: "1:00" } });
    fireEvent.change(second.label, { target: { value: "Earlier" } });

    fireEvent.click(screen.getByRole("button", { name: "Sort by time" }));

    await waitFor(() => expect(getRowInputs(0).label).toHaveValue("Earlier"));
    expect(getRowInputs(1).label).toHaveValue("Later");
  });

  it("shows an error for an invalid timestamp and does not preview a partial result", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { row, time, label } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "1:75" } });
    fireEvent.change(label, { target: { value: "Broken" } });

    await waitFor(() => expect(within(row).getByRole("alert")).toHaveTextContent(/1:75/));
    expect(screen.queryByText(/Broken/)).not.toBeInTheDocument();
  });

  it("disables Copy timestamps while any row has an invalid timestamp, and tells the user to fix it", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { time, label } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "1:75" } });
    fireEvent.change(label, { target: { value: "Broken" } });

    const copyButton = await screen.findByRole("button", { name: "Copy timestamps" });
    await waitFor(() => expect(copyButton).toBeDisabled());
    expect(screen.getByText(/fix the invalid timestamp/i)).toBeInTheDocument();

    fireEvent.click(copyButton);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("re-enables Copy timestamps once the invalid timestamp is corrected", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { time } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "1:75" } });

    const copyButton = await screen.findByRole("button", { name: "Copy timestamps" });
    await waitFor(() => expect(copyButton).toBeDisabled());

    fireEvent.change(time, { target: { value: "1:05" } });
    await waitFor(() => expect(copyButton).toBeEnabled());
    expect(screen.queryByText(/fix the invalid timestamp/i)).not.toBeInTheDocument();
  });

  it("still allows copying when rows only have warnings (e.g. a duplicate timestamp)", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { time, label } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "0:00" } });
    fireEvent.change(label, { target: { value: "Also intro" } });

    await waitFor(() => expect(screen.getAllByText(/duplicate timestamp/i).length).toBeGreaterThan(0));
    const copyButton = await screen.findByRole("button", { name: "Copy timestamps" });
    expect(copyButton).toBeEnabled();
    expect(screen.queryByText(/fix the invalid timestamp/i)).not.toBeInTheDocument();

    fireEvent.click(copyButton);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });

  it("copies the formatted output and shows accessible success feedback", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    const { label } = getRowInputs(0);
    fireEvent.change(label, { target: { value: "Introduction" } });

    fireEvent.click(await screen.findByRole("button", { name: "Copy timestamps" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("00:00 Introduction"));
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("resets back to the default scaffold on Clear all", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add timestamp" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).time).toHaveValue("00:00");
    expect(getRowInputs(0).label).toHaveValue("");
  });

  it("loads the example timestamps", async () => {
    render(<YoutubeTimestampGenerator toolId="youtube_timestamp_generator" />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));

    await waitFor(() => expect(getRowInputs(0).label).toHaveValue("Introduction"));
    expect(getRowInputs(3).label).toHaveValue("Final tips");
  });
});
