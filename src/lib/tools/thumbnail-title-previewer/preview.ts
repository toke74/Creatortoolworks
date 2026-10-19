import { youtubeTitleMaxCharacters } from "@/lib/platform-facts/youtube-title";
import { buildTitleReport } from "@/lib/tools/title-checker/analyze";

export const previewLayouts = [
  { id: "desktop-large", label: "Desktop feed — large" },
  { id: "desktop-compact", label: "Desktop feed — compact" },
  { id: "sidebar", label: "Sidebar / suggested style" },
  { id: "channel", label: "Channel / grid style" },
  { id: "mobile", label: "Mobile feed" },
] as const;

export function getPreviewReport(title: string, hasImage: boolean, imageError = "") {
  const titleReport = buildTitleReport(title, youtubeTitleMaxCharacters.value);
  const status = imageError || titleReport.status === "error"
    ? "error"
    : hasImage && titleReport.status === "ready" ? "ready" : "neutral";
  return { ...titleReport, status };
}

// Owned, deterministic vector illustration. No remote resources, copied thumbnail,
// generated raster, or image processing needed. The browser decodes this like a local file.
export const exampleThumbnailSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
<rect width="960" height="540" fill="#eeeafe"/>
<circle cx="820" cy="90" r="190" fill="#ffb84d"/>
<rect x="555" y="175" width="280" height="240" rx="30" fill="#6d4aff" transform="rotate(-8 695 295)"/>
<circle cx="695" cy="285" r="68" fill="#fff"/>
<path d="M675 247l59 38-59 38z" fill="#6d4aff"/>
<text x="64" y="95" font-family="sans-serif" font-size="22" fill="#5535e8">CREATORTOOLWORKS · ILLUSTRATIVE EXAMPLE</text>
<text x="64" y="255" font-family="sans-serif" font-size="65" font-weight="bold" fill="#17171b">A little</text>
<text x="64" y="335" font-family="sans-serif" font-size="65" font-weight="bold" fill="#17171b">creative space</text>
<rect x="64" y="410" width="340" height="8" rx="4" fill="#6d4aff"/>
</svg>`;
export const exampleTitle = "Building a little creative space | A weekend studio project";
export const exampleChannel = "Example Studio";
