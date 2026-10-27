"use client";

import React, { useEffect, useState } from "react";
import { Menu, Sparkles, User, ShieldCheck, Phone, Bot } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { PomodoroTimer } from "@/components/study/pomodoro-timer";
import { VoiceAgentModal } from "@/components/study/voice-agent-modal";
import { AgentCopilotModal } from "@/components/study/agent-copilot-modal";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onMobileMenuToggle, title, subtitle }: HeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    // Fetch profile and check API settings status
    api.auth.me()
      .then((data) => setProfile(data))
      .catch(() => {
        // Fallback demo profile
        setProfile({
          id: "demo",
          email: "pelajar@studycompanion.id",
          full_name: "Budi Pelajar",
          preferred_language: "id",
          preferred_difficulty: "intermediate",
          memory_enabled: true,
          created_at: new Date().toISOString(),
        });
      });

    api.settings.get()
      .then((res: any) => {
        setAiConnected(res.gutsai_api_key_configured);
      })
      .catch(() => {
        setAiConnected(false);
      });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200/70 bg-[#faf8f5]/80 px-4 md:px-8 backdrop-blur-md dark:border-stone-800 dark:bg-[#151413]/80">
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-3 md:mr-6">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 md:hidden dark:border-stone-800 dark:text-stone-400"
            aria-label="Buka Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Page Title & Breadcrumb */}
          <div className="min-w-0 overflow-hidden">
            <h1 className="text-sm md:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight truncate">
              {title || "AI Study Companion"}
            </h1>
            {subtitle && (
              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 hidden sm:block truncate max-w-sm md:max-w-md lg:max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-2.5">
          {/* Autonomous Co-Pilot Trigger Button */}
          <button
            onClick={() => setCopilotOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-stone-700 hover:bg-stone-100/80 transition dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-800"
            title="Buka Autonomous Study Co-Pilot"
          >
            <Bot className="h-3.5 w-3.5 text-stone-500" />
            <span>AI Co-Pilot</span>
          </button>

          {/* Voice Agent Call Trigger Button */}
          <button
            onClick={() => setVoiceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3 py-1.5 text-[11.5px] font-semibold text-indigo-700 hover:bg-indigo-100/70 transition dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
            title="Mulai Panggilan Telepon Suara dengan AI Tutor"
          >
            <Phone className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="hidden lg:inline">Telepon AI</span>
          </button>

          {/* Pomodoro Focus Timer */}
          <PomodoroTimer />

          {/* GutsAI Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                aiConnected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span>{aiConnected ? "GutsAI Ready" : "GutsAI Sandbox"}</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-stone-200/70 dark:border-stone-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold text-[11px]">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : "B"}
            </div>
            <span className="hidden 2xl:inline text-xs font-medium text-stone-700 dark:text-stone-300">
              {profile?.full_name || "Pelajar"}
            </span>
          </div>
        </div>
      </header>

      {/* Voice Agent Full-Duplex Modal */}
      <VoiceAgentModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        topic={title || "Materi Pembelajaran"}
      />

      {/* Autonomous Study Co-Pilot Modal */}
      <AgentCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </>
  );
}
