import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { siteConfig } from "@/lib/seo/site";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

/**
 * Only real, existing routes are linked here. As categories, guides, and
 * legal pages ship, add them as new sections/links rather than inventing
 * destinations ahead of time.
 */
const footerSections: FooterSection[] = [
  {
    title: "Tools",
    links: [{ label: "YouTube tools", href: "/youtube-tools" }],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="site-container grid gap-10 py-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-[var(--text)]">
            <LogoMark size={26} />
            <span>{siteConfig.name}</span>
          </Link>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{siteConfig.tagline} Free, browser-based utilities — no signup required.</p>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="site-container flex flex-col gap-2 py-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Built for creators.
          </p>
          <p>Practical tools for creators.</p>
        </div>
      </div>
    </footer>
  );
}
