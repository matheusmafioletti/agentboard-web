import { useSidebarState } from "../../hooks/useSidebarState";
import NavItem from "./NavItem";
import ProfileButton from "./ProfileButton";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-5h-4v5H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="4" height="8" rx="1.5" />
    </svg>
  );
}

function ItemsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PanelLeftCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m15 9-3 3 3 3" />
    </svg>
  );
}

function PanelLeftOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m12 9 3 3-3 3" />
    </svg>
  );
}

const NAV_ITEMS = [
  { icon: <HomeIcon />, label: "Início", to: "/inicio" },
  { icon: <BoardIcon />, label: "Board", to: "/board" },
  { icon: <ItemsIcon />, label: "Itens", to: "/itens" },
  { icon: <ProjectsIcon />, label: "Projetos", to: "/projetos" },
];

/** Collapsible left sidebar with frosted glass surface, navigation items, and pinned profile button. */
export default function AppSidebar() {
  const { expanded, toggle } = useSidebarState();

  return (
    <aside
      style={{ width: expanded ? 220 : 64 }}
      className={[
        "relative z-30 shrink-0 flex flex-col h-full border-r transition-[width] duration-[220ms]",
        "ease-[cubic-bezier(0.4,0,0.2,1)]",
        "bg-white/80 dark:bg-[#0A0A0F]/70",
        "backdrop-blur-xl",
        "border-black/[0.08] dark:border-white/[0.08]",
      ].join(" ")}
    >
      {/* Sidebar toggle */}
      <div className={["flex items-center px-3 pt-3 pb-1", expanded ? "justify-end" : "justify-center"].join(" ")}>
        <button
          onClick={toggle}
          aria-label={expanded ? "Recolher menu" : "Expandir menu"}
          title={expanded ? "Recolher menu" : "Expandir menu"}
          className="p-1.5 rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          {expanded ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
            expanded={expanded}
          />
        ))}
      </nav>

      {/* Profile button */}
      <div className={["px-2 pb-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]"].join(" ")}>
        <ProfileButton expanded={expanded} />
      </div>
    </aside>
  );
}
