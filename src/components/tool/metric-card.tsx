export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-3.5">
      <dt className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-[var(--text)]">{value}</dd>
    </div>
  );
}
