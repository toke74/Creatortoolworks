import type { PlatformFact } from "./types";
import { youtubeChaptersFacts } from "./youtube-chapters";
import { youtubeDescriptionFacts } from "./youtube-description";
import { youtubeEarningsFacts } from "./youtube-earnings";
import { youtubeEndScreenFacts } from "./youtube-end-screens";
import { youtubeHashtagFacts } from "./youtube-hashtags";
import { youtubeShortsFacts } from "./youtube-shorts";
import { youtubeThumbnailFacts } from "./youtube-thumbnail";
import { youtubeTitleFacts } from "./youtube-title";
import { youtubeUploadFacts } from "./youtube-upload";

// Add changeable YouTube/Google facts only after verification against an authoritative source.
// Tool code should reference centralized facts instead of scattering magic numbers across components.
export const platformFacts: readonly PlatformFact<unknown>[] = [
  ...youtubeThumbnailFacts,
  ...youtubeChaptersFacts,
  ...youtubeDescriptionFacts,
  ...youtubeEarningsFacts,
  ...youtubeEndScreenFacts,
  ...youtubeHashtagFacts,
  ...youtubeShortsFacts,
  ...youtubeTitleFacts,
  ...youtubeUploadFacts,
];
