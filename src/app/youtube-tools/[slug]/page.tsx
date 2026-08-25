import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThumbnailSizeChecker } from "@/components/tool/thumbnail-size-checker";
import { ToolIcon } from "@/components/tool/tool-icon";
import { YoutubeDescriptionFormatter } from "@/components/tool/youtube-description-formatter";
import { YoutubeTimestampGenerator } from "@/components/tool/youtube-timestamp-generator";
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
};

// The registry's `summary` field also drives the meta description and catalog card,
// so it stays short. This override lets the on-page H1 subhead use the fuller,
// task-specific copy without adding a second content field to the shared registry.
const TOOL_INTRO_OVERRIDES: Record<string, string> = {
  "youtube-timestamp-generator":
    "Create clean timestamps for YouTube descriptions and comments. Enter times manually or paste an existing list, then format, sort, and copy everything in seconds.",
  "youtube-description-formatter":
    "Check your description against YouTube's character limit, review word/line/link/hashtag counts, and apply safe, non-destructive cleanup before you copy it in.",
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
          tool.id === "youtube-timestamp-generator" || tool.id === "youtube-description-formatter"
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
      </section>

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
