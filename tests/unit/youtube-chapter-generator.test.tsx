import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeChapterGenerator } from "@/components/tool/youtube-chapter-generator";

function getRowInputs(index: number) {
  const rows = within(screen.getByTestId("chapter-rows")).getAllByRole("listitem");
  const row = rows[index];
  return {
    row,
    time: within(row).getByLabelText(new RegExp(`time for chapter ${index + 1}`, "i")),
    title: within(row).getByLabelText(new RegExp(`chapter title for chapter ${index + 1}`, "i")),
  };
}

function fillValidExampleMinusLast() {
  render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
  fireEvent.click(screen.getByRole("button", { name: "Load example" }));
}

describe("YoutubeChapterGenerator", () => {
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

  it("renders the default scaffold rows, blank so the empty state stays neutral", () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).time).toHaveValue("");
    expect(getRowInputs(0).title).toHaveValue("");
  });

  it("shows neutral guidance and no banner in the empty state", () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    expect(screen.getByText(/add a time and title for each chapter/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy chapters" })).not.toBeInTheDocument();
  });

  it("adds and removes a row", () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add chapter" }));
    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Remove chapter 4" }));
    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(3);
  });

  it("loads the example chapters", async () => {
    fillValidExampleMinusLast();
    await waitFor(() => expect(getRowInputs(0).title).toHaveValue("Introduction"));
    expect(getRowInputs(3).title).toHaveValue("Editing workflow");
    expect(getRowInputs(3).time).toHaveValue("08:10");
  });

  // Point 5/9B of the UX refinement: Load example should demonstrate a fully
  // verified Ready state out of the box, with every check passing — not leave
  // the final chapter unverified.
  it("Load example also populates a video duration, producing a fully verified Ready state with no warnings or unverified items", async () => {
    fillValidExampleMinusLast();

    await waitFor(() => expect(screen.getByLabelText(/video duration/i)).not.toHaveValue(""));
    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));

    expect(screen.queryByText(/not verified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bwarning\b/i)).not.toBeInTheDocument();
    expect(screen.getByText(/final chapter length: pass/i)).toBeInTheDocument();

    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeEnabled();
  });

  // Point A: default three blank rows + pasted list -> only the pasted rows
  // remain (the blank placeholders are dropped, not left above the paste).
  it("pastes a chapter list over the default blank rows: only pasted rows remain, no leading blanks", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), {
      target: { value: "0:00 Intro\n1:35 - Choosing your topic" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    await waitFor(() => expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(2));
    expect(getRowInputs(0).time).toHaveValue("0:00");
    expect(getRowInputs(0).title).toHaveValue("Intro");
    expect(getRowInputs(1).title).toHaveValue("Choosing your topic");
  });

  // Point B: real rows + one blank row + pasted list -> real rows preserved,
  // the blank row is removed, and pasted rows are appended after the real ones.
  it("pastes over existing real rows plus a blank row: real rows preserved, blank row removed, pasted rows appended after", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).time, { target: { value: "00:00" } });
    fireEvent.change(getRowInputs(0).title, { target: { value: "Intro" } });
    fireEvent.change(getRowInputs(1).time, { target: { value: "01:30" } });
    fireEvent.change(getRowInputs(1).title, { target: { value: "Topic" } });
    // Row 3 is left completely blank.

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), {
      target: { value: "03:00 Editing\n05:00 Export" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    await waitFor(() => expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(4));
    expect(getRowInputs(0).title).toHaveValue("Intro");
    expect(getRowInputs(1).title).toHaveValue("Topic");
    expect(getRowInputs(2).time).toHaveValue("03:00");
    expect(getRowInputs(2).title).toHaveValue("Editing");
    expect(getRowInputs(3).title).toHaveValue("Export");
  });

  // Point C: a partially filled existing row (time typed, no title yet) is not
  // "blank" and must survive a paste.
  it("preserves a partially filled row (time only, no title) when pasting", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).time, { target: { value: "01:20" } });

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), { target: { value: "02:00 Next" } });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    // Rows 2 and 3 were left completely blank, so only the partially filled
    // row 1 survives alongside the pasted row.
    await waitFor(() => expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(2));
    expect(getRowInputs(0).time).toHaveValue("01:20");
    expect(getRowInputs(0).title).toHaveValue("");
    expect(getRowInputs(1).time).toHaveValue("02:00");
    expect(getRowInputs(1).title).toHaveValue("Next");
  });

  // Point D: canceling the paste panel must never touch existing rows.
  it("Cancel on the paste panel leaves existing rows unchanged", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).time, { target: { value: "00:00" } });
    fireEvent.change(getRowInputs(0).title, { target: { value: "Intro" } });

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), { target: { value: "05:00 Should not be added" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).title).toHaveValue("Intro");
    expect(screen.queryByText(/should not be added/i)).not.toBeInTheDocument();
  });

  // Point E: an empty/whitespace-only paste must not erase existing rows.
  it("an empty/whitespace-only paste does not erase existing rows", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).time, { target: { value: "00:00" } });
    fireEvent.change(getRowInputs(0).title, { target: { value: "Intro" } });

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), { target: { value: "   \n  \n " } });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).time).toHaveValue("00:00");
    expect(getRowInputs(0).title).toHaveValue("Intro");
  });

  // Point 6 of the UX refinement: pasting a valid list with duration left blank
  // must read as Ready, not Warning.
  it("pasting a valid chapter list with duration left blank is Ready, not Warning", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);

    fireEvent.click(screen.getByRole("button", { name: "Paste chapter list" }));
    fireEvent.change(screen.getByLabelText(/paste chapters/i), {
      target: {
        value: "0:00 Intro\n1:35 - Choosing your topic\n4:20 - Recording the video",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add lines" }));

    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));
    expect(screen.queryByText(/\bwarning\b/i)).not.toBeInTheDocument();
    expect(screen.getByText(/known chapter intervals are at least 10 seconds: pass/i)).toBeInTheDocument();
    expect(screen.getByText(/final chapter length: not verified/i)).toBeInTheDocument();

    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeEnabled();
  });

  it("shows an error for an invalid timestamp on a row", async () => {
    fillValidExampleMinusLast();
    const { row, time } = getRowInputs(1);
    fireEvent.change(time, { target: { value: "1:75" } });

    await waitFor(() => expect(within(row).getByRole("alert")).toHaveTextContent(/1:75/));
  });

  it("errors when the first chapter is not 00:00", async () => {
    fillValidExampleMinusLast();
    const first = getRowInputs(0);
    fireEvent.change(first.time, { target: { value: "00:05" } });

    await waitFor(() =>
      expect(within(first.row).getByRole("alert")).toHaveTextContent(/must start at 00:00/i),
    );
    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeDisabled();
  });

  it("errors when a chapter is shorter than 10 seconds", async () => {
    fillValidExampleMinusLast();
    const second = getRowInputs(1);
    fireEvent.change(second.time, { target: { value: "00:05" } });

    await waitFor(() =>
      expect(within(getRowInputs(0).row).getByRole("alert")).toHaveTextContent(/at least 10 seconds/i),
    );
  });

  it("passes at exactly a 10 second chapter", async () => {
    fillValidExampleMinusLast();
    const second = getRowInputs(1);
    fireEvent.change(second.time, { target: { value: "00:10" } });

    await waitFor(() => expect(getRowInputs(1).time).toHaveValue("00:10"));
    expect(within(getRowInputs(0).row).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("requires a title once a timestamp is entered", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    const { row, time } = getRowInputs(0);
    fireEvent.change(time, { target: { value: "00:00" } });

    await waitFor(() => expect(within(row).getByRole("alert")).toHaveTextContent(/enter a chapter title/i));
  });

  it("errors on fewer than 3 chapters", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).title, { target: { value: "Intro" } });
    fireEvent.change(getRowInputs(1).time, { target: { value: "01:00" } });
    fireEvent.change(getRowInputs(1).title, { target: { value: "Two" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove chapter 3" }));

    await waitFor(() => expect(screen.getByText(/at least 3 chapters/i)).toBeInTheDocument());
    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeDisabled();
  });

  // Points 1, 2, 6, 9A of the UX refinement: a valid list with NO video duration
  // must read as Ready (not Warning), copy enabled, "known intervals" Pass, and
  // the final chapter shown as a neutral "Not verified" info item — never a
  // warning banner solely because the optional duration is blank.
  it("valid list with blank video duration is Ready, not Warning — final chapter shown as neutral info", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "" } });

    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));
    expect(screen.queryByText(/\bwarning\b/i)).not.toBeInTheDocument();

    expect(screen.getByText(/known chapter intervals are at least 10 seconds: pass/i)).toBeInTheDocument();
    expect(screen.getByText(/final chapter length: not verified/i)).toBeInTheDocument();
    expect(
      screen.getByText(/enter the optional video duration if you want to verify/i),
    ).toBeInTheDocument();

    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeEnabled();
  });

  // Point 9F: missing optional duration must never produce role="alert" anywhere.
  it("blank video duration never produces role=alert, and doesn't set aria-invalid on the duration field", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "" } });

    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.getByLabelText(/video duration/i)).not.toHaveAttribute("aria-invalid");
  });

  it("verifies the final chapter once a video duration is supplied", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "12:45" } });

    await waitFor(() => expect(screen.queryByText(/not verified/i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/final chapter length: pass/i)).toBeInTheDocument();
  });

  it("errors when the last timestamp is at or after the supplied video duration", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "08:10" } });

    await waitFor(() =>
      expect(within(getRowInputs(3).row).getByRole("alert")).toHaveTextContent(/at or after the video duration/i),
    );
    const copyButton = await screen.findByRole("button", { name: "Copy chapters" });
    expect(copyButton).toBeDisabled();
  });

  it("errors when the final chapter is under 10 seconds based on the supplied duration", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "08:19" } });

    await waitFor(() =>
      expect(within(getRowInputs(3).row).getByRole("alert")).toHaveTextContent(/at least 10 seconds/i),
    );
  });

  it("shows an error for an invalid video duration", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "abc" } });

    await waitFor(() => expect(screen.getByLabelText(/video duration/i)).toHaveAttribute("aria-invalid", "true"));
  });

  it("sorts rows by time on explicit action only", async () => {
    render(<YoutubeChapterGenerator toolId="youtube_chapter_generator" />);
    fireEvent.change(getRowInputs(0).time, { target: { value: "5:00" } });
    fireEvent.change(getRowInputs(0).title, { target: { value: "Later" } });
    fireEvent.change(getRowInputs(1).time, { target: { value: "1:00" } });
    fireEvent.change(getRowInputs(1).title, { target: { value: "Earlier" } });

    expect(getRowInputs(0).title).toHaveValue("Later");
    fireEvent.click(screen.getByRole("button", { name: "Sort by time" }));

    await waitFor(() => expect(getRowInputs(0).title).toHaveValue("Earlier"));
    expect(getRowInputs(1).title).toHaveValue("Later");
  });

  it("copies the exact formatted chapter block and shows accessible success feedback", async () => {
    fillValidExampleMinusLast();
    fireEvent.click(await screen.findByRole("button", { name: "Copy chapters" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "00:00 Introduction\n01:35 Choosing your topic\n04:20 Recording the video\n08:10 Editing workflow",
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("clears back to the default scaffold and clears the duration field", async () => {
    fillValidExampleMinusLast();
    fireEvent.change(screen.getByLabelText(/video duration/i), { target: { value: "12:45" } });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(within(screen.getByTestId("chapter-rows")).getAllByRole("listitem")).toHaveLength(3);
    expect(getRowInputs(0).time).toHaveValue("");
    expect(getRowInputs(0).title).toHaveValue("");
    expect(screen.getByLabelText(/video duration/i)).toHaveValue("");
  });
});
