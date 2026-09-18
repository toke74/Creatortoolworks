import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeHashtagChecker } from "@/components/tool/youtube-hashtag-checker";

function getTextarea() {
  return screen.getByLabelText(/paste title, description, or hashtag text/i) as HTMLTextAreaElement;
}

function getStatValue(label: string) {
  const dt = screen.getByText(label);
  return dt.parentElement?.querySelector("dd")?.textContent;
}

describe("YoutubeHashtagChecker", () => {
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

  it("renders empty and no-hashtag states as neutral", () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);

    expect(getTextarea()).toHaveValue("");
    expect(screen.getByText(/paste text to extract hashtags/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy hashtags" })).not.toBeInTheDocument();

    fireEvent.change(getTextarea(), { target: { value: "plain title and description" } });
    expect(screen.getByText(/no hashtags found/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows one and several hashtags as ready", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "#CreatorTools" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Copy hashtags" })).toBeEnabled());
    expect(getStatValue("Total hashtags")).toBe("1");
    expect(getStatValue("Unique hashtags")).toBe("1");

    fireEvent.change(getTextarea(), { target: { value: "#CreatorTools #YouTubeTips #Shorts" } });
    expect(getStatValue("Total hashtags")).toBe("3");
    expect(screen.getByText(/3 of 60 hashtags found/i)).toBeInTheDocument();
  });

  it("enables copy at exactly 60 and disables it at 61, then restores immediately at 60", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);
    const sixty = Array.from({ length: 60 }, (_, index) => `#tag${index}`).join(" ");
    const sixtyOne = `${sixty} #tag60`;

    fireEvent.change(getTextarea(), { target: { value: sixty } });
    const copyButton = await screen.findByRole("button", { name: "Copy hashtags" });
    expect(copyButton).toBeEnabled();
    expect(getStatValue("Total hashtags")).toBe("60");

    fireEvent.change(getTextarea(), { target: { value: sixtyOne } });
    await waitFor(() => expect(copyButton).toBeDisabled());
    expect(screen.getAllByText(/if content has more than 60 hashtags/i).length).toBeGreaterThan(0);

    fireEvent.change(getTextarea(), { target: { value: sixty } });
    await waitFor(() => expect(copyButton).toBeEnabled());
    expect(screen.getByText(/60 of 60 hashtags found/i)).toBeInTheDocument();
  });

  it("counts duplicates and removes them with first occurrence order preserved", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);

    fireEvent.change(getTextarea(), { target: { value: "#B #A #B #A #a" } });
    expect(getStatValue("Duplicates")).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "Remove duplicate hashtags" }));
    await waitFor(() => expect(getTextarea()).toHaveValue("#B #A   #a"));
    expect(getStatValue("Total hashtags")).toBe("3");
    expect(getStatValue("Unique hashtags")).toBe("3");

    fireEvent.click(screen.getByRole("button", { name: "Remove duplicate hashtags" }));
    await waitFor(() => expect(screen.getByText(/nothing to change/i)).toBeInTheDocument());
    expect(getTextarea()).toHaveValue("#B #A   #a");
  });

  it("tests capitalization, Unicode, punctuation, and multiline descriptions", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);

    fireEvent.change(getTextarea(), {
      target: { value: "Title #Creator #creator\nDescription (#Cafe_2026), #東京. #Creator Tools" },
    });

    await waitFor(() => expect(getStatValue("Total hashtags")).toBe("5"));
    expect(getStatValue("Unique hashtags")).toBe("4");
    expect(screen.getByText("Extracted hashtag preview").nextElementSibling?.textContent).toBe(
      "#Creator\n#creator\n#Cafe_2026\n#東京\n#Creator",
    );
  });

  it("copies exactly the displayed extracted hashtag output", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);
    fireEvent.change(getTextarea(), { target: { value: "Intro #One, #Two #One" } });

    fireEvent.click(await screen.findByRole("button", { name: "Copy hashtags" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("#One\n#Two\n#One"));
    expect(await screen.findByRole("status")).toHaveTextContent(/copied/i);
  });

  it("loads the example and clears it", async () => {
    render(<YoutubeHashtagChecker toolId="youtube_hashtag_checker" />);

    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await waitFor(() => expect(getTextarea().value).toContain("Example only"));
    expect(getStatValue("Duplicates")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(getTextarea()).toHaveValue(""));
    expect(screen.getByText(/paste text to extract hashtags/i)).toBeInTheDocument();
  });
});
