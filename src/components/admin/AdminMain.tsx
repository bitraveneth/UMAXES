"use client";

import type { ReactNode } from "react";
import { useAdminSidebar } from "./AdminSidebarContext";

export function AdminMain({ children }: { children: ReactNode }) {
  const { isExpanded } = useAdminSidebar();

  return (
    <div
      className={`min-h-dvh transition-[margin] duration-300 ${
        isExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]"
      }`}
    >
      {children}
    </div>
  );
}
