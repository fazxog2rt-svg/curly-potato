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
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Tutor", href: "/tutor", icon: Bot, isHighlight: true },
    { name: "Peta Konsep", href: "/knowledge-graph", icon: Network },
    { name: "My Materials", href: "/materials", icon: FileText },
    { name: "Catatan", href: "/notes", icon: BookOpen },
    { name: "Quiz Center", href: "/quiz", icon: Award },
    {
      name: "Smart Review",
      href: "/review",
      icon: RotateCcw,
      badge: dueReviewsCount > 0 ? dueReviewsCount : undefined,
    },
    { name: "Study Planner", href: "/planner", icon: CalendarCheck },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
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
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <a
            href="/"
            className={cn("flex items-center gap-3 transition-opacity", collapsed && "justify-center w-full")}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <BrainCircuit className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  Study Companion
                </span>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  GutsAI Educational Gateway
                </span>
              </div>
            )}
          </a>

          {/* Collapse Toggle on Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:hover:bg-slate-800"
            title={collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                    item.isHighlight && !isActive && "text-indigo-500"
                  )}
                />

                {!collapsed && (
                  <span className="ml-3 truncate flex-1">{item.name}</span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                    {item.badge}
                  </span>
                )}

                {item.isHighlight && !collapsed && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-3 w-3" />
                    AI
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer info box */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  GutsAI Connected
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Unified AI tutor & assessment gateway.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
