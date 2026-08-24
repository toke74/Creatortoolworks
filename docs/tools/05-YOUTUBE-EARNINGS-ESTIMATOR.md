# Tool Specification — YouTube Earnings Estimator

**Status:** MVP approved for build  
**Last reviewed:** 2026-08-19

## User problem
Creators want a transparent scenario estimate for potential revenue based on views and RPM assumptions.

## URL
`/youtube-tools/youtube-earnings-estimator`

## Inputs
- Views.
- RPM assumption or low/base/high RPM range.
- Currency display choice (presentation only unless FX data is explicitly added later).

## Outputs
- Low/base/high estimated revenue.
- Formula shown clearly.
- Assumption summary.

## Formula
For an RPM scenario:
`estimated revenue = (views / 1000) × RPM`

## Critical disclaimer
This is a mathematical scenario tool, not an official YouTube earnings forecast. Actual revenue varies with monetized playbacks, geography, ad demand, content, seasonality, revenue sources, YouTube policies, and other factors. Do not publish unsupported “average RPM” values as defaults without a maintained source and context.

## Default behavior
Prefer asking users for their own RPM or giving editable example values clearly labeled examples—not authoritative benchmarks.

## Privacy
No account/channel data required.

## Tests
- zero views;
- decimal RPM;
- very large view counts;
- low > high invalid range;
- formatting/rounding;
- locale-safe number input handling.
