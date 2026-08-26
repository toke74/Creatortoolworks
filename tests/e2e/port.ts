// Shared between playwright.config.ts and global-setup.ts so both agree on the
// same dedicated, non-default port (see playwright.config.ts for why 3000 is
// avoided) without duplicating the fallback logic.
export const PORT = process.env.PLAYWRIGHT_PORT ?? "3417";
export const BASE_URL = `http://127.0.0.1:${PORT}`;
