import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { siteConfig } from "@/lib/seo/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="site-container flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] py-1 font-semibold tracking-tight text-[var(--text)] transition hover:opacity-80"
        >
          <LogoMark size={30} />
          <span className="text-[1.05rem]">{siteConfig.name}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/youtube-tools"
            className="rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          >
            YouTube tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
