import { youtubeThumbnailRecommendedAspectRatio, youtubeThumbnailRecommendedWidthPx, youtubeThumbnailMinWidthPx, youtubeThumbnailAcceptedMimeTypes, youtubeThumbnailMaxFileSizeDesktopBytes, youtubeThumbnailMaxFileSizeMobileBytes } from "@/lib/platform-facts/youtube-thumbnail";
import { youtubeThumbnailPreviewImage, youtubeThumbnailTitleViewerDecision, youtubeThumbnailTitleDeviceVariation, youtubeThumbnailTitlePartialTitle } from "@/lib/platform-facts/youtube-thumbnail-title";
import { youtubeTitleMaxCharacters } from "@/lib/platform-facts/youtube-title";
import { describeAspectRatio, formatFileSize } from "@/lib/tools/thumbnail-checker/analyze";

const heading = "mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]";
const paragraph = "mt-4 leading-7 text-[var(--text-muted)]";

export function ThumbnailTitlePreviewerGuide() {
  const ratio = youtubeThumbnailRecommendedAspectRatio.value;
  const sources = [
    { title: "Add custom thumbnails on YouTube", fact: youtubeThumbnailPreviewImage },
    { title: "Thumbnail & title tips", fact: youtubeThumbnailTitleViewerDecision },
    { title: "Upload YouTube videos", fact: youtubeTitleMaxCharacters },
  ];
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
        <li>Choose a local thumbnail, enter your video title, and optionally add a channel name.</li>
        <li>Compare the image and title in the five layouts. Switch Light or Dark to inspect the simulated cards.</li>
        <li>Replace the image or edit your title to compare another combination. Clear removes your inputs; Load example uses an original illustration.</li>
      </ol>
      <h2 className={heading}>What the previews show</h2>
      <p className={paragraph}>Desktop feed — large, Desktop feed — compact, Sidebar / suggested style, Channel / grid style, and Mobile feed use different card widths and text sizes to help you inspect the same combination. Ready means a readable image and a title within the character limit are present. Empty inputs are neutral. Error identifies an unreadable image or a title over the limit; it says nothing about creative quality.</p>
      <h2 className={heading}>Thumbnail and title together</h2>
      <p className={paragraph}>{youtubeThumbnailTitleViewerDecision.value} Use the previews to inspect whether your own image text remains legible at smaller sizes and how the title sits beside it. The tool preserves your title exactly as entered, including spaces and Unicode characters. It never rewrites or shortens it.</p>
      <h2 className={heading}>Why layouts can vary</h2>
      <p className={paragraph}>{youtubeThumbnailTitleDeviceVariation.value} {youtubeThumbnailTitlePartialTitle.value} Actual YouTube layouts, cropping, title truncation, fonts, spacing, and interface details can vary by device, viewport, experiment, and product updates. These cards evoke common proportions using CreatorToolWorks components, without YouTube logos or proprietary interface assets.</p>
      <h2 className={heading}>Current YouTube thumbnail/title facts</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
        <li>{youtubeThumbnailPreviewImage.value}</li>
        <li>Video titles currently have a {youtubeTitleMaxCharacters.value}-character limit. The previewer shares the Title Checker&apos;s Unicode code-point counting convention; this is a local length check, not a full platform validation.</li>
        <li>The current Help page recommends {youtubeThumbnailRecommendedWidthPx.value} × {Math.round(youtubeThumbnailRecommendedWidthPx.value / ratio)} pixels, a minimum video thumbnail width of {youtubeThumbnailMinWidthPx.value} pixels, and a {describeAspectRatio(ratio, 1).label} aspect ratio for standard video thumbnails.</li>
        <li>It lists formats such as {youtubeThumbnailAcceptedMimeTypes.value.map((type) => type === "image/jpeg" ? "JPG" : "PNG").join(" or ")}, with video thumbnail limits of {formatFileSize(youtubeThumbnailMaxFileSizeMobileBytes.value)} on mobile and {formatFileSize(youtubeThumbnailMaxFileSizeDesktopBytes.value)} on desktop. Previewing a browser-readable file here does not establish upload compatibility.</li>
      </ul>
      <h2 className={heading}>Methodology and limitations</h2>
      <p className={paragraph}>The browser decodes the local image and displays it through a temporary object URL. CSS places it in a centered 16:9 frame using cover cropping. No source pixels are changed, and no cropped file is exported. Different cards simulate title wrapping with different line clamps. Those line counts are design choices for this simulation, not official YouTube rules or a universal safe title length. Wrapping depends on viewport width, font metrics, UI experiments, and device.</p>
      <p className={paragraph}>This tool cannot determine CTR, viewer interest, recommendation performance, search ranking, thumbnail policy compliance from image contents, final YouTube cropping, exact title truncation, exact YouTube interface layout, or A/B test performance. It does not score thumbnails or titles. Placeholder views and time metadata are illustrative, not predictions.</p>
      <h2 className={heading}>FAQ</h2>
      <div className="mt-4 space-y-5">
        <div><h3 className="font-semibold">Does a cut-off title fail the check?</h3><p className="mt-1 leading-7 text-[var(--text-muted)]">No. Visual clipping does not change the title or its length status. Exactly {youtubeTitleMaxCharacters.value} characters is valid for this check; anything longer shows an Error. You decide whether to edit the title.</p></div>
        <div><h3 className="font-semibold">Can I preview a square or portrait image?</h3><p className="mt-1 leading-7 text-[var(--text-muted)]">Yes. The cards show the center of the image inside a 16:9 frame. This chosen crop is only a simulation. Your original image remains unchanged.</p></div>
        <div><h3 className="font-semibold">Does this upload or save my thumbnail?</h3><p className="mt-1 leading-7 text-[var(--text-muted)]">No. Your image stays in your browser and is not stored by CreatorToolWorks. Replacing it, clearing, or leaving the tool releases its temporary object URL. Reloading the page clears the inputs.</p></div>
        <div><h3 className="font-semibold">Does Ready mean the video will perform well?</h3><p className="mt-1 leading-7 text-[var(--text-muted)]">No. Ready only describes the local image and title-length state. This visual preview does not assess audience response or publication eligibility.</p></div>
      </div>
      <h2 className={heading}>Official sources</h2>
      <div className="mt-4 grid gap-3">
        {sources.map(({ title, fact }) => <div className="card p-4" key={fact.key}>
          <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-[var(--accent)] underline underline-offset-2">YouTube Help — {title}</a>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Verified {fact.verifiedAt}. Platform guidance can change.</p>
        </div>)}
      </div>
    </section>
  );
}
