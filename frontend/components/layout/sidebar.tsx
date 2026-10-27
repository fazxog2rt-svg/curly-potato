"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FileText,
  BookOpen,
  Award,
  RotateCcw,
  CalendarCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Network,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  dueReviewsCount?: number;
}

export function Sidebar({ isMobileOpen = false, onMobileClose, dueReviewsCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Tutor Belajar", href: "/tutor", icon: Bot },
    { name: "Peta Konsep", href: "/knowledge-graph", icon: Network },
    { name: "Materi Belajar", href: "/materials", icon: FileText },
    { name: "Catatan", href: "/notes", icon: BookOpen },
    { name: "Latihan & Kuis", href: "/quiz", icon: Award },
    {
      name: "Review Berkala",
      href: "/review",
      icon: RotateCcw,
      badge: dueReviewsCount > 0 ? dueReviewsCount : undefined,
    },
    { name: "Rencana Belajar", href: "/planner", icon: CalendarCheck },
    { name: "Progres Belajar", href: "/analytics", icon: BarChart3 },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900",
          collapsed ? "w-20" : "w-64",
          // Mobile state
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-stone-200/70 dark:border-stone-800">
          <a
            href="/"
            className={cn("flex items-center gap-2.5 transition-opacity hover:opacity-90", collapsed && "justify-center w-full")}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs">
              <BookOpen className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[13px] font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  EduApp
                </span>
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
                  Ruang Belajar Digital
                </span>
              </div>
            )}
          </a>

          {/* Collapse Toggle on Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
            title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-2xs font-semibold"
                    : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-200",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-stone-50 dark:text-stone-900"
                      : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200"
                  )}
                />

                {!collapsed && (
                  <span className="ml-2.5 truncate flex-1">{item.name}</span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer info box */}
        {!collapsed && (
          <div className="p-3 border-t border-stone-200/70 dark:border-stone-800">
            <div className="rounded-xl bg-stone-100/80 p-2.5 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11.5px] font-medium text-stone-700 dark:text-stone-300">
                  Sistem Aktif
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400">v1.2</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
