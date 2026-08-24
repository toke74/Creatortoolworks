import Link from "next/link";
import { ToolIcon } from "@/components/tool/tool-icon";
import type { ToolDefinition } from "@/lib/tools/types";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      href={`/youtube-tools/${tool.slug}`}
      className="card group block p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_8px_24px_-12px_rgba(109,74,255,0.35)] focus-visible:-translate-y-0.5"
    >
      <ToolIcon category={tool.category} />
      <h3 className="mt-4 font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{tool.summary}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
        Open tool
        <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
