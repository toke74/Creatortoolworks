# Launch Checklist

Use this for each tool and for major template changes.

## Product
- [ ] Tool solves the specified user task.
- [ ] Output is understandable without guessing.
- [ ] Empty/invalid/error states are complete.
- [ ] Copy/download/reset actions behave correctly.
- [ ] Mobile layout tested.
- [ ] Desktop layout tested.

## Accuracy
- [ ] Calculation/parser unit tests pass.
- [ ] Changeable YouTube facts verified against official source.
- [ ] Source `verifiedAt` updated if relevant.
- [ ] Estimate/score methodology and limitations are visible.
- [ ] No guaranteed ranking/revenue claims.

## SEO/content
- [ ] Unique H1/title/meta description.
- [ ] Correct canonical URL.
- [ ] Page is not a near-duplicate of an existing tool.
- [ ] Helpful original instructions/examples are present where needed.
- [ ] Related tools are genuinely relevant.
- [ ] Sitemap/indexing state correct.

## Accessibility/UX
- [ ] Inputs have labels.
- [ ] Keyboard flow works.
- [ ] Focus states visible.
- [ ] Errors are not communicated by color alone.
- [ ] Touch controls are usable.

## Privacy/security
- [ ] No secrets exposed.
- [ ] Raw user input is not sent to analytics.
- [ ] Local-file tools do not upload files unless explicitly specified.
- [ ] New dependencies reviewed.

## Monetization
- [ ] If ads are enabled, placement uses approved shared slot.
- [ ] Ads do not resemble or crowd tool controls.
- [ ] No layout shift likely to cause accidental taps/clicks.
- [ ] Consent/privacy behavior tested where applicable.

## Engineering
- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Unit/component tests pass.
- [ ] Production build passes.
- [ ] Relevant E2E smoke test passes.
- [ ] No production console errors in smoke test.

## Release
- [ ] Human reviewer approves.
- [ ] Production smoke test after deployment passes.
- [ ] Analytics receives expected events without sensitive payloads.
