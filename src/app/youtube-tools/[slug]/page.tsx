import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThumbnailSizeChecker } from "@/components/tool/thumbnail-size-checker";
import { ToolIcon } from "@/components/tool/tool-icon";
import { YoutubeChapterGenerator } from "@/components/tool/youtube-chapter-generator";
import { YoutubeDescriptionFormatter } from "@/components/tool/youtube-description-formatter";
import { YoutubeEarningsEstimator } from "@/components/tool/youtube-earnings-estimator";
import { YoutubeEndScreenTimingPlanner } from "@/components/tool/youtube-end-screen-timing-planner";
import { YoutubeHashtagChecker } from "@/components/tool/youtube-hashtag-checker";
import { YoutubeShortsFormatChecker } from "@/components/tool/youtube-shorts-format-checker";
import { YoutubeTitleChecker } from "@/components/tool/youtube-title-checker";
import { YoutubeTimestampGenerator } from "@/components/tool/youtube-timestamp-generator";
import { YoutubeUploadLimitChecker } from "@/components/tool/youtube-upload-limit-checker";
import { YoutubeThumbnailTitlePreviewer } from "@/components/tool/youtube-thumbnail-title-previewer";
import { ThumbnailTitlePreviewerGuide } from "@/components/tool/thumbnail-title-previewer-guide";
import { formatFileSize } from "@/lib/tools/thumbnail-checker/analyze";
import {
  youtubeThumbnailAcceptedMimeTypes,
  youtubeThumbnailMaxFileSizeDesktopBytes,
  youtubeThumbnailMaxFileSizeMobileBytes,
  youtubeThumbnailMinWidthPx,
  youtubeThumbnailRecommendedWidthPx,
} from "@/lib/platform-facts/youtube-thumbnail";
import {
  youtubeChaptersFirstTimestampMustBeZero,
  youtubeChaptersManualOverridesAutomatic,
  youtubeChaptersMinimumCount,
  youtubeChaptersMinimumLengthSeconds,
  youtubeChaptersRequireAscendingOrder,
} from "@/lib/platform-facts/youtube-chapters";
import { youtubeDescriptionMaxCharacters } from "@/lib/platform-facts/youtube-description";
import {
  youtubeFinalizedEarningsCanDiffer,
  youtubeRpmIncludesMultipleRevenueSources,
  youtubeRpmRevenuePerThousandViews,
  youtubeShortsRpmUsesEngagedViews,
  youtubeVideoRpmUsesViews,
} from "@/lib/platform-facts/youtube-earnings";
import {
  youtubeEndScreenMadeForKidsUnavailable,
  youtubeEndScreenMaxWindowSeconds,
  youtubeEndScreenMinVideoDurationSeconds,
  youtubeEndScreenMinWindowSeconds,
  youtubeEndScreenOtherAspectRatiosMayHaveLowerLimit,
  youtubeEndScreenStandardAspectMaxElements,
  youtubeEndScreenUploadWorkflowMinimumDuration,
} from "@/lib/platform-facts/youtube-end-screens";
import {
  youtubeHashtagsDescriptionMayDisplayCount,
  youtubeHashtagsDisplayDeterminedByYoutube,
  youtubeHashtagsIgnoreAllAboveCount,
  youtubeHashtagsMustFollowPolicies,
  youtubeHashtagsNoSpaces,
} from "@/lib/platform-facts/youtube-hashtags";
import {
  youtubeShortsAllowsSquareOrVertical,
  youtubeShortsMaxDurationSeconds,
  youtubeShortsOfficialArtistClassificationStartDate,
  youtubeShortsOverOneMinuteContentIdClaimLimitation,
  youtubeShortsStandardChannelClassificationStartDate,
  youtubeShortsUploadRequiresSquareOrVertical,
} from "@/lib/platform-facts/youtube-shorts";
import { youtubeTitleMaxCharacters } from "@/lib/platform-facts/youtube-title";
import {
  youtubeUploadDefaultDurationSeconds,
  youtubeUploadMaxDurationSeconds,
  youtubeUploadMaxFileSizeBytes,
  youtubeUploadSupportedFormatsAreSeparate,
} from "@/lib/platform-facts/youtube-upload";
import { siteConfig } from "@/lib/seo/site";
import { getRelatedTools, getToolBySlug, tools } from "@/lib/tools/registry";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

const trustSignals = ["Free", "No upload", "Runs in your browser"];

const WORKSPACE_HEADINGS: Record<string, string> = {
  "thumbnail-size-checker": "Check your thumbnail",
  "youtube-timestamp-generator": "Build your timestamps",
  "youtube-description-formatter": "Format your description",
  "youtube-chapter-generator": "Build your chapters",
  "youtube-earnings-estimator": "Estimate an earnings scenario",
  "youtube-title-checker": "Check your title",
  "youtube-hashtag-checker": "Check your hashtags",
  "youtube-shorts-format-checker": "Check your Shorts format",
  "youtube-upload-limit-checker": "Check upload limits",
  "youtube-end-screen-timing-planner": "Plan end screen timing",
  "youtube-thumbnail-title-previewer": "Preview your thumbnail and title",
};

// The registry's `summary` field also drives the meta description and catalog card,
// so it stays short. This override lets the on-page H1 subhead use the fuller,
// task-specific copy without adding a second content field to the shared registry.
const TOOL_INTRO_OVERRIDES: Record<string, string> = {
  "youtube-timestamp-generator":
    "Create clean timestamps for YouTube descriptions and comments. Enter times manually or paste an existing list, then format, sort, and copy everything in seconds.",
  "youtube-description-formatter":
    "Check your description against YouTube's character limit, review word/line/link/hashtag counts, and apply safe, non-destructive cleanup before you copy it in.",
  "youtube-chapter-generator":
    "Build a timestamped chapter list and check it against YouTube's published manual-chapter requirements — first timestamp, minimum count, order, and minimum length — before you paste it into a description.",
  "youtube-earnings-estimator":
    "Estimate a revenue scenario from views or engaged views and your own low/high RPM assumptions. The result is transparent math, not a prediction of what YouTube will pay.",
  "youtube-title-checker":
    "Check a YouTube video title against the official 100-character title limit, review informational counts, and copy the exact title when it is ready.",
  "youtube-hashtag-checker":
    "Extract hashtags from a title, description, or hashtag list, count duplicates, and check the result against YouTube's published 60-hashtag threshold.",
  "youtube-shorts-format-checker":
    "Choose a local video file and check its browser-reported metadata against YouTube's current Shorts duration and square-or-vertical format conditions.",
  "youtube-upload-limit-checker":
    "Choose a local video file and check its browser-readable size and duration against YouTube's currently published 256 GB and 12-hour upload limits.",
  "youtube-end-screen-timing-planner":
    "Enter a video duration and end-screen length to calculate the exact start and end timestamps for YouTube's published end-screen timing window.",
};

export function generateStaticParams() {
  return tools.filter((tool) => tool.implemented).map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !tool.implemented) return {};

  return {
    title: tool.name,
    description: tool.summary,
    alternates: { canonical: `${siteConfig.url}/youtube-tools/${tool.slug}` },
    robots: tool.status === "live" ? undefined : { index: false, follow: true },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !tool.implemented) notFound();
  const related = getRelatedTools(tool);

  return (
    <main className="site-container py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "YouTube tools", href: "/youtube-tools" }, { label: tool.name }]} />

      <div className="mt-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <ToolIcon category={tool.category} />
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            YouTube tools
          </p>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--text)]">{tool.name}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
          {TOOL_INTRO_OVERRIDES[tool.id] ?? tool.summary}
        </p>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-[var(--text-muted)]">
          {trustSignals.map((signal) => (
            <li key={signal} className="inline-flex items-center gap-1.5">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2"
              >
                <path d="M4 10.5l3.5 3.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {signal}
            </li>
          ))}
        </ul>
      </div>

      <section
        className={`card mt-10 p-6 shadow-[0_16px_40px_-24px_rgba(23,23,27,0.25)] sm:p-8 ${
          tool.id === "youtube-timestamp-generator" ||
          tool.id === "youtube-description-formatter" ||
          tool.id === "youtube-chapter-generator" ||
          tool.id === "youtube-earnings-estimator" ||
          tool.id === "youtube-title-checker" ||
          tool.id === "youtube-hashtag-checker" ||
          tool.id === "youtube-shorts-format-checker" ||
          tool.id === "youtube-upload-limit-checker" ||
          tool.id === "youtube-end-screen-timing-planner" ||
          tool.id === "youtube-thumbnail-title-previewer"
            ? "max-w-5xl"
            : "max-w-4xl"
        }`}
        aria-labelledby="tool-workspace-title"
      >
        <h2 id="tool-workspace-title" className="text-xl font-semibold text-[var(--text)]">
          {WORKSPACE_HEADINGS[tool.id] ?? tool.name}
        </h2>
        {tool.id === "thumbnail-size-checker" ? (
          <div className="mt-4">
            <ThumbnailSizeChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-timestamp-generator" ? (
          <div className="mt-4">
            <YoutubeTimestampGenerator toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-description-formatter" ? (
          <div className="mt-4">
            <YoutubeDescriptionFormatter toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-chapter-generator" ? (
          <div className="mt-4">
            <YoutubeChapterGenerator toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-earnings-estimator" ? (
          <div className="mt-4">
            <YoutubeEarningsEstimator toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-title-checker" ? (
          <div className="mt-4">
            <YoutubeTitleChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-hashtag-checker" ? (
          <div className="mt-4">
            <YoutubeHashtagChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-shorts-format-checker" ? (
          <div className="mt-4">
            <YoutubeShortsFormatChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-upload-limit-checker" ? (
          <div className="mt-4">
            <YoutubeUploadLimitChecker toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-end-screen-timing-planner" ? (
          <div className="mt-4">
            <YoutubeEndScreenTimingPlanner toolId={tool.analyticsId} />
          </div>
        ) : null}
        {tool.id === "youtube-thumbnail-title-previewer" ? <YoutubeThumbnailTitlePreviewer /> : null}
      </section>

      {tool.id === "youtube-thumbnail-title-previewer" ? <ThumbnailTitlePreviewerGuide /> : null}

      {tool.id === "thumbnail-size-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Select or drag a JPG or PNG image into the drop zone above.</li>
            <li>Review the width, height, aspect ratio, and file size YouTube will see.</li>
            <li>Check each pass/warning/fail result and fix anything flagged before uploading.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube thumbnail guidelines
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This checker verifies your image against YouTube&apos;s current published requirements for standard
            custom thumbnails:
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Format: </span>
              {(youtubeThumbnailAcceptedMimeTypes.value as readonly string[])
                .map((mime) => mime.replace("image/", "").toUpperCase())
                .join(" or ")}
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Width: </span>
              {youtubeThumbnailMinWidthPx.value}px minimum, {youtubeThumbnailRecommendedWidthPx.value}px recommended
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Aspect ratio: </span>
              16:9 for standard videos
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">File size: </span>
              up to {formatFileSize(youtubeThumbnailMaxFileSizeMobileBytes.value)} from the mobile app, up to{" "}
              {formatFileSize(youtubeThumbnailMaxFileSizeDesktopBytes.value)} from the web
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Pass</span> — meets YouTube&apos;s current
              guidance; no action needed.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Warning</span> — usable, but not ideal. Review it
              before you upload.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Fail</span> — likely to cause a problem on upload
              or display. Fix it first.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool checks your image against YouTube&apos;s current published custom-thumbnail guidance for
            standard videos: file format, minimum/recommended width, recommended 16:9 aspect ratio, and mobile vs.
            web upload file-size limits. Dimensions and format come from what your browser reports for the file you
            selected. YouTube can change these requirements at any time, and YouTube may apply additional checks at
            upload time that this tool cannot see.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload my image anywhere?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Your image is analyzed entirely in your browser and is never sent to a server.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why did a correctly sized image still get a warning?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                A warning means the file is usable but not optimal — for example, a width below YouTube&apos;s
                recommended (but above the minimum) resolution, or an aspect ratio other than 16:9.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can this guarantee YouTube will accept my thumbnail?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. YouTube applies its own checks at upload time, and requirements can change. Use this tool as a
                pre-upload sanity check, not a final guarantee.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Rules on this page are checked against YouTube&apos;s own custom-thumbnail documentation, not
              third-party advice.
            </p>
            <a
              href={youtubeThumbnailMinWidthPx.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com — Add a custom video thumbnail
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeThumbnailMinWidthPx.verifiedAt}. YouTube can change these requirements at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-timestamp-generator" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Enter a time and label for each moment you want to reference.</li>
            <li>Add more rows or paste an existing timestamp list.</li>
            <li>Review any formatting, duplicate, or ordering warnings.</li>
            <li>Copy the cleaned timestamps into your YouTube description or comment.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Timestamp formats supported
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Enter a whole number of seconds, <code>m:ss</code>, or <code>h:mm:ss</code> — this tool normalizes it to a
            consistent format:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="border-b border-[var(--border)] py-2 pr-4 font-medium">You enter</th>
                  <th className="border-b border-[var(--border)] py-2 font-medium">Formatted as</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text)]">
                {[
                  ["90", "01:30"],
                  ["1:30", "01:30"],
                  ["01:30", "01:30"],
                  ["1:02:30", "1:02:30"],
                ].map(([input, output]) => (
                  <tr key={input}>
                    <td className="border-b border-[var(--border)] py-2 pr-4 font-mono">{input}</td>
                    <td className="border-b border-[var(--border)] py-2 font-mono">{output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Values that can&apos;t be safely interpreted — like <code>1:75</code> (75 isn&apos;t a valid number of
            seconds) — are flagged as errors instead of being guessed at.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Using timestamps on YouTube
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool formats and cleans up a general-purpose timestamp list for a description or comment. If
            you&apos;re adding formal YouTube <strong>video chapters</strong>, YouTube applies additional
            requirements: the first timestamp must be{" "}
            {youtubeChaptersFirstTimestampMustBeZero.value ? "00:00" : ""}, there must be at least{" "}
            {youtubeChaptersMinimumCount.value} timestamps
            {youtubeChaptersRequireAscendingOrder.value ? ", listed in ascending order" : ""}, and each chapter must
            be at least {youtubeChaptersMinimumLengthSeconds.value} seconds long.{" "}
            {youtubeChaptersManualOverridesAutomatic.value
              ? "Manual chapters you add override YouTube's automatically generated chapters for that video."
              : ""}
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> — every timestamp is valid; the output
              is ready to copy.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Warning</span> — usable, but worth a look: a
              duplicate timestamp, an out-of-order entry, or a missing label.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> — a timestamp couldn&apos;t be safely
              parsed. Copying is disabled until every error is fixed, so an invalid line is never silently left out
              of the copied result.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool converts each supported timestamp string into a total number of seconds, uses that number to
            validate, sort, and detect duplicates or ordering problems, and formats the result back into a
            consistent <code>mm:ss</code> or <code>h:mm:ss</code> representation. It cannot inspect the actual video,
            cannot verify that a timestamp matches the video&apos;s content, and cannot guarantee how YouTube will
            display or process any timestamp.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">What timestamp format should I use for YouTube?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Any of whole seconds, <code>m:ss</code>, or <code>h:mm:ss</code> works — this tool normalizes them all
                to the same <code>mm:ss</code> / <code>h:mm:ss</code> format before you copy the result.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can I paste timestamps I already created?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Yes. Paste timestamp-first lines like <code>0:00 Intro</code> or <code>0:00 - Intro</code> and this
                tool splits each line into a time and a label automatically.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload anything to YouTube?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Everything runs locally in your browser. Nothing you type or paste here is sent anywhere, and no
                YouTube account or video URL is required.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does this automatically create YouTube chapters?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. This tool formats a timestamp list; it doesn&apos;t create or submit YouTube chapters for you.
                Formal video chapters have additional requirements (see above), and correctly formatted timestamps
                don&apos;t guarantee that YouTube will display chapters for your video.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              YouTube video chapter requirements referenced on this page are checked against YouTube&apos;s own
              Help Center article, not third-party advice.
            </p>
            <a
              href={youtubeChaptersMinimumCount.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com — Add chapters to your videos
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeChaptersMinimumCount.verifiedAt}. YouTube can change these requirements at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-description-formatter" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Paste or write your description in the editor, or load the example to see it in action.</li>
            <li>Review the character count, word/line counts, and detected link/hashtag counts.</li>
            <li>If you&apos;re over the 5,000-character limit, remove the number of characters shown until copying re-enables.</li>
            <li>Optionally apply a safe cleanup action, then copy the finished description.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube description limits
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently limits video descriptions to{" "}
            <span className="font-semibold text-[var(--text)]">
              {youtubeDescriptionMaxCharacters.value.toLocaleString()} characters
            </span>
            . This tool checks your description against that official limit as you edit — it does not enforce any
            additional length recommendation of its own.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> — your description is at or under
              5,000 characters and is ready to copy.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> — your description is over YouTube&apos;s
              character limit. The exact number of characters to remove is shown, and copying is disabled until
              you&apos;re back at or under the limit.
            </li>
          </ul>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Word count, line count, and the detected link/hashtag counts are informational — YouTube does not publish
            limits on any of these, so they are never treated as pass/fail results.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Formatting tips</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The formatting controls only clean up whitespace and blank-line structure — they never rewrite your
            wording, capitalization, punctuation, links, hashtags, or timestamps, and nothing runs automatically
            while you type:
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Trim trailing whitespace: </span>
              removes trailing spaces/tabs at the end of each line.
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Normalize excessive blank lines: </span>
              collapses three or more blank lines in a row down to one.
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Trim leading/trailing blank lines: </span>
              removes blank lines at the very start and end of the description.
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Apply all safe cleanup: </span>
              runs all three of the above in one step.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Characters are counted by Unicode character (not raw UTF-16 code units), so a single emoji counts as one
            character. Words are counted as whitespace-separated tokens; lines are counted as you&apos;d see them in
            the editor. Links and hashtags are detected with simple pattern matching, not a full URL parser — unusual
            formatting can occasionally be over- or under-counted. This tool cannot verify how YouTube itself will
            display or process any specific description, and YouTube can change its limits at any time.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my description?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Everything runs locally in your browser. Your description is never sent to a server, and nothing
                is saved once you leave the page.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why can&apos;t I copy my description?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Copying is disabled only when your description is empty or over YouTube&apos;s 5,000-character limit.
                The error message tells you exactly how many characters to remove.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Will the cleanup buttons change my wording or links?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. They only adjust whitespace and blank-line structure. Your sentences, capitalization,
                punctuation, links, hashtags, and timestamps are left exactly as you wrote them.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Is there a recommended (not required) description length?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                This tool only checks YouTube&apos;s official 5,000-character limit. It does not suggest an
                unofficial &quot;ideal&quot; length, since YouTube does not publish one.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              The character limit on this page is checked against YouTube&apos;s own Help Center documentation, not
              third-party advice.
            </p>
            <a
              href={youtubeDescriptionMaxCharacters.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com — Video settings, titles, and descriptions
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeDescriptionMaxCharacters.verifiedAt}. YouTube can change this limit at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-chapter-generator" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Enter a time and title for each chapter, or paste an existing timestamp list.</li>
            <li>Optionally enter the video&apos;s total duration to fully verify the final chapter.</li>
            <li>Review the requirement checks and fix any errors — copying is disabled while one remains.</li>
            <li>Copy the finished chapter block into your YouTube description.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube chapter requirements
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            To add manual video chapters, YouTube currently requires:
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">First timestamp: </span>
              must start at 00:00
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Minimum count: </span>
              at least {youtubeChaptersMinimumCount.value} timestamps
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Order: </span>
              listed in ascending order
            </li>
            <li className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 text-sm leading-6 text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">Minimum length: </span>
              each chapter at least {youtubeChaptersMinimumLengthSeconds.value} seconds long
            </li>
          </ul>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {youtubeChaptersManualOverridesAutomatic.value
              ? "Manual chapters you add override YouTube's automatically generated chapters for that video."
              : ""}{" "}
            Verifying the final chapter&apos;s length requires the video&apos;s total duration, since it&apos;s the
            only way to know how long the last chapter actually runs — enter it above for a complete check.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Passing every check on this page means your list is formatted correctly. It does not guarantee YouTube
            will display chapters for your video — YouTube&apos;s help documentation notes that chapters require
            channel/video eligibility (for example, no active channel strikes) and access to chapters as part of
            YouTube&apos;s Advanced features, which this tool has no way to check.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> — every requirement that can
              currently be verified passes; the output is ready to copy.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Info / Not verified</span> — optional information
              is missing, so one check can&apos;t be completed yet: most commonly, no video duration was entered, so
              the final chapter&apos;s length can&apos;t be confirmed. This does not mean the chapter list is
              invalid, and it never blocks copying.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Warning</span> — an actual condition worth
              reviewing before you copy, such as a duplicate timestamp. Usable, but worth a look.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> — an official requirement fails
              outright: an unparseable timestamp, a missing title, a first timestamp other than 00:00, timestamps out
              of order, or a chapter shorter than {youtubeChaptersMinimumLengthSeconds.value} seconds. Copying is
              disabled until every error is fixed.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Each timestamp is parsed into a total number of seconds and checked against YouTube&apos;s published
            manual-chapter rules: the first timestamp must equal zero, there must be at least{" "}
            {youtubeChaptersMinimumCount.value} chapters, each timestamp must be strictly greater than the one
            before it, and the gap to the next chapter must be at least {youtubeChaptersMinimumLengthSeconds.value}{" "}
            seconds. That gap is always fully knowable between two entered timestamps, so it&apos;s checked as a
            pass/fail requirement regardless of whether a video duration was supplied. The one gap that can&apos;t
            be computed from timestamps alone is the final chapter&apos;s length, which runs to the video&apos;s
            end — without a supplied duration, that single check is left as unverified informational text rather
            than assumed to pass or treated as a problem. Supplying a duration turns it into a normal pass/fail
            check, and a real failure there (final chapter under {youtubeChaptersMinimumLengthSeconds.value}{" "}
            seconds, or a timestamp at or after the video&apos;s end) is still an error that blocks copying. This
            tool cannot inspect the actual video, cannot verify a timestamp matches the video&apos;s content, and
            cannot guarantee how or whether YouTube will display chapters for any specific video.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Why do I need to enter the video duration?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Every chapter&apos;s length except the last can be checked from the timestamps alone. The final
                chapter runs from its timestamp to the end of the video, so without the video&apos;s total duration
                this tool has no way to confirm it&apos;s at least {youtubeChaptersMinimumLengthSeconds.value}{" "}
                seconds. Leaving the duration blank is entirely optional — it just leaves that one check marked
                &quot;Not verified&quot; instead of pass or fail, and everything else is still fully checked and
                ready to copy.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">
                Does an unverified final chapter mean something might be wrong?
              </p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Missing optional information is not evidence of a problem, so it&apos;s shown as a neutral,
                informational note — not a warning — and it never changes the overall result away from
                &quot;Ready&quot; or blocks copying.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">
                Will this guarantee YouTube shows chapters on my video?
              </p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. This tool checks formatting only. YouTube&apos;s own eligibility conditions — like channel
                standing and access to Advanced features — aren&apos;t something this tool can see or test.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my chapters?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Everything runs locally in your browser. Nothing you type or paste here is sent anywhere.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              YouTube video chapter requirements referenced on this page are checked against YouTube&apos;s own
              Help Center article, not third-party advice.
            </p>
            <a
              href={youtubeChaptersMinimumCount.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com — Add chapters to your videos
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeChaptersMinimumCount.verifiedAt}. YouTube can change these requirements at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-earnings-estimator" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Enter the relevant view count: video views for video RPM, or engaged views for Shorts RPM.</li>
            <li>Enter a low RPM and high RPM in the same currency.</li>
            <li>Review the estimated amount or range and the formula basis.</li>
            <li>Copy the plain-text summary if you want to save the scenario.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            How the estimate is calculated
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This calculator uses one transparent formula:{" "}
            <span className="font-semibold text-[var(--text)]">views / 1,000 x RPM</span>. A 100,000-view scenario at
            1.00 to 2.00 RPM produces 100.00 to 200.00 in the same currency as the RPM inputs. Those example values
            are illustrative only, not average or typical YouTube rates.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            If low RPM and high RPM are the same value, the tool shows one estimated amount instead of an artificial
            range. It does not convert currencies, convert CPM into RPM, or apply any hard-coded YouTube revenue-share
            percentage.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What RPM means</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {youtubeRpmRevenuePerThousandViews.value} YouTube also says RPM can incorporate multiple on-platform
            revenue sources, including {youtubeRpmIncludesMultipleRevenueSources.value.replace("RPM can include ", "")}
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {youtubeVideoRpmUsesViews.value} {youtubeShortsRpmUsesEngagedViews.value} For the most meaningful
            scenario, use your own historical RPM from YouTube Analytics. If you do not have historical RPM data, the
            calculator result is hypothetical based solely on the RPM assumptions you enter.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Neutral</span> - required fields are not complete
              yet. This is not an error.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - views are a valid non-negative whole
              number, RPM values are valid non-negative decimals, and high RPM is greater than or equal to low RPM.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - an input is malformed, negative,
              fractional where a whole view count is required, too large to handle safely, or high RPM is below low
              RPM.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This is an assumption-based calculator, not guaranteed earnings and not an official YouTube forecast. It
            does not determine whether a channel or video is eligible for monetization. RPM can vary over time, and{" "}
            {youtubeFinalizedEarningsCanDiffer.value} RPM does not represent every possible source of creator income.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The calculation runs entirely in your browser. No account data, channel data, uploads, API keys, or server
            requests are required for the estimate.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this predict what YouTube will pay me?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. It only applies your own RPM assumptions to a view count. Actual revenue depends on many factors
                and can change after YouTube finalizes earnings.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">What RPM should I enter?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Ideally, use your own historical RPM from YouTube Analytics. This tool intentionally does not publish
                unofficial average, typical, niche, country, or industry RPM values.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can I enter CPM instead?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. CPM and RPM are different metrics. This calculator accepts RPM only and does not convert CPM into
                RPM.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my numbers?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. The calculation runs locally in your browser and does not require a YouTube account connection.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Official sources</h2>
          <div className="mt-4 grid gap-3">
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                RPM definitions and the videos-vs-Shorts view basis are checked against YouTube&apos;s own analytics
                documentation.
              </p>
              <a
                href={youtubeRpmRevenuePerThousandViews.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Check your YouTube revenue
                <span aria-hidden="true">↗</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeRpmRevenuePerThousandViews.verifiedAt}. YouTube can change these definitions at any
                time.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Estimated and finalized earnings limitations are checked against YouTube&apos;s earnings
                documentation.
              </p>
              <a
                href={youtubeFinalizedEarningsCanDiffer.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Earn money on YouTube
                <span aria-hidden="true">↗</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeFinalizedEarningsCanDiffer.verifiedAt}. YouTube can change earnings documentation at
                any time.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-title-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Paste or write your exact video title in the editor.</li>
            <li>Review the character count, remaining or over count, word count, and informational signals.</li>
            <li>If the title is over the limit, remove the number of characters shown until Copy title re-enables.</li>
            <li>Optionally normalize repeated spaces, then copy the exact title into YouTube Studio.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube title limit
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently limits video titles to{" "}
            <span className="font-semibold text-[var(--text)]">{youtubeTitleMaxCharacters.value} characters</span>.
            This tool checks only that official title-length limit as a pass/fail requirement. It does not add an
            unofficial ideal title length or SEO score.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Empty</span> - no title has been entered yet. This
              is neutral guidance, not an error.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - the title has 1 to{" "}
              {youtubeTitleMaxCharacters.value} characters and is ready to copy.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - the title is over YouTube&apos;s{" "}
              {youtubeTitleMaxCharacters.value}-character limit. The exact number of characters to remove is shown,
              and copying is disabled until the title is back at or under the limit.
            </li>
          </ul>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Word count, capital letters, digits, emoji, and repeated spaces are informational. They can help you
            inspect the title, but they are not YouTube pass/fail requirements.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Cleanup explanation</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The Normalize repeated spaces button collapses runs of ordinary spaces into a single space. It only runs
            when you choose it, and it does not rewrite wording, capitalization, punctuation, emoji, or line breaks.
            Nothing modifies the title automatically while you type.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Characters are counted by Unicode code point, matching the convention used by the existing
            CreatorToolWorks text tools, so a single surrogate-pair emoji counts as one character in this checker.
            Words are counted as whitespace-separated tokens. Capital letters, digits, emoji, and repeated spaces are
            counted with deterministic browser-side pattern matching. This tool cannot publish to YouTube, cannot
            detect every invalid character YouTube may reject, cannot predict ranking or click-through performance,
            and cannot guarantee how YouTube will process a title after upload.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my title?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Everything runs locally in your browser. The title you type is not sent to a server and is not
                saved after you leave the page.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why is Copy title disabled?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Copying is disabled when the title is empty or over YouTube&apos;s 100-character title limit. It
                re-enables immediately once the title has 1 to 100 characters.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does the word count affect whether my title passes?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Word count is informational only. The only YouTube pass/fail requirement checked here is the
                official 100-character title limit.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Will Normalize repeated spaces change my title automatically?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Cleanup is an explicit button action. Typing, pasting, and editing never trigger automatic title
                changes.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              The title limit on this page is checked against YouTube&apos;s own Help Center documentation, not
              third-party SEO advice.
            </p>
            <a
              href={youtubeTitleMaxCharacters.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com - Video settings, titles, and descriptions
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeTitleMaxCharacters.verifiedAt}. YouTube can change this limit at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-title-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Paste or write your exact video title in the editor.</li>
            <li>Review the character count, remaining or over count, word count, and informational signals.</li>
            <li>If the title is over the limit, remove the number of characters shown until Copy title re-enables.</li>
            <li>Optionally normalize repeated spaces, then copy the exact title into YouTube Studio.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube title limit
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently limits video titles to{" "}
            <span className="font-semibold text-[var(--text)]">{youtubeTitleMaxCharacters.value} characters</span>.
            This tool checks only that official title-length limit as a pass/fail requirement. It does not add an
            unofficial ideal title length or SEO score.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Empty</span> - no title has been entered yet. This
              is neutral guidance, not an error.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - the title has 1 to{" "}
              {youtubeTitleMaxCharacters.value} characters and is ready to copy.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - the title is over YouTube&apos;s{" "}
              {youtubeTitleMaxCharacters.value}-character limit. The exact number of characters to remove is shown,
              and copying is disabled until the title is back at or under the limit.
            </li>
          </ul>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Word count, capital letters, digits, emoji, and repeated spaces are informational. They can help you
            inspect the title, but they are not YouTube pass/fail requirements.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Cleanup explanation</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The Normalize repeated spaces button collapses runs of ordinary spaces into a single space. It only runs
            when you choose it, and it does not rewrite wording, capitalization, punctuation, emoji, or line breaks.
            Nothing modifies the title automatically while you type.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Characters are counted by Unicode code point, matching the convention used by the existing
            CreatorToolWorks text tools, so a single surrogate-pair emoji counts as one character in this checker.
            Words are counted as whitespace-separated tokens. Capital letters, digits, emoji, and repeated spaces are
            counted with deterministic browser-side pattern matching. This tool cannot publish to YouTube, cannot
            detect every invalid character YouTube may reject, cannot predict ranking or click-through performance,
            and cannot guarantee how YouTube will process a title after upload.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my title?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Everything runs locally in your browser. The title you type is not sent to a server and is not
                saved after you leave the page.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why is Copy title disabled?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Copying is disabled when the title is empty or over YouTube&apos;s 100-character title limit. It
                re-enables immediately once the title has 1 to 100 characters.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does the word count affect whether my title passes?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Word count is informational only. The only YouTube pass/fail requirement checked here is the
                official 100-character title limit.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">
                Will Normalize repeated spaces change my title automatically?
              </p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Cleanup is an explicit button action. Typing, pasting, and editing never trigger automatic title
                changes.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              The title limit on this page is checked against YouTube&apos;s own Help Center documentation, not
              third-party SEO advice.
            </p>
            <a
              href={youtubeTitleMaxCharacters.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com - Video settings, titles, and descriptions
              <span aria-hidden="true">↗</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeTitleMaxCharacters.verifiedAt}. YouTube can change this limit at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-hashtag-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Paste a YouTube title, description, or hashtag list into the editor.</li>
            <li>Review the total hashtags, unique hashtags, duplicate count, and extracted preview.</li>
            <li>If the total is over {youtubeHashtagsIgnoreAllAboveCount.value}, remove hashtags until the page returns to Ready.</li>
            <li>Optionally remove exact duplicate hashtags, then copy the displayed extracted hashtag output.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            YouTube hashtag rules
          </h2>
          <ul className="mt-4 space-y-3 leading-7 text-[var(--text-muted)]">
            <li>
              YouTube says hashtags may be added to video titles and descriptions.
            </li>
            <li>
              {youtubeHashtagsNoSpaces.value
                ? "YouTube says hashtags do not contain spaces. For example, #CreatorTools is one hashtag; #Creator Tools is not treated as a multi-word hashtag by this checker."
                : ""}
            </li>
            <li>
              If content has more than{" "}
              <span className="font-semibold text-[var(--text)]">
                {youtubeHashtagsIgnoreAllAboveCount.value} hashtags
              </span>
              , YouTube&apos;s published policy says it ignores every hashtag on that content.
            </li>
            <li>
              Up to {youtubeHashtagsDescriptionMayDisplayCount.value} hashtags from a description may appear near the
              video title, but{" "}
              {youtubeHashtagsDisplayDeterminedByYoutube.value
                ? "YouTube determines which hashtags are considered most engaging."
                : "display is determined by YouTube."}{" "}
              This tool does not show a fake top-three preview.
            </li>
            <li>
              {youtubeHashtagsMustFollowPolicies.value
                ? "Hashtags must comply with YouTube policies, including rules against misleading, harassing, hateful, sexual, vulgar, or non-hashtag metadata use."
                : ""}
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Neutral</span> - the editor is empty or no hashtags
              were found. This is not a policy error.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - 1 to{" "}
              {youtubeHashtagsIgnoreAllAboveCount.value} hashtags were extracted, and Copy hashtags is enabled.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - 61 or more hashtags were extracted.
              Copy hashtags is disabled until the list is back at {youtubeHashtagsIgnoreAllAboveCount.value} or fewer.
            </li>
          </ul>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Duplicate hashtags are informational in this tool. They are not treated as an official YouTube policy
            failure unless the total hashtag count goes over the published threshold.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Duplicate cleanup</h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Remove duplicate hashtags is an explicit action. It compares extracted hashtag text exactly and
            case-sensitively, so <code>#Creator</code> and <code>#creator</code> are different. It preserves the first
            occurrence and removes later exact duplicates without changing spelling, capitalization, or wording. Running
            it again after duplicates are removed makes no further changes.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The parser runs entirely in your browser and looks for <code>#</code> followed by Unicode letters, numbers,
            combining marks, or underscores. It stops at spaces and punctuation, which keeps punctuation next to a
            hashtag out of the extracted result and follows YouTube&apos;s no-spaces guidance without guessing what the
            user meant. It cannot check hashtag popularity, search volume, trends, ranking impact, policy compliance,
            or which description hashtags YouTube will display near the title.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload or save my text?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. The extraction and cleanup run locally in your browser. No YouTube account, API, upload, or server
                processing is required.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why does #Creator Tools only show #Creator?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                YouTube says hashtags do not contain spaces. This checker will not silently rewrite prose into a
                different hashtag, so the word after the space remains normal text.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Is there a best number of hashtags?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                This tool does not invent an ideal count, SEO score, popularity score, search volume, or trending
                recommendation. It only extracts hashtags and checks the official over-60 threshold.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Will the first three description hashtags show by my title?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Not necessarily. YouTube says up to three description hashtags considered most engaging may appear by
                the video title, and this tool cannot know which hashtags YouTube will choose.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Official source</h2>
          <div className="card mt-4 p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              The hashtag rules on this page are checked against YouTube&apos;s own Help Center documentation, not
              third-party hashtag or SEO advice.
            </p>
            <a
              href={youtubeHashtagsIgnoreAllAboveCount.sourceUrl}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              support.google.com - Find playlists and videos using hashtags
              <span aria-hidden="true">-&gt;</span>
            </a>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Verified {youtubeHashtagsIgnoreAllAboveCount.verifiedAt}. YouTube can change these rules at any time.
            </p>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-shorts-format-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Choose a video file from your device.</li>
            <li>Let your browser read the local width, height, duration, filename, and file size metadata.</li>
            <li>If metadata cannot be read, enter width, height, and duration manually.</li>
            <li>Review the aspect and duration checks before uploading to YouTube.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Current YouTube Shorts format rules
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently publishes a Shorts duration condition of up to{" "}
            <span className="font-semibold text-[var(--text)]">
              {youtubeShortsMaxDurationSeconds.value / 60} minutes
            </span>{" "}
            and a square-or-vertical aspect condition. This checker treats width less than height as vertical, width
            equal to height as square, and width greater than height as horizontal. It does not invent or require a
            9:16 ratio.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {youtubeShortsAllowsSquareOrVertical.value && youtubeShortsUploadRequiresSquareOrVertical.value
              ? "For current uploads, YouTube's Help pages say square or vertical videos up to three minutes are handled as Shorts under the published rules."
              : ""}
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            What the results mean
          </h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Neutral</span> - no file is selected, or manual
              metadata is incomplete.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - duration is greater than zero and no
              more than 180 seconds, and width is less than or equal to height.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - the video is over 3 minutes,
              horizontal, unreadable with no valid manual fallback, or has zero/negative dimensions or duration.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Square vs vertical video
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Square and vertical both pass the aspect check because YouTube publishes the condition as square or
            vertical. A square 1080 x 1080 video passes the format check when it is no more than 3 minutes. A vertical
            1080 x 1920 video also passes when it is no more than 3 minutes. A horizontal 1920 x 1080 video fails this
            specific Shorts format check.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Videos longer than one minute and Content ID
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {youtubeShortsOverOneMinuteContentIdClaimLimitation.value
              ? "YouTube says Shorts over one minute with active copyright or Content ID claims can be blocked. This is neutral guidance here because CreatorToolWorks only reads local metadata and cannot know whether a selected file has an active claim."
              : ""}
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube also publishes a dated policy change for September 24, 2026, after which new Shorts longer than
            one minute with an active Content ID claim are no longer described as automatically blocked. This page was
            verified on September 18, 2026, so owner QA should re-check that source when reviewing after that date.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool runs in your browser. It uses browser media metadata for width, height, duration, filename, and
            optional file size. Nothing is uploaded to CreatorToolWorks or a server. The pass/fail logic is
            deterministic: width less than or equal to height passes the aspect check, and duration greater than zero
            and less than or equal to 180 seconds passes the duration check.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Passing this checker does not guarantee upload, distribution, monetization, recommendation, copyright
            clearance, or final classification by YouTube. It cannot determine Content ID claims, copyright status,
            channel/account restrictions, Community Guidelines issues, monetization eligibility, music licensing, or
            final YouTube processing/classification.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload my video?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Your video stays in your browser. CreatorToolWorks reads only local metadata needed for this
                check, and the video is not uploaded.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Is 9:16 required for YouTube Shorts?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                This checker does not require 9:16 because the official format condition checked here is square or
                vertical, not one required ratio.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does exactly 3:00 pass?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Yes. Exactly 180 seconds passes. Anything materially above 180 seconds fails.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can this tell whether YouTube will finally classify it as a Short?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. It checks only local format metadata against published conditions. YouTube performs its own
                processing and account, policy, rights, and classification checks.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Official sources</h2>
          <div className="mt-4 grid gap-3">
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Three-minute Shorts, square-or-vertical classification dates, and over-one-minute claimed-content
                limitations.
              </p>
              <a
                href={youtubeShortsMaxDurationSeconds.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Understand three-minute YouTube Shorts
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeShortsMaxDurationSeconds.verifiedAt}. Standard-channel date:{" "}
                {youtubeShortsStandardChannelClassificationStartDate.value}. Official Artist Channel date:{" "}
                {youtubeShortsOfficialArtistClassificationStartDate.value}.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                YouTube Studio upload guidance for selecting a video up to three minutes with a square or vertical
                aspect ratio.
              </p>
              <a
                href={youtubeShortsUploadRequiresSquareOrVertical.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Upload YouTube Shorts
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeShortsUploadRequiresSquareOrVertical.verifiedAt}. YouTube can change these rules at
                any time.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-upload-limit-checker" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Choose a video file from your device.</li>
            <li>Let your browser read the local file name, file size, MIME type, and duration metadata.</li>
            <li>If metadata cannot be read, enter file size and duration manually.</li>
            <li>Review the size, duration, and account-verification information before uploading to YouTube.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Current YouTube upload limits
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently publishes a maximum upload size of{" "}
            <span className="font-semibold text-[var(--text)]">
              {(youtubeUploadMaxFileSizeBytes.value as number) / 1_000_000_000} GB
            </span>{" "}
            or{" "}
            <span className="font-semibold text-[var(--text)]">
              {(youtubeUploadMaxDurationSeconds.value as number) / 3600} hours
            </span>
            , whichever is less. This checker treats exactly 256 GB and exactly 12:00:00 as within the published
            limits.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Videos longer than 15 minutes
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube says videos up to{" "}
            <span className="font-semibold text-[var(--text)]">
              {(youtubeUploadDefaultDurationSeconds.value as number) / 60} minutes
            </span>{" "}
            can be uploaded by default, and videos longer than 15 minutes require a verified account. CreatorToolWorks
            cannot know whether your YouTube account is verified, so longer-than-15-minute results are shown as
            informational guidance rather than a failure when the size and 12-hour duration checks pass.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Supported video formats
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube publishes supported video formats separately. This checker does not turn a filename extension or
            browser MIME type into a definitive format pass/fail because those values do not reliably prove the actual
            codec or container contents. Browser-reported type is displayed as informational only when available.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Neutral</span> - no file is selected, or manual
              fallback values are incomplete.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - file size is greater than zero and no
              more than 256 GB, and duration is greater than zero and no more than 12 hours.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Info</span> - the duration is over 15 minutes or a
              browser MIME type is available. Info messages do not make the file fail this limit check.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - file size is over 256 GB, duration is
              over 12 hours, or manual size/duration values are zero, negative, or not valid numbers.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This tool runs in your browser. It uses local file metadata for file name, file size, browser MIME type,
            and duration when the browser can read that data. Nothing is uploaded to CreatorToolWorks or a server. The
            pass/fail logic is deterministic: file size must be greater than zero and no more than 256 GB, and duration
            must be greater than zero and no more than 12 hours.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The size check uses decimal GB because YouTube publishes the limit as 256 GB, not an exact byte count:
            1 GB = 1,000,000,000 bytes, so 256 GB = 256,000,000,000 bytes. Validation uses the raw number before any
            friendly display rounding.
          </p>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Passing this checker does not guarantee upload acceptance, processing, publishing, monetization, copyright
            clearance, account eligibility, daily upload capacity, Community Guidelines compliance, codec validity, or
            final retention by YouTube. It also cannot check strikes, restrictions, Content ID issues, or whether your
            account is verified.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this tool upload my video?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Your video stays in your browser. CreatorToolWorks reads local metadata needed for this check and
                does not send the video to a server.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does a Ready result mean YouTube will accept my video?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. Ready means only that the locally checkable size and duration values are within YouTube&apos;s
                published size and duration limits.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Why is a 24-minute example still Ready?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Videos longer than 15 minutes require account verification according to YouTube, but that is separate
                from the 256 GB and 12-hour limit checks. This tool shows account verification as information because
                it cannot know your account status.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Can this check supported video formats?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                It links to YouTube&apos;s supported-format list and may show a browser-reported MIME type, but it does
                not claim definitive format or codec support from a filename or MIME string.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Official sources</h2>
          <div className="mt-4 grid gap-3">
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                Upload length, maximum file size, and account verification for videos longer than 15 minutes.
              </p>
              <a
                href={youtubeUploadMaxDurationSeconds.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Upload videos longer than 15 minutes
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeUploadMaxDurationSeconds.verifiedAt}. YouTube can change these limits at any time.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                YouTube&apos;s official supported video format list.
              </p>
              <a
                href={youtubeUploadSupportedFormatsAreSeparate.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Supported YouTube file formats
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeUploadSupportedFormatsAreSeparate.verifiedAt}. Format guidance is informational in
                this checker.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {tool.id === "youtube-end-screen-timing-planner" ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">How to use</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-[var(--text-muted)]">
            <li>Enter the full video duration, such as <code>12:35</code> or <code>1:02:15</code>.</li>
            <li>Enter the end screen length as a whole number from 5 through 20 seconds.</li>
            <li>Use the calculated start timestamp as the point where your end screen window begins.</li>
            <li>Copy the timing block if you want to save or share the plan.</li>
          </ol>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Current YouTube end-screen timing rules
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube currently says end screens can be added to the last{" "}
            <span className="font-semibold text-[var(--text)]">{youtubeEndScreenMinWindowSeconds.value}</span>-
            <span className="font-semibold text-[var(--text)]">{youtubeEndScreenMaxWindowSeconds.value}</span>{" "}
            seconds of a video. YouTube also says a video must be at least{" "}
            <span className="font-semibold text-[var(--text)]">
              {youtubeEndScreenMinVideoDurationSeconds.value} seconds
            </span>{" "}
            long to have an end screen.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            How the timing is calculated
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            The calculation is deterministic: end screen start equals video duration minus end screen length. The end
            time is the full video duration. For a <code>12:35</code> video with a 15-second end screen, the planner
            returns a start time of <code>12:20</code> and an end time of <code>12:35</code>.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">What the results mean</h2>
          <ul className="mt-4 space-y-2 leading-7 text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">Neutral</span> - the duration is empty or the inputs
              are incomplete.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Ready</span> - the duration is at least 25 seconds
              and the end-screen length is within YouTube&apos;s published 5-20 second window.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">Error</span> - the duration cannot be parsed, is
              zero or negative, is shorter than 25 seconds, or the end-screen length is outside 5-20 seconds.
            </li>
          </ul>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            End-screen element limits
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            YouTube says standard 16:9 videos can have up to{" "}
            <span className="font-semibold text-[var(--text)]">
              {youtubeEndScreenStandardAspectMaxElements.value}
            </span>{" "}
            end-screen elements.{" "}
            {youtubeEndScreenOtherAspectRatiosMayHaveLowerLimit.value
              ? "Other aspect ratios may support fewer elements."
              : ""}
            This planner keeps that as informational guidance, not a timing pass/fail rule.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Where end screens may not appear
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            Timing compliance does not guarantee that an end screen is available or displayed. YouTube documents
            contexts where end screens are unavailable
            {youtubeEndScreenMadeForKidsUnavailable.value ? ", including videos set as made for kids" : ""}, the
            YouTube Music app, Flash videos, mobile web, and 360 videos. YouTube also says viewers can hide end
            screens and that end screens may show differently by performance, viewer behavior, device, and context.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">
            Methodology and limitations
          </h2>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            This planner runs entirely in your browser. It does not require an account, API, login, upload, or
            server-side calculation. It only checks user-entered timing values against YouTube&apos;s published timing
            window and minimum video duration. It cannot know made-for-kids status, account or channel restrictions,
            video policy status, viewer or device context, whether a viewer hides the end screen, or final YouTube
            rendering behavior.
          </p>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">FAQ</h2>
          <div className="mt-4 space-y-5">
            <div>
              <p className="font-semibold text-[var(--text)]">Does this find the best end-screen length?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. It is a timing planner only. It does not predict views, retention, click-through rate, or
                performance.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does exactly 25 seconds pass?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                Yes. A 25-second video can have a 5-second end screen starting at <code>0:20</code>, or a 20-second
                end screen starting at <code>0:05</code>.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does 25:00 mean 25 seconds?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. The shared timestamp parser treats <code>25:00</code> as 25 minutes. Enter <code>25</code> or{" "}
                <code>0:25</code> for 25 seconds.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--text)]">Does this upload my video?</p>
              <p className="mt-1 leading-7 text-[var(--text-muted)]">
                No. This tool uses manual timing inputs only and sends no video, title, filename, account, or channel
                data anywhere.
              </p>
            </div>
          </div>

          <h2 className="mt-12 text-2xl font-semibold tracking-tight text-[var(--text)]">Official sources</h2>
          <div className="mt-4 grid gap-3">
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                End-screen timing window, 25-second video minimum, element limits, and unavailable contexts.
              </p>
              <a
                href={youtubeEndScreenMinWindowSeconds.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Add end screens to videos
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeEndScreenMinWindowSeconds.verifiedAt}. YouTube can change these rules at any time.
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                YouTube Studio upload workflow note that a video must be 25 seconds or longer to add an end screen.
              </p>
              <a
                href={youtubeEndScreenUploadWorkflowMinimumDuration.sourceUrl}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                support.google.com - Upload YouTube videos
                <span aria-hidden="true">-&gt;</span>
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verified {youtubeEndScreenUploadWorkflowMinimumDuration.verifiedAt}.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="mt-14 max-w-4xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Related tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/youtube-tools/${item.slug}`}
                className="card flex items-center gap-3 p-4 transition hover:border-[var(--accent)]"
              >
                <ToolIcon category={item.category} className="h-9 w-9 shrink-0" />
                <span className="font-medium text-[var(--text)]">{item.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
