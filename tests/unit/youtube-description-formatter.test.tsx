import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeDescriptionFormatter } from "@/components/tool/youtube-description-formatter";

function getTextarea() {
  return screen.getByLabelText(/video description/i) as HTMLTextAreaElement;
}

function getStatValue(label: string) {
  const dt = screen.getByText(label);
  return dt.parentElement?.querySelector("dd")?.textContent;
}

describe("YoutubeDescriptionFormatter", () => {
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

  it("renders empty by default", () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    expect(getTextarea()).toHaveValue("");
    expect(screen.getByText(/0 \/ 5,000 characters/)).toBeInTheDocument();
  });

  it("treats an empty description as a neutral incomplete state, not an error", () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);

    // Neutral guidance is shown instead of a pass/fail banner or a Copy button.
    expect(screen.getByText(/enter or paste a description/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy description" })).not.toBeInTheDocument();

    // Nothing is flagged as invalid: no alert role, no aria-invalid, no error styling.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getTextarea()).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(/remove \d+ character/i)).not.toBeInTheDocument();
  });

  it("treats a short (1-character) description as valid/Ready, not an error", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "a" } });

    await waitFor(() => expect(screen.getAllByText(/ready to copy/i).length).toBeGreaterThan(0));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getTextarea()).not.toHaveAttribute("aria-invalid");
    const copyButton = screen.getByRole("button", { name: "Copy description" });
    expect(copyButton).toBeEnabled();
  });

  it("updates the character count as the user types", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "Hello world" } });
    await waitFor(() => expect(screen.getByText(/11 \/ 5,000 characters/)).toBeInTheDocument());
  });

  it("shows word, line, link, and hashtag counts", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), {
      target: { value: "Watch here https://example.com\n#shorts #editing" },
    });

    await waitFor(() => expect(getStatValue("Words")).toBe("5"));
    expect(getStatValue("Lines")).toBe("2");
    expect(getStatValue("Links")).toBe("1");
    expect(getStatValue("Hashtags")).toBe("2");
  });

  it("shows an error and disables copy when over the 5,000-character limit", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "a".repeat(5001) } });

    const copyButton = await screen.findByRole("button", { name: "Copy description" });
    await waitFor(() => expect(copyButton).toBeDisabled());
    expect(screen.getAllByText(/remove 1 character to enable copying/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("re-enables copy once the description is back at or under the limit", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "a".repeat(5001) } });

    const copyButton = await screen.findByRole("button", { name: "Copy description" });
    await waitFor(() => expect(copyButton).toBeDisabled());

    fireEvent.change(getTextarea(), { target: { value: "a".repeat(5000) } });
    await waitFor(() => expect(copyButton).toBeEnabled());
  });

  it("allows copying at exactly 5,000 characters and copies the exact text", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    const text = "a".repeat(5000);
    fireEvent.change(getTextarea(), { target: { value: text } });

    const copyButton = await screen.findByRole("button", { name: "Copy description" });
    await waitFor(() => expect(copyButton).toBeEnabled());

    fireEvent.click(copyButton);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(text));
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("loads the example description", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await waitFor(() => expect(getTextarea().value).toContain("Learn how to edit vertical video"));
  });

  it("clears the description on Clear", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "Some text" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(getTextarea()).toHaveValue(""));
  });

  it("trims trailing whitespace without changing wording", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "hello   \nworld  " } });
    fireEvent.click(screen.getByRole("button", { name: "Trim trailing whitespace" }));

    await waitFor(() => expect(getTextarea()).toHaveValue("hello\nworld"));
    expect(screen.getByText(/removed 5 characters/i)).toBeInTheDocument();
  });

  it("normalizes excessive blank lines", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "a\n\n\n\nb" } });
    fireEvent.click(screen.getByRole("button", { name: "Normalize excessive blank lines" }));

    await waitFor(() => expect(getTextarea()).toHaveValue("a\n\nb"));
  });

  it("trims leading and trailing blank lines", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "\n\nhello\n\n" } });
    fireEvent.click(screen.getByRole("button", { name: "Trim leading/trailing blank lines" }));

    await waitFor(() => expect(getTextarea()).toHaveValue("hello"));
  });

  it("applying safe cleanup twice in a row is idempotent (second run reports no changes)", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), { target: { value: "\n\nhello   \n\n\n\nworld  \n\n" } });

    fireEvent.click(screen.getByRole("button", { name: "Apply all safe cleanup" }));
    await waitFor(() => expect(getTextarea()).toHaveValue("hello\n\nworld"));

    fireEvent.click(screen.getByRole("button", { name: "Apply all safe cleanup" }));
    await waitFor(() => expect(screen.getByText(/nothing to change/i)).toBeInTheDocument());
    expect(getTextarea()).toHaveValue("hello\n\nworld");
  });

  it("never rewrites links or hashtags during cleanup", async () => {
    render(<YoutubeDescriptionFormatter toolId="youtube_description_formatter" />);
    fireEvent.change(getTextarea(), {
      target: { value: "  Check this: https://example.com/video   \n\n\n#shorts #editing  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply all safe cleanup" }));

    await waitFor(() => expect(getTextarea().value).toContain("https://example.com/video"));
    expect(getTextarea().value).toContain("#shorts #editing");
  });
});
