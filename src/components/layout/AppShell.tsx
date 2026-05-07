import AppSidebar from "./AppSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

/** Full-height layout wrapper: sidebar on the left, page content on the right. */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7] dark:bg-[#0A0A0F]">
      <AppSidebar />
      <main className="relative z-0 min-w-0 flex-1 overflow-auto animate-page-enter">{children}</main>
    </div>
  );
}
