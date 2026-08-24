import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThumbnailSizeChecker } from "@/components/tool/thumbnail-size-checker";

type MockImageOptions = {
  shouldFail: boolean;
  width: number;
  height: number;
};

const mockImageOptions: MockImageOptions = {
  shouldFail: false,
  width: 1920,
  height: 1080,
};

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  private _src = "";

  set src(value: string) {
    this._src = value;
    queueMicrotask(() => {
      if (mockImageOptions.shouldFail) {
        this.onerror?.();
        return;
      }
      this.naturalWidth = mockImageOptions.width;
      this.naturalHeight = mockImageOptions.height;
      this.onload?.();
    });
  }

  get src() {
    return this._src;
  }
}

function createFile(name: string, type: string, sizeBytes = 1024): File {
  const file = new File([new Uint8Array(sizeBytes)], name, { type });
  return file;
}

describe("ThumbnailSizeChecker", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockImageOptions.shouldFail = false;
    mockImageOptions.width = 1920;
    mockImageOptions.height = 1080;

    vi.stubGlobal("Image", MockImage);

    createObjectURL = vi.fn(() => `blob:mock-${Math.random()}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the empty state with an accessible file input", () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    expect(screen.getByText(/select an image to see/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/drop an image here or choose a file/i)).toBeInTheDocument();
  });

  it("analyzes a valid landscape image and shows results", async () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    const file = createFile("thumb.jpg", "image/jpeg", 500 * 1024);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/1920 × 1080px/)).toBeInTheDocument());

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByText("16:9")).toBeInTheDocument();
  });

  it("shows an error state for a non-image file without crashing", async () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    const file = createFile("notes.txt", "text/plain");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/doesn't look like an image/i));
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("shows an error state for a corrupt/unreadable image and revokes the object URL", async () => {
    mockImageOptions.shouldFail = true;
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    const file = createFile("corrupt.jpg", "image/jpeg");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't be opened/i));
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("resets back to the empty state and revokes the preview URL", async () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    fireEvent.change(input, { target: { files: [createFile("thumb.jpg", "image/jpeg")] } });

    await waitFor(() => expect(screen.getByText(/1920 × 1080px/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /check another thumbnail/i }));

    expect(screen.getByText(/select an image to see/i)).toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("replaces a previously analyzed image with a newly selected one", async () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    fireEvent.change(input, { target: { files: [createFile("first.jpg", "image/jpeg")] } });
    await waitFor(() => expect(screen.getByText(/1920 × 1080px/)).toBeInTheDocument());

    mockImageOptions.width = 640;
    mockImageOptions.height = 360;
    fireEvent.change(input, { target: { files: [createFile("second.jpg", "image/jpeg")] } });

    await waitFor(() => expect(screen.getByText(/640 × 360px/)).toBeInTheDocument());
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("analyzes a file delivered via drag-and-drop and shows the dragging state on drag-over", async () => {
    render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const dropzone = screen.getByTestId("thumbnail-dropzone");
    const file = createFile("dropped.png", "image/png", 500 * 1024);

    fireEvent.dragOver(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone.className).toContain("border-[var(--accent)]");

    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toContain("border-[var(--accent)]");

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/1920 × 1080px/)).toBeInTheDocument());
    expect(createObjectURL).toHaveBeenCalledWith(file);
  });

  it("revokes the object URL on unmount", async () => {
    const { unmount } = render(<ThumbnailSizeChecker toolId="thumbnail_size_checker" />);

    const input = screen.getByLabelText(/drop an image here or choose a file/i);
    fireEvent.change(input, { target: { files: [createFile("thumb.jpg", "image/jpeg")] } });
    await waitFor(() => expect(screen.getByText(/1920 × 1080px/)).toBeInTheDocument());

    revokeObjectURL.mockClear();
    unmount();

    expect(revokeObjectURL).toHaveBeenCalled();
  });
});
