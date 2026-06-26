"use client";

import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { UserRole } from "@/lib/roles";

/**
 * Client shell holding the desktop sidebar collapsed/expanded state (persisted
 * to localStorage). The header's toggle controls it on desktop; the mobile
 * hamburger uses a separate drawer.
 */
export function AppShell({
  role,
  name,
  telegramLinked,
  children,
}: {
  role: UserRole;
  name: string;
  telegramLinked: boolean;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // One-time read of the persisted preference after mount. Done in an effect
    // (not a lazy initializer) so SSR and first client render agree and there's
    // no hydration mismatch on the sidebar width.
    const saved = localStorage.getItem("sidebar-open");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setSidebarOpen(saved === "true");
  }, []);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      localStorage.setItem("sidebar-open", String(!prev));
      return !prev;
    });
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={role} open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={name} role={role} telegramLinked={telegramLinked} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
