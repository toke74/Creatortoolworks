import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeThumbnailTitlePreviewer } from "@/components/tool/youtube-thumbnail-title-previewer";
import { exampleChannel, exampleTitle, getPreviewReport, previewLayouts } from "@/lib/tools/thumbnail-title-previewer/preview";

const images: MockImage[] = [];
let autoDecode = true;
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 960;
  naturalHeight = 540;
  constructor() { images.push(this); }
  set src(_value: string) { if (autoDecode) queueMicrotask(() => this.onload?.()); }
}

const revoke = vi.fn();
let nextUrl = 0;
function choose(name = "local.png", type = "image/png") {
  fireEvent.change(screen.getByLabelText(/choose thumbnail|replace thumbnail/i), {
    target: { files: [new File(["fixture bytes"], name, { type })] },
  });
}
async function chooseAndWait() {
  choose();
  await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(5));
}

beforeEach(() => {
  images.length = 0;
  nextUrl = 0;
  autoDecode = true;
  revoke.mockClear();
  vi.stubGlobal("Image", MockImage);
  vi.stubGlobal("URL", { createObjectURL: vi.fn(() => `blob:local-${++nextUrl}`), revokeObjectURL: revoke });
});
afterEach(() => vi.unstubAllGlobals());

describe("preview state", () => {
  it.each([
    ["", false, "neutral"], ["", true, "neutral"], ["A", false, "neutral"],
    ["A", true, "ready"], ["A".repeat(100), true, "ready"],
    ["A".repeat(101), true, "error"], ["🎬".repeat(100), true, "ready"],
  ])("uses title/image boundaries (%s, %s)", (title, image, status) => {
    expect(getPreviewReport(title, image).status).toBe(status);
  });
  it("reports an image error even with an empty title", () => {
    expect(getPreviewReport("", false, "cannot decode").status).toBe("error");
  });
});

describe("thumbnail/title workspace", () => {
  it("starts neutral with five labeled simulations and no errors", () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Neutral");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    for (const layout of previewLayouts) expect(screen.getByRole("heading", { name: layout.label })).toBeInTheDocument();
    expect(screen.getAllByText("Approximate preview")).toHaveLength(5);
  });

  it("shows dimensions and all images; preserves exact title including whitespace and markup", async () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    await chooseAndWait();
    expect(screen.getByText(/960 × 540px/)).toBeInTheDocument();
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Neutral");
    const title = "  My <b>title</b> 🎬  ";
    fireEvent.change(screen.getByLabelText("Video title"), { target: { value: title } });
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Ready");
    screen.getAllByTestId("card-title").forEach((card) => {
      expect(card.textContent).toBe(title);
      expect(card.querySelector("b")).toBeNull();
    });
    fireEvent.change(screen.getByLabelText("Video title"), { target: { value: "a".repeat(100) } });
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Ready");
    fireEvent.change(screen.getByLabelText("Video title"), { target: { value: "a".repeat(101) } });
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Error");
    expect(screen.getByLabelText("Video title")).toHaveAttribute("aria-invalid", "true");
    screen.getAllByTestId("card-title").forEach((card) => expect(card.textContent).toHaveLength(101));
  });

  it("replaces every preview and revokes the previous URL", async () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    await chooseAndWait();
    choose("second.jpg", "image/jpeg");
    await waitFor(() => screen.getByText(/second.jpg ·/));
    expect(revoke).toHaveBeenCalledWith("blob:local-1");
    screen.getAllByRole("img").forEach((image) => expect(image).toHaveAttribute("src", "blob:local-2"));
  });

  it("clears all inputs and appearance, releasing the URL", async () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(5));
    expect(screen.getByLabelText("Video title")).toHaveValue(exampleTitle);
    expect(screen.getByLabelText("Channel name (optional)")).toHaveValue(exampleChannel);
    fireEvent.click(screen.getByLabelText("Dark"));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(revoke).toHaveBeenCalledWith("blob:local-1");
    expect(screen.getByLabelText("Video title")).toHaveValue("");
    expect(screen.getByLabelText("Channel name (optional)")).toHaveValue("");
    expect(screen.getByLabelText("Light")).toBeChecked();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("preview-status")).toHaveTextContent("Neutral");
  });

  it("changes only the preview appearance", () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    const globalTheme = document.documentElement.outerHTML.split("<body>")[0];
    fireEvent.click(screen.getByLabelText("Dark"));
    expect(screen.getByTestId("preview-layouts")).toHaveAttribute("data-appearance", "dark");
    expect(document.documentElement.outerHTML.split("<body>")[0]).toBe(globalTheme);
    fireEvent.click(screen.getByLabelText("Light"));
    expect(screen.getByTestId("preview-layouts")).toHaveAttribute("data-appearance", "light");
  });

  it("rejects non-images and cleans up a failed decode", async () => {
    render(<YoutubeThumbnailTitlePreviewer />);
    choose("data.txt", "text/plain");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a readable image");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    autoDecode = false;
    choose();
    act(() => images[0].onerror?.());
    expect(screen.getByRole("alert")).toHaveTextContent("could not be opened");
    expect(revoke).toHaveBeenCalledWith("blob:local-1");
  });

  it("accepts a non-16:9 image and explains the simulated crop", async () => {
    autoDecode = false;
    render(<YoutubeThumbnailTitlePreviewer />);
    choose();
    images[0].naturalWidth = 540;
    act(() => images[0].onload?.());
    expect(screen.getByText(/source image is not 16:9/)).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(5);
  });

  it("releases loaded URLs on unmount", async () => {
    const { unmount } = render(<YoutubeThumbnailTitlePreviewer />);
    await chooseAndWait();
    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:local-1");
    expect(images[0].onload).toBeNull();
  });

  it.each(["clear", "replace", "unmount"])("cancels pending decoding on %s", (action) => {
    autoDecode = false;
    const { unmount } = render(<YoutubeThumbnailTitlePreviewer />);
    choose();
    const staleCallback = images[0].onload;
    if (action === "clear") fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    if (action === "replace") choose("replacement.png");
    if (action === "unmount") unmount();
    expect(revoke).toHaveBeenCalledWith("blob:local-1");
    expect(images[0].onload).toBeNull();
    act(() => staleCallback?.());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    if (action === "replace") {
      act(() => images[1].onload?.());
      expect(screen.getAllByRole("img")).toHaveLength(5);
    }
  });
});
