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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 md:hidden dark:border-slate-700 dark:text-slate-400"
            aria-label="Buka Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page Title & Breadcrumb */}
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              {title || "AI Study Companion"}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Autonomous Co-Pilot Trigger Button */}
          <button
            onClick={() => setCopilotOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
            title="Buka Autonomous Study Co-Pilot"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>AI Co-Pilot</span>
          </button>

          {/* Voice Agent Call Trigger Button */}
          <button
            onClick={() => setVoiceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300"
            title="Mulai Panggilan Telepon Suara dengan AI Tutor"
          >
            <Phone className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="hidden md:inline">Telepon AI</span>
          </button>

          {/* Pomodoro Focus Timer */}
          <PomodoroTimer />

          {/* GutsAI Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <span
              className={`h-2 w-2 rounded-full ${
                aiConnected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
            <span>{aiConnected ? "GutsAI Ready" : "GutsAI Sandbox"}</span>
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 font-semibold text-xs">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : "B"}
            </div>
            <span className="hidden xl:inline text-xs font-medium text-slate-700 dark:text-slate-300">
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
