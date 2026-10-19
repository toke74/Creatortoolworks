"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { youtubeTitleMaxCharacters } from "@/lib/platform-facts/youtube-title";
import { formatFileSize } from "@/lib/tools/thumbnail-checker/analyze";
import { exampleChannel, exampleThumbnailSvg, exampleTitle, getPreviewReport, previewLayouts } from "@/lib/tools/thumbnail-title-previewer/preview";
import styles from "./youtube-thumbnail-title-previewer.module.css";

interface LocalThumbnail {
  url: string;
  name: string;
  width: number;
  height: number;
  size: number;
}

const buttonClass = "min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium transition hover:border-[var(--accent)]";
const inputClass = "mt-2 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm";

export function YoutubeThumbnailTitlePreviewer() {
  const [thumbnail, setThumbnail] = useState<LocalThumbnail | null>(null);
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("");
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resourceRef = useRef<{ url: string; image: HTMLImageElement } | null>(null);

  function releaseImage() {
    const resource = resourceRef.current;
    if (!resource) return;
    resource.image.onload = null;
    resource.image.onerror = null;
    URL.revokeObjectURL(resource.url);
    resourceRef.current = null;
  }

  useEffect(() => () => releaseImage(), []);

  function loadImage(file: File) {
    releaseImage();
    setThumbnail(null);
    setImageError("");
    setLoading(false);
    // Raster formats only for user files; decoding is the final readability check.
    const supportedType = /^image\/(jpeg|png|webp|gif|avif|bmp)$/i.test(file.type);
    const supportedExtension = /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name);
    if ((!supportedType && (file.type || !supportedExtension)) || file.size === 0) {
      setImageError("Choose a readable image: JPG, PNG, WebP, GIF, AVIF or BMP.");
      return;
    }
    decodeImage(file);
  }

  function decodeImage(file: File) {
    setLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      resourceRef.current = { url, image };
      image.onload = () => {
        if (resourceRef.current?.url !== url) return;
        if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
          image.onerror?.(new Event("error"));
          return;
        }
        setThumbnail({ url, name: file.name, width: image.naturalWidth, height: image.naturalHeight, size: file.size });
        setLoading(false);
      };
      image.onerror = () => {
        if (resourceRef.current?.url !== url) return;
        releaseImage();
        setThumbnail(null);
        setLoading(false);
        setImageError("This image could not be opened. It may be corrupted or unsupported by your browser.");
      };
      image.src = url;
    } catch {
      releaseImage();
      setLoading(false);
      setImageError("This image could not be opened. Try a different image.");
    }
  }

  function clear() {
    releaseImage();
    setThumbnail(null);
    setTitle("");
    setChannel("");
    setAppearance("light");
    setImageError("");
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.focus();
  }

  function loadExample() {
    releaseImage();
    setThumbnail(null);
    setImageError("");
    setTitle(exampleTitle);
    setChannel(exampleChannel);
    decodeImage(new File([exampleThumbnailSvg], "creatortoolworks-example.svg", { type: "image/svg+xml" }));
  }

  const report = getPreviewReport(title, Boolean(thumbnail), imageError);
  const titleError = report.overLimitBy > 0;
  const nonWidescreen = thumbnail && thumbnail.width * 9 !== thumbnail.height * 16;

  return (
    <div className="mt-5 min-w-0">
      <p className="rounded-[var(--radius-md)] bg-[var(--accent-soft)] p-4 text-sm leading-6">
        <strong>Your thumbnail stays in your browser.</strong> CreatorToolWorks uses the local image only to render these previews. Nothing is uploaded.
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="preview-thumbnail" className="block text-sm font-medium">{thumbnail ? "Replace thumbnail" : "Choose thumbnail"}</label>
          <input
            ref={inputRef}
            id="preview-thumbnail"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp"
            className={`${inputClass} min-h-12 file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-2 file:text-[var(--accent)]`}
            aria-describedby="preview-image-help preview-image-error"
            aria-invalid={imageError ? true : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) loadImage(file);
              event.target.value = "";
            }}
          />
          <p id="preview-image-help" className="mt-2 text-xs leading-5 text-[var(--text-muted)]">JPG, PNG, WebP, GIF, AVIF or BMP. Browser support varies.</p>
          <div id="preview-image-error">{imageError ? <p role="alert" className="mt-2 text-sm font-semibold text-[var(--text)]">Error: {imageError}</p> : null}</div>
          {thumbnail ? <p className="mt-3 break-words text-xs leading-5 text-[var(--text-muted)]">{thumbnail.name} · {thumbnail.width} × {thumbnail.height}px · {formatFileSize(thumbnail.size)}</p> : null}
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">Need to check dimensions, aspect ratio, or file size? <Link className="font-medium text-[var(--accent)] underline underline-offset-2" href="/youtube-tools/thumbnail-size-checker">Open Thumbnail Size Checker.</Link></p>
        </div>
        <div className="min-w-0">
          <label htmlFor="preview-title" className="text-sm font-medium">Video title</label>
          <textarea id="preview-title" value={title} rows={3} className={inputClass}
            aria-invalid={titleError ? true : undefined} aria-describedby="preview-title-count"
            onChange={(event) => setTitle(event.target.value)} />
          <p id="preview-title-count" className="mt-1 text-sm text-[var(--text-muted)]" aria-live="polite">
            {report.characterCount} / {youtubeTitleMaxCharacters.value} characters
            {titleError ? ` · Error: exceeds YouTube's official title limit by ${report.overLimitBy}.` : ""}
          </p>
          <label htmlFor="preview-channel" className="mt-4 block text-sm font-medium">Channel name (optional)</label>
          <input id="preview-channel" value={channel} className={inputClass} onChange={(event) => setChannel(event.target.value)} placeholder="Your Channel" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={loadExample} className={buttonClass}>Load example</button>
        <button type="button" onClick={clear} className={buttonClass}>Clear</button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">The built-in illustration is example content, not a recommended design.</p>
      <p role="status" data-testid="preview-status" className={`mt-5 rounded-[var(--radius-md)] border p-3 text-sm leading-6 ${report.status === "error" ? "border-[var(--danger-border)] bg-[var(--danger-soft)]" : report.status === "ready" ? "border-[var(--success-border)] bg-[var(--success-soft)]" : "border-[var(--border)] bg-[var(--surface-muted)]"}`}>
        {report.status === "error" ? "Error — review the image or title message above." : loading ? "Opening image locally…" : report.status === "ready" ? "Ready — your thumbnail and title are shown together below." : "Neutral — choose a thumbnail and enter a title to preview them together."}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-semibold">Preview layouts</h3>
        <fieldset className="flex flex-wrap items-center gap-3">
          <legend className="mb-1 text-xs text-[var(--text-muted)]">Preview appearance only</legend>
          {(["light", "dark"] as const).map((value) => (
            <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-sm">
              <input type="radio" name="preview-appearance" value={value} checked={appearance === value} onChange={() => setAppearance(value)} />
              {value === "light" ? "Light" : "Dark"}
            </label>
          ))}
        </fieldset>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">These are approximate visual previews. YouTube can change layout, cropping, title wrapping, fonts, spacing, and metadata presentation. These previews are visual simulations only.</p>
      {nonWidescreen ? <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Your source image is not 16:9. These cards show a centered 16:9 cover crop. This simulation does not guarantee YouTube&apos;s actual crop. Your original file is unchanged.</p> : null}
      <div data-testid="preview-layouts" data-appearance={appearance} className={`${styles.previews} mt-5 grid min-w-0 gap-4 md:grid-cols-2`}>
        {previewLayouts.map((layout) => (
          <section key={layout.id} aria-labelledby={`layout-${layout.id}`} data-layout={layout.id} className={styles.group}>
            <div className={styles.groupHeading}>
              <h4 id={`layout-${layout.id}`} className="text-sm font-semibold">{layout.label}</h4>
              <p className="mt-1 text-xs">Approximate preview</p>
            </div>
            <div className={`${styles.card} ${styles[layout.id]}`}>
              <div className={styles.imageFrame}>
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL; never send user images to an optimizer
                  <img src={thumbnail.url} alt={`Selected thumbnail: ${thumbnail.name}`} className={styles.image} />
                ) : <span className={styles.placeholder}>Your thumbnail here</span>}
              </div>
              <div className={styles.metadata}>
                <p className={styles.title} data-testid="card-title">{title || <span className={styles.emptyTitle}>Your video title here</span>}</p>
                <p className={styles.channel}>{channel || "Your Channel"}</p>
                <p className={styles.metrics}>123K views · 1 hour ago</p>
              </div>
            </div>
          </section>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">Supporting metadata (123K views, 1 hour ago, and Your Channel when blank) is placeholder display content. It is not analytics. The selected appearance applies only to these simulations.</p>
    </div>
  );
}
