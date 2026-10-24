"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { api } from "@/lib/api";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [dueReviews, setDueReviews] = useState(0);

  useEffect(() => {
    // Check due reviews count for badge
    api.reviews.due()
      .then((data: any[]) => {
        if (Array.isArray(data)) setDueReviews(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#090d16]">
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        dueReviewsCount={dueReviews}
      />

      <div className="flex flex-col md:pl-64 transition-all duration-300">
        <Header
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
