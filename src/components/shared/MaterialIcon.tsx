export interface MaterialIconProps {
  /** Material SymbolsOutlined ligature name, e.g. "edit", "visibility", "open_in_full". */
  name: string;
  /** Tailwind classes; inherit text color via `text-*` from parent unless overridden. */
  className?: string;
  iconSizePx?: number;
}

/**
 * Outline Material Symbols (Google Fonts). Load `family=Material+Symbols+Outlined`
 * with FILL 0 in index.css — see `.material-symbols-outlined`.
 */
export default function MaterialIcon({
  name,
  className = "",
  iconSizePx = 20,
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontSize: iconSizePx, lineHeight: 1 }}
      aria-hidden
    >
      {name}
    </span>
  );
}
