# Security and Privacy Standard

## Data minimization
Collect the minimum data required to run a tool. For the first six tools, no account or server-side storage is needed.

## File upload rule
Thumbnail/image tools process files locally in the browser by default.
- Do not upload the image to the server.
- Do not persist the file.
- Revoke object URLs when no longer needed.
- Validate type/size before expensive processing.
- Treat browser-reported MIME/type as untrusted for security-sensitive logic.

## User text
Descriptions/titles/timestamps are not logged in analytics. Avoid server logging raw user inputs if future server processing is introduced.

## Secrets
- No secrets in browser bundles.
- No secrets in git history.
- Provide `.env.example` without real values.
- Rotate leaked credentials immediately.

## Dependencies
Before adding a package, ask:
1. Can native browser/TypeScript functionality solve it simply?
2. Is the package maintained?
3. What permissions/data/network behavior does it introduce?
4. Does it materially increase bundle size?

## Content security
When rendering user text, treat it as text by default. Avoid raw HTML injection. Sanitize any future rich-text/HTML feature with a reviewed approach.

## Privacy/legal pages
Before monetization launch, publish and review:
- Privacy Policy;
- Terms of Use;
- Cookie/consent disclosures as applicable;
- Contact/About identity information appropriate to the business.

Legal text should receive jurisdiction-appropriate review; AI-generated legal boilerplate is not treated as final legal advice.
