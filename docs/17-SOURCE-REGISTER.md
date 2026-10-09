# Official Source Register

**Last baseline verification:** 2026-08-20

This register is for changeable platform/policy facts. Prefer primary/official documentation. Re-verify before implementation when a fact has a meaningful chance of changing.

## Google Search
- Generative AI content guidance — https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Spam policies / scaled content abuse — https://developers.google.com/search/docs/essentials/spam-policies
- Helpful, reliable, people-first content — https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Search Essentials — https://developers.google.com/search/docs/essentials

## Google AdSense
- Program policies — https://support.google.com/adsense/answer/48182?hl=en
- Ad placement policies — https://support.google.com/adsense/answer/1346295?hl=en
- Required privacy content — https://support.google.com/adsense/answer/1348695?hl=en
- Cookies — https://support.google.com/adsense/answer/7549925?hl=en
- Privacy & messaging — https://support.google.com/adsense/answer/10924669?hl=en
- Invalid traffic prevention — https://support.google.com/adsense/answer/1112983?hl=en

## YouTube
- Custom thumbnails — https://support.google.com/youtube/answer/72431?hl=en
- Video chapters — https://support.google.com/youtube/answer/9884579?hl=en
- Video settings / title & description limits — https://support.google.com/youtube/answer/57404?hl=en
- Description tips — https://support.google.com/youtube/answer/12948449?hl=en
- Thumbnail/title tips — https://support.google.com/youtube/answer/12340300?hl=en
- YouTube Analytics RPM — https://support.google.com/youtube/answer/9314357
- YouTube earnings/finalized payments — https://support.google.com/youtube/answer/72902
- Hashtag use on YouTube — https://support.google.com/youtube/answer/6390658
- Understand three-minute YouTube Shorts — https://support.google.com/youtube/answer/15424877
- Upload YouTube Shorts — https://support.google.com/youtubecreatorstudio/answer/12779649
- Upload videos longer than 15 minutes - https://support.google.com/youtube/answer/71673
- Supported YouTube file formats - https://support.google.com/youtube/troubleshooter/2888402
- Upload YouTube videos - https://support.google.com/youtube/answer/57407
- Add end screens to YouTube videos - https://support.google.com/youtube/answer/6388789

### Baseline facts verified on 2026-08-19
- YouTube video title limit: 100 characters (official video settings help).
- YouTube video description limit: 5,000 characters (official help).
- Manual video chapters: first timestamp starts at `00:00`, at least three timestamps in ascending order, and each chapter must be at least 10 seconds (official chapters help).
- Thumbnail requirements have changed over time; implementation must read the current official thumbnail page rather than relying on old 1280×720-only advice.

### Re-verified on 2026-08-20 (Thumbnail Size Checker release-readiness pass)
- Custom thumbnails (support.google.com/youtube/answer/72431): JPG or PNG; 3840×2160 recommended with a 640px minimum width; 16:9 recommended aspect ratio; 50MB max from desktop/web, 2MB max from the mobile app. Matches the values already centralized in `src/lib/platform-facts/youtube-thumbnail.ts` — no changes required.

### Re-verified on 2026-08-23 (YouTube Timestamp Generator build)
- Manual video chapters (support.google.com/youtube/answer/9884579): first timestamp must be `00:00`, at least three timestamps, listed in ascending order, minimum chapter length 10 seconds, and manual chapters override automatically generated ones. Matches the 2026-08-19 baseline; now centralized in `src/lib/platform-facts/youtube-chapters.ts`. The Timestamp Generator itself is a general-purpose formatter and does not enforce these chapter-specific rules — it only explains them as context.

### Re-verified on 2026-08-25 (YouTube Description Formatter build)
- Video description character limit (support.google.com/youtube/answer/57404): "Video descriptions have a character limit of 5,000 characters and cannot include invalid characters." Cross-checked against support.google.com/youtube/answer/12948449, which separately states "The description allows a maximum of 5000 characters." Matches the 2026-08-19 baseline; now centralized in `src/lib/platform-facts/youtube-description.ts`.

### Re-verified on 2026-08-26 (YouTube Chapter Generator build)
- Manual video chapters (support.google.com/youtube/answer/9884579): first timestamp must be `00:00`, at least three timestamps, listed in ascending order, minimum chapter length 10 seconds, and manual chapters override automatically generated ones. Matches the 2026-08-19/2026-08-23 baseline; no changes to `src/lib/platform-facts/youtube-chapters.ts` were needed — the Chapter Generator reuses those existing facts rather than duplicating them. Additionally confirmed the Help article notes chapter display depends on channel/video eligibility (e.g. no active channel strikes) and access to chapters as part of YouTube's Advanced features — an eligibility condition this tool cannot check, called out as an explicit limitation on the tool page rather than tested for.

### Re-verified on 2026-09-05 (YouTube Title Checker build)
- Video title character limit (support.google.com/youtube/answer/57404): "Video titles have a character limit of 100 characters and cannot include invalid characters." Matches the 2026-08-19 baseline; now centralized in `src/lib/platform-facts/youtube-title.ts`. The Title Checker treats only the official 100-character limit as pass/fail. Word count, capital letters, digits, emoji, and repeated spaces are informational signals only.

### Re-verified on 2026-09-15 (YouTube Earnings Estimator build)
- RPM (support.google.com/youtube/answer/9314357): YouTube defines RPM as how much a creator earned per 1,000 views after YouTube revenue share, and says it can include ads, channel memberships, YouTube Premium revenue, Super Chat, Super Stickers, Super Thanks, and Shopping. For Shorts, RPM is based on engaged views; for videos, RPM is based on views. Centralized in `src/lib/platform-facts/youtube-earnings.ts`.
- Estimated/finalized earnings (support.google.com/youtube/answer/72902): YouTube Analytics estimated revenue can be adjusted, and finalized earnings can differ from estimated revenue. Centralized in `src/lib/platform-facts/youtube-earnings.ts`.

### Re-verified on 2026-09-16 (YouTube Hashtag Checker build)
- Hashtag use on YouTube (support.google.com/youtube/answer/6390658): hashtags may be added to video titles and descriptions; hashtags do not contain spaces; if a video or playlist has more than 60 hashtags, YouTube ignores every hashtag on that content; up to three hashtags from a video description that YouTube considers most engaging may appear by the video title; YouTube determines which hashtags appear; and hashtags must meet YouTube policies. Centralized in `src/lib/platform-facts/youtube-hashtags.ts`.

### Re-verified on 2026-09-18 (YouTube Shorts Format Checker build)
- Understand three-minute YouTube Shorts (support.google.com/youtube/answer/15424877): for standard channels, videos uploaded on or after 2024-10-15 with a square or vertical aspect ratio up to three minutes in length are categorized as Shorts; for Official Artist Channels, the corresponding date is 2025-12-08. The same page says Shorts can be uploaded up to three minutes through the YouTube app and YouTube Studio. It also documents active copyright/Content ID claim limitations for Shorts over one minute, with a published 2026-09-24 change for new claimed Shorts. Centralized in `src/lib/platform-facts/youtube-shorts.ts`.
- Upload YouTube Shorts (support.google.com/youtubecreatorstudio/answer/12779649): YouTube Studio upload guidance says to select a short video file up to three minutes and with a square or vertical aspect ratio. Centralized in `src/lib/platform-facts/youtube-shorts.ts`.

### Re-verified on 2026-09-19 (YouTube Upload Limit Checker build)
- Upload videos longer than 15 minutes (support.google.com/youtube/answer/71673): YouTube says users can upload videos up to 15 minutes by default, verified accounts can upload videos longer than 15 minutes, and the maximum file size is 256 GB or 12 hours, whichever is less. Centralized in `src/lib/platform-facts/youtube-upload.ts`.
- Supported YouTube file formats (support.google.com/youtube/troubleshooter/2888402): YouTube publishes a separate supported-format list. The Upload Limit Checker links to this official list but does not treat filename extension or browser MIME type as definitive codec/container proof.
- Upload YouTube videos (support.google.com/youtube/answer/57407): YouTube documents upload workflow details and notes that channels have a daily upload limit. The Upload Limit Checker calls daily limits out as a limitation because local metadata cannot determine the user's current channel limit.

### Re-verified on 2026-09-29 (YouTube End Screen Timing Planner build)
- Add end screens to videos (support.google.com/youtube/answer/6388789): YouTube says end screens can be added to the last 5-20 seconds of a video, the video has to be at least 25 seconds long, standard 16:9 videos can have up to four elements, other aspect ratios may have a lower limit, end screens are not available in certain contexts including videos set as made for kids, and viewers can hide end screens. Centralized in `src/lib/platform-facts/youtube-end-screens.ts`.
- Upload YouTube videos (support.google.com/youtube/answer/57407): YouTube's upload workflow also states that a video must be 25 seconds or longer to add an end screen. Centralized in `src/lib/platform-facts/youtube-end-screens.ts`.

## Framework/hosting
- Next.js metadata — https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Next.js sitemap — https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- Next.js robots — https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- Cloudflare Next.js on Workers — https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare Workers pricing — https://developers.cloudflare.com/workers/platform/pricing/
- Vercel Hobby plan — https://vercel.com/docs/plans/hobby

## AI coding agents
- OpenAI Codex `AGENTS.md` — https://developers.openai.com/codex/agent-configuration/agents-md
- OpenAI Codex best practices — https://developers.openai.com/codex/learn/best-practices
- Anthropic Claude Code project memory/`CLAUDE.md` — https://docs.anthropic.com/en/docs/claude-code/memory

## GitHub
- Protected branches / required checks — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches

## Freshness policy
Suggested review cadence:
- AdSense/Search policies: before major monetization/SEO changes and at least quarterly during active operation.
- YouTube platform limits: before releasing/changing a dependent tool; automated reminder every 90 days is reasonable.
- Hosting/pricing: before plan upgrades or forecasts.
- Framework support: during dependency/framework upgrades.

When a source changes a rule, update centralized platform facts, affected tests, copy, and this register in one pull request.
