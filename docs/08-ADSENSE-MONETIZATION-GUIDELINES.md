# AdSense and Monetization Guidelines

## Objective
Monetize without creating deceptive navigation, accidental clicks, unstable layouts, or an experience where advertising interferes with the utility.

## Official policy references
- AdSense Program policies: https://support.google.com/adsense/answer/48182?hl=en
- Ad placement policies: https://support.google.com/adsense/answer/1346295?hl=en
- Required privacy-policy content: https://support.google.com/adsense/answer/1348695?hl=en
- Cookie disclosure: https://support.google.com/adsense/answer/7549925?hl=en
- Privacy & messaging: https://support.google.com/adsense/answer/10924669?hl=en
- Invalid traffic prevention: https://support.google.com/adsense/answer/1112983?hl=en

Re-read the live policies before first ad integration and after meaningful policy/product changes.

## Hard implementation rules
- All AdSense code is owned by a small central monetization module.
- Tool feature code may request a named slot; it does not inject arbitrary scripts.
- Ads are never inside a primary input control or result panel.
- Keep adequate visual/interaction distance from buttons, upload/drop zones, copy controls, sliders, and navigation.
- Do not label ads as “Resources,” “Downloads,” “Recommended tools,” etc.
- Never instruct or imply that users should click ads to support the site.
- Do not animate or visually point at ads.
- Do not style surrounding content to mimic ads.
- Do not refresh pages/elements to create additional ad impressions.
- Test mobile layouts where accidental taps are most plausible.

## Layout policy
Approved slot names can include, after review:
- `content_top` — below introductory context, not adjacent to primary action;
- `content_mid` — between explanatory sections;
- `content_bottom` — after meaningful content/related tools boundary;
- optional desktop rail only where it does not crowd the tool.

Actual placement is approved by human review and may differ by template.

## CLS and accidental-click prevention
Reserve predictable ad space where practical. A late-loading ad must not move a button under the user’s pointer/touch target.

## Consent/privacy
Before personalized advertising is enabled where consent is required:
- implement an appropriate consent solution;
- provide privacy/cookie disclosures;
- make consent state available to relevant tags;
- test accept/reject flows.

Legal compliance varies by geography. This document is an engineering policy, not legal advice.

## Traffic quality
Do not purchase or incentivize traffic in a way intended to manufacture ad impressions/clicks. Monitor unusual traffic sources, bots, and abrupt CTR anomalies.

## Earnings reporting
Internal dashboards should distinguish product usage from advertising metrics. Never change product UX solely to maximize ad clicks.
