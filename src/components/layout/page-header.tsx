export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--text)]">{title}</h1>
      {description ? <p className="mt-4 max-w-2xl leading-7 text-[var(--text-muted)]">{description}</p> : null}
    </div>
  );
}
