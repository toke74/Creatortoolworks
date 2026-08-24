import type { ToolCategory } from "@/lib/tools/types";

interface ToolIconProps {
  category: ToolCategory;
  className?: string;
}

/**
 * Lightweight geometric glyph per tool category so the catalog stays
 * visually scannable as it grows toward 100-300 tools.
 */
function IconPaths({ category }: { category: ToolCategory }) {
  switch (category) {
    case "thumbnail":
      return (
        <>
          <rect x="4" y="6" width="16" height="12" rx="2.5" />
          <circle cx="9" cy="11" r="1.6" />
          <path d="M4 15.5l4-3.5 3 2.5 3.5-4 5.5 6" strokeLinejoin="round" />
        </>
      );
    case "titles":
      return (
        <>
          <path d="M5 6h14" strokeLinecap="round" />
          <path d="M5 11h14" strokeLinecap="round" />
          <path d="M5 16h8" strokeLinecap="round" />
        </>
      );
    case "descriptions":
      return (
        <>
          <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
          <path d="M8 9h8M8 12.5h8M8 16h5" strokeLinecap="round" />
        </>
      );
    case "timestamps":
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "chapters":
      return (
        <>
          <path d="M5 5h11l3 3.5-3 3.5H5z" strokeLinejoin="round" />
          <path d="M5 15.5h9" strokeLinecap="round" />
        </>
      );
    case "monetization":
      return (
        <>
          <circle cx="12" cy="12" r="7.5" />
          <path d="M12 7.5v9M14.5 9.75c0-1.24-1.12-2.25-2.5-2.25s-2.5 1.01-2.5 2.25 1.12 1.75 2.5 2 2.5.76 2.5 2-1.12 2-2.5 2-2.5-.6-2.5-1.75" strokeLinecap="round" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="7.5" />;
  }
}

export function ToolIcon({ category, className }: ToolIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[var(--accent)] ${className ?? "h-10 w-10"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" strokeWidth="1.6">
        <IconPaths category={category} />
      </svg>
    </span>
  );
}
