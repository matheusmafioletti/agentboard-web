interface SummaryCardProps {
  label: string;
  count: number;
  emptyText?: string;
  icon?: React.ReactNode;
}

/** Simple metric card — kept for backward compatibility. */
export default function SummaryCard({ label, count, emptyText, icon }: SummaryCardProps) {
  return (
    <div className="rounded-card bg-white dark:bg-[#141418] border border-black/[0.08] dark:border-white/[0.08] shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#8E8E93]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-caps">{label}</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93]">{emptyText}</p>
      ) : (
        <p className="text-[32px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-none">{count}</p>
      )}
    </div>
  );
}
