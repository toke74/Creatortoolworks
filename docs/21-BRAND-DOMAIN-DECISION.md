# Brand & Domain Decision

Status: **Accepted**

## Decision
- **Brand:** CreatorToolWorks
- **Primary domain:** `creatortoolworks.com`
- **Canonical origin:** `https://creatortoolworks.com`
- **Tagline:** Practical tools for creators.
- **Date selected:** 2026-08-19
- **Initial category:** YouTube creator tools

## Why this brand
CreatorToolWorks is broad enough to support the long-term 100–300-tool roadmap without restricting the business to YouTube or video. The name communicates creator-focused practical utilities while allowing future categories such as social-media tools, text tools, creator calculators, monetization tools, podcast tools, and other creator workflows.

## Brand boundaries
- Do not put `YouTube` or `YT` into the company/brand identity.
- YouTube may be used descriptively for the YouTube tools category and relevant tool names where appropriate.
- Do not imply affiliation, sponsorship, ownership, or endorsement by YouTube or Google.
- Do not change the primary domain or brand casually; record any future change as an architecture/business decision.

## Technical consequences
Use these values as the production defaults:

```text
NEXT_PUBLIC_SITE_NAME=CreatorToolWorks
NEXT_PUBLIC_SITE_URL=https://creatortoolworks.com
```

Before public launch, also complete:
- favicon/logo/brand assets;
- legal/contact identity;
- Cloudflare custom-domain connection;
- Search Console property;
- analytics configuration when intentionally enabled;
- AdSense configuration only after approval/monetization rollout.

## Trademark/name note
The domain purchase confirms control of the domain, not formal trademark clearance. Avoid implying that domain registration itself grants trademark rights.
