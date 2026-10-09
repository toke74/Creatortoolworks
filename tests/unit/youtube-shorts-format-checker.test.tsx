import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeShortsFormatChecker } from "@/components/tool/youtube-shorts-format-checker";

type MockVideoOptions = {
  shouldFail: boolean;
  width: number;
  height: number;
  duration: number;
};

const mockVideoOptions: MockVideoOptions = {
  shouldFail: false,
  width: 1080,
  height: 1920,
  duration: 59,
};

function createVideoFile(name = "short.mp4", sizeBytes = 2048): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: "video/mp4" });
}

describe("YoutubeShortsFormatChecker", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    mockVideoOptions.shouldFail = false;
    mockVideoOptions.width = 1080;
    mockVideoOptions.height = 1920;
    mockVideoOptions.duration = 59;

    createObjectURL = vi.fn(() => `blob:video-${Math.random()}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName !== "video") return originalCreateElement(tagName);

      const video = originalCreateElement("video") as HTMLVideoElement;
      Object.defineProperty(video, "videoWidth", { configurable: true, value: mockVideoOptions.width });
      Object.defineProperty(video, "videoHeight", { configurable: true, value: mockVideoOptions.height });
      Object.defineProperty(video, "duration", { configurable: true, value: mockVideoOptions.duration });
      Object.defineProperty(video, "src", {
        configurable: true,
        set() {
          queueMicrotask(() => {
            if (mockVideoOptions.shouldFail) {
              video.onerror?.(new Event("error"));
            } else {
              video.onloadedmetadata?.(new Event("loadedmetadata"));
            }
          });
        },
      });
      return video;
    }) as typeof document.createElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the empty neutral state", () => {
    render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);

    expect(screen.getByText(/choose a video file to check duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose or replace video/i)).toBeInTheDocument();
  });

  it("reads browser metadata and shows a ready result for vertical video", async () => {
    render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);

    fireEvent.change(screen.getByLabelText(/choose or replace video/i), {
      target: { files: [createVideoFile()] },
    });

    await waitFor(() => expect(screen.getByText(/ready for shorts format/i)).toBeInTheDocument());
    expect(screen.getByText("Vertical")).toBeInTheDocument();
    expect(screen.getByText("0:59")).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("uses manual fallback when metadata cannot be read", async () => {
    mockVideoOptions.shouldFail = true;
    render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);

    fireEvent.change(screen.getByLabelText(/choose or replace video/i), {
      target: { files: [createVideoFile("unreadable.mp4")] },
    });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/metadata could not be read/i));

    fireEvent.change(screen.getByLabelText(/^Width$/), { target: { value: "1080" } });
    fireEvent.change(screen.getByLabelText(/^Height$/), { target: { value: "1920" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "150" } });

    expect(screen.getByText(/ready for shorts format/i)).toBeInTheDocument();
    expect(screen.getByText("2:30")).toBeInTheDocument();
  });

  it("shows errors for horizontal and invalid manual metadata", () => {
    render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);

    fireEvent.change(screen.getByLabelText(/^Width$/), { target: { value: "1920" } });
    expect(screen.queryByText(/shorts format issue/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Height$/), { target: { value: "1080" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "120" } });

    expect(screen.getByText(/shorts format issue/i)).toBeInTheDocument();
    expect(screen.getByText("Horizontal")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Width$/), { target: { value: "-1" } });
    expect(screen.getByText(/width and height must both be greater than zero/i)).toBeInTheDocument();
  });

  it("loads illustrative example metadata and clears state", () => {
    render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);

    fireEvent.click(screen.getByRole("button", { name: /load example metadata/i }));
    expect(screen.getByText(/ready for shorts format/i)).toBeInTheDocument();
    expect(screen.getByText(/illustrative only/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(screen.getByText(/choose a video file to check duration/i)).toBeInTheDocument();
  });

  it("revokes object URLs when replacing, clearing, and unmounting", async () => {
    const { unmount } = render(<YoutubeShortsFormatChecker toolId="youtube_shorts_format_checker" />);
    const input = screen.getByLabelText(/choose or replace video/i);

    fireEvent.change(input, { target: { files: [createVideoFile("first.mp4")] } });
    await waitFor(() => expect(screen.getByText(/ready for shorts format/i)).toBeInTheDocument());

    fireEvent.change(input, { target: { files: [createVideoFile("second.mp4")] } });
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);

    fireEvent.change(input, { target: { files: [createVideoFile("third.mp4")] } });
    await waitFor(() => expect(screen.getByText(/ready for shorts format/i)).toBeInTheDocument());
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
  });
});
