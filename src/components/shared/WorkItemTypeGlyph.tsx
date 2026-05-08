import type { WorkItemTypeKey } from "./workItemTypeTokens";

interface WorkItemTypeGlyphProps {
  type: WorkItemTypeKey;
  /** Pixel width/height of the SVG; default 14 */
  sizePx?: number;
  className?: string;
}

export default function WorkItemTypeGlyph({
  type,
  sizePx = 14,
  className = "shrink-0",
}: WorkItemTypeGlyphProps) {
  const common = { fill: "none" as const, stroke: "currentColor" as const, strokeWidth: 1.5 };
  const dim = { width: sizePx, height: sizePx };

  if (type === "FEATURE") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={className} {...dim}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...common} />
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...common} />
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...common} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...common} />
      </svg>
    );
  }

  if (type === "USER_STORY") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className={className} {...dim}>
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          {...common}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="9" y="3" width="6" height="4" rx="1" {...common} />
        <path d="M9 12h6M9 16h4" {...common} strokeLinecap="round" />
      </svg>
    );
  }

  // TASK
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} {...dim}>
      <path
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
        {...common}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
