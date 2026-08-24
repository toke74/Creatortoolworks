import type { PlatformFact } from "./types";
import { youtubeThumbnailFacts } from "./youtube-thumbnail";

// Add changeable YouTube/Google facts only after verification against an authoritative source.
// Tool code should reference centralized facts instead of scattering magic numbers across components.
export const platformFacts: readonly PlatformFact<unknown>[] = [...youtubeThumbnailFacts];
