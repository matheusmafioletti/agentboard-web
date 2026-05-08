import type { WorkItem } from "../../services/boardApi";
import WorkItemTypeGlyph from "./WorkItemTypeGlyph";
import { WORK_ITEM_TYPE_CHROMA, WORK_ITEM_TYPE_LABEL } from "./workItemTypeTokens";

interface WorkItemTypeBadgeProps {
  type: WorkItem["type"];
  size?: "default" | "compact";
  className?: string;
}

export default function WorkItemTypeBadge({
  type,
  size = "default",
  className = "",
}: WorkItemTypeBadgeProps) {
  const pad = size === "compact" ? "px-1.5 py-0.5 gap-1" : "px-2 py-0.5 gap-1.5";
  return (
    <span
      data-work-item-type-badge={type}
      className={[
        "inline-flex items-center rounded-full font-medium",
        size === "compact" ? "text-[10px]" : "text-[11px]",
        WORK_ITEM_TYPE_CHROMA[type],
        pad,
        className,
      ].join(" ")}
    >
      <WorkItemTypeGlyph type={type} sizePx={size === "compact" ? 14 : 14} />
      {WORK_ITEM_TYPE_LABEL[type]}
    </span>
  );
}
