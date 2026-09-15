import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeTitleChecker } from "@/components/tool/youtube-title-checker";

function getTextarea() {
  return screen.getByLabelText(/video title/i) as HTMLTextAreaElement;
}

function getStatValue(label: string) {
  const dt = screen.getByText(label);
  return dt.parentElement?.querySelector("dd")?.textContent;
}

describe("YoutubeTitleChecker", () => {
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

  it("renders empty as neutral, not an error or ready result", () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    expect(getTextarea()).toHaveValue("");
    expect(screen.getByText(/0 \/ 100 characters/)).toBeInTheDocument();
    expect(screen.getByText(/enter or paste a title/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy title" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getTextarea()).not.toHaveAttribute("aria-invalid");
  });

  it("allows titles at 99 and 100 characters", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "a".repeat(99) } });
    const copyButton = await screen.findByRole("button", { name: "Copy title" });
    await waitFor(() => expect(copyButton).toBeEnabled());
    expect(screen.getByText(/99 \/ 100 characters/)).toBeInTheDocument();
    expect(getStatValue("Remaining")).toBe("1");

    fireEvent.change(getTextarea(), { target: { value: "a".repeat(100) } });
    await waitFor(() => expect(copyButton).toBeEnabled());
    expect(screen.getByText(/100 \/ 100 characters/)).toBeInTheDocument();
    expect(getStatValue("Remaining")).toBe("0");
  });

  it("shows an error and disables copy at 101 characters, then re-enables copy once fixed", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "a".repeat(101) } });
    const copyButton = await screen.findByRole("button", { name: "Copy title" });
    await waitFor(() => expect(copyButton).toBeDisabled());
    expect(screen.getAllByText(/remove 1 character/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(getTextarea()).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(getTextarea(), { target: { value: "a".repeat(100) } });
    await waitFor(() => expect(copyButton).toBeEnabled());
    expect(getTextarea()).not.toHaveAttribute("aria-invalid");
  });

  it("counts emoji and Unicode consistently", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "A 😀 title 2026" } });

    await waitFor(() => expect(getStatValue("Characters")).toBe("14"));
    expect(getStatValue("Words")).toBe("4");
    expect(getStatValue("Capital letters")).toBe("1");
    expect(getStatValue("Digits")).toBe("4");
    expect(getStatValue("Emoji")).toBe("1");
  });

  it("copies the exact title text", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);
    const title = "Exact  title 😀";
    fireEvent.change(getTextarea(), { target: { value: title } });

    const copyButton = await screen.findByRole("button", { name: "Copy title" });
    fireEvent.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(title));
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("loads an example and clears it", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await waitFor(() => expect(getTextarea().value).toContain("YouTube Short"));

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(getTextarea()).toHaveValue(""));
  });

  it("normalizes repeated spaces only when explicitly requested and is idempotent", async () => {
    render(<YoutubeTitleChecker toolId="youtube_title_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "My   exact  title" } });
    expect(getTextarea()).toHaveValue("My   exact  title");

    fireEvent.click(screen.getByRole("button", { name: "Normalize repeated spaces" }));
    await waitFor(() => expect(getTextarea()).toHaveValue("My exact title"));

    fireEvent.click(screen.getByRole("button", { name: "Normalize repeated spaces" }));
    await waitFor(() => expect(screen.getByText(/nothing to change/i)).toBeInTheDocument());
    expect(getTextarea()).toHaveValue("My exact title");
  });
});
