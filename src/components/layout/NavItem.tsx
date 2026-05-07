import { NavLink } from "react-router-dom";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  expanded: boolean;
}

/** A single sidebar navigation entry with icon and optional label. */
export default function NavItem({ icon, label, to, expanded }: NavItemProps) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2.5 rounded-chip text-sm transition-colors duration-150",
          isActive
            ? "bg-accent/10 text-accent font-medium dark:bg-accent/[0.15] dark:text-accent-300"
            : "text-[#6E6E73] dark:text-[#8E8E93] font-normal hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]",
          expanded ? "w-full" : "justify-center w-10",
        ].join(" ")
      }
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
      {expanded && <span className="truncate">{label}</span>}
    </NavLink>
  );
}
