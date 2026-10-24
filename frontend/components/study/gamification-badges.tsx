"use client";

import React, { useState } from "react";
import { Flame, Award, Zap, BookOpen, Target, Sparkles, CheckCircle2, Lock } from "lucide-react";
import confetti from "canvas-confetti";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  xp: number;
}

interface GamificationBadgesProps {
  studyMinutes?: number;
  quizCount?: number;
  avgScore?: number;
  cardsReviewed?: number;
}

export function GamificationBadges({
  studyMinutes = 0,
  quizCount = 0,
  avgScore = 0,
  cardsReviewed = 0,
}: GamificationBadgesProps) {
  const [streakDays, setStreakDays] = useState(3); // Demo baseline streak

  // Calculate dynamic badges based on real analytics
  const badges: BadgeItem[] = [
    {
      id: "streak_starter",
      name: "Kobaran Semangat",
      description: "Belajar 3 hari berturut-turut",
      icon: "🔥",
      unlocked: streakDays >= 3,
      xp: 150,
    },
    {
      id: "first_quiz",
      name: "Penguji Nyali",
      description: "Menyelesaikan kuis evaluasi pertama",
      icon: "🎯",
      unlocked: quizCount >= 1,
      xp: 100,
    },
    {
      id: "quiz_master",
      name: "Otak Cemerlang",
      description: "Mencapai rata-rata kuis di atas 80%",
      icon: "🏆",
      unlocked: avgScore >= 80 && quizCount >= 1,
      xp: 250,
    },
    {
      id: "focus_guru",
      name: "Ksatria Fokus",
      description: "Mencapai total belajar minimal 30 menit",
      icon: "⏱️",
      unlocked: studyMinutes >= 30,
      xp: 200,
    },
    {
      id: "memory_master",
      name: "Memori Gajah",
      description: "Melakukan pengulangan review berkala SM-2",
      icon: "🧠",
      unlocked: cardsReviewed >= 1,
      xp: 150,
    },
    {
      id: "scholar",
      name: "Cendekiawan AI",
      description: "Mempelajari lebih dari 3 materi dokumen",
      icon: "📜",
      unlocked: studyMinutes >= 60,
      xp: 300,
    },
  ];

  const totalXP = badges
    .filter((b) => b.unlocked)
    .reduce((acc, curr) => acc + curr.xp, 100);

  const level = Math.floor(totalXP / 250) + 1;
  const nextLevelXP = level * 250;
  const progressPercent = Math.min(Math.round(((totalXP % 250) / 250) * 100), 100);

  const handleCelebrateBadge = (badge: BadgeItem) => {
    if (badge.unlocked) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
      {/* Level & Streak Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-extrabold text-lg shadow-sm">
            Lv.{level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Pelajar Berdedikasi
              </h4>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10.5px]">
                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" /> {streakDays} Hari Beruntun
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalXP} XP terkumpul • {nextLevelXP - totalXP} XP menuju Level {level + 1}
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full sm:w-48">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>Kemajuan Level</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lencana Prestasi Pembelajaran
          </h5>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
            {badges.filter((b) => b.unlocked).length} dari {badges.length} Diraih
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => handleCelebrateBadge(badge)}
              className={`group flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer ${
                badge.unlocked
                  ? "bg-slate-50/80 border-slate-200/90 hover:border-amber-300 hover:shadow-xs dark:bg-slate-850 dark:border-slate-800"
                  : "bg-slate-50/30 border-slate-200/40 opacity-50 dark:bg-slate-900/50 dark:border-slate-800/40"
              }`}
            >
              <div className="relative text-2xl mb-1.5 transition-transform group-hover:scale-110">
                {badge.icon}
                {!badge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <Lock className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              <h6 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {badge.name}
              </h6>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                {badge.description}
              </p>
              <span className="mt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                +{badge.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
