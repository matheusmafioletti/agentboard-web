import type { FeatureCardSummary } from "../../api/board";

interface FeatureCardProps {
  card: FeatureCardSummary;
  onClick: (card: FeatureCardSummary) => void;
}

/** A Kanban card tile showing title, task progress, and re-execution badge. */
export default function FeatureCard({ card, onClick }: FeatureCardProps) {
  const hasProgress = card.taskCount > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(card)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 break-words flex-1">
          {card.title}
        </span>
        {card.reExecutionPending && (
          <span className="flex-shrink-0 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
            ↻
          </span>
        )}
      </div>

      {hasProgress && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">
              {card.completedTaskCount}/{card.taskCount} tasks
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.round((card.completedTaskCount / card.taskCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
