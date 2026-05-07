interface SummaryCardProps {
  label: string;
  count: number;
  emptyText: string;
  icon: React.ReactNode;
}

/** A dashboard card showing a numeric count and an empty-state message when zero. */
export default function SummaryCard({ label, count, emptyText, icon }: SummaryCardProps) {
  return (
    <article className="bg-white dark:bg-[#1C1C1E] rounded-card shadow-card p-5 flex items-start gap-4">
      <div className="shrink-0 w-10 h-10 rounded-chip bg-accent/[0.12] dark:bg-accent/[0.18] text-accent flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-heading">{count}</p>
        <p className="text-sm font-medium text-[#6E6E73] dark:text-[#8E8E93]">{label}</p>
        {count === 0 && (
          <p className="text-xs text-[#6E6E73]/60 dark:text-[#8E8E93]/60 mt-1">{emptyText}</p>
        )}
      </div>
    </article>
  );
}
