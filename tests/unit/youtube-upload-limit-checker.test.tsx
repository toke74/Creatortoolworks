import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { YoutubeUploadLimitChecker } from "@/components/tool/youtube-upload-limit-checker";

type MockVideoOptions = {
  shouldFail: boolean;
  duration: number;
};

const mockVideoOptions: MockVideoOptions = {
  shouldFail: false,
  duration: 59,
};

function createVideoFile(name = "upload.mp4", sizeBytes = 2048, type = "video/mp4"): File {
  const file = new File([new Uint8Array(Math.min(sizeBytes, 2048))], name, { type });
  Object.defineProperty(file, "size", { configurable: true, value: sizeBytes });
  return file;
}

describe("YoutubeUploadLimitChecker", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    mockVideoOptions.shouldFail = false;
    mockVideoOptions.duration = 59;

    createObjectURL = vi.fn(() => `blob:video-${Math.random()}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName !== "video") return originalCreateElement(tagName);

      const video = originalCreateElement("video") as HTMLVideoElement;
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
    render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);

    expect(screen.getByText(/choose a video file to check its local file size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose or replace video/i)).toBeInTheDocument();
  });

  it("reads browser metadata and shows a ready result for a small normal file", async () => {
    render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);

    fireEvent.change(screen.getByLabelText(/choose or replace video/i), {
      target: { files: [createVideoFile("ready.mp4", 825_000_000)] },
    });

    await waitFor(() => expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument());
    expect(screen.getByText("ready.mp4")).toBeInTheDocument();
    expect(screen.getByText("825 MB")).toBeInTheDocument();
    expect(screen.getByText("0:59")).toBeInTheDocument();
    expect(screen.getAllByText(/video\/mp4/i)).toHaveLength(2);
    expect(createObjectURL).toHaveBeenCalled();
  });

  it("uses manual fallback when metadata cannot be read", async () => {
    mockVideoOptions.shouldFail = true;
    render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);

    fireEvent.change(screen.getByLabelText(/choose or replace video/i), {
      target: { files: [createVideoFile("unreadable.mp4")] },
    });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/metadata could not be read/i));

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "2.5" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "1440" } });

    expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument();
    expect(screen.getByText("2.5 GB")).toBeInTheDocument();
    expect(screen.getByText("24:00")).toBeInTheDocument();
    expect(screen.getByText(/Account verification required for longer uploads/i)).toBeInTheDocument();
  });

  it("shows manual errors for oversized, over-duration, zero, and negative values", () => {
    render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "256" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "43200" } });
    expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "256.001" } });
    expect(screen.getByText(/upload limit issue/i)).toBeInTheDocument();
    expect(screen.getByText(/larger than YouTube's published 256 GB/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "43200.001" } });
    expect(screen.getByText(/longer than YouTube's published 12-hour/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "0" } });
    expect(screen.getByText(/File size must be greater than zero/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "-1" } });
    expect(screen.getByText(/File size must be greater than zero/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^File size in GB$/), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "0" } });
    expect(screen.getByText(/Duration must be greater than zero/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Duration seconds$/), { target: { value: "-1" } });
    expect(screen.getByText(/Duration must be greater than zero/i)).toBeInTheDocument();
  });

  it("loads illustrative example metadata and clears state", () => {
    render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);

    fireEvent.click(screen.getByRole("button", { name: /load example metadata/i }));
    expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument();
    expect(screen.getByText("24:00")).toBeInTheDocument();
    expect(screen.getByText(/illustrative only/i)).toBeInTheDocument();
    expect(screen.getByText(/Account verification required for longer uploads/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(screen.getByText(/choose a video file to check its local file size/i)).toBeInTheDocument();
  });

  it("revokes object URLs when replacing, clearing, and unmounting", async () => {
    const { unmount } = render(<YoutubeUploadLimitChecker toolId="youtube_upload_limit_checker" />);
    const input = screen.getByLabelText(/choose or replace video/i);

    fireEvent.change(input, { target: { files: [createVideoFile("first.mp4")] } });
    await waitFor(() => expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument());

    fireEvent.change(input, { target: { files: [createVideoFile("second.mp4")] } });
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /^Clear$/ }));
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);

    fireEvent.change(input, { target: { files: [createVideoFile("third.mp4")] } });
    await waitFor(() => expect(screen.getByText(/within published upload limits/i)).toBeInTheDocument());
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);
  });
});
