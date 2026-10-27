"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  Brain,
  RotateCcw,
  Award,
  Phone,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Zap,
  Flame,
  Clock,
  Compass,
  Star,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AuthModal } from "@/components/auth/auth-modal";

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("study_token");
      if (token) setIsLoggedIn(true);
    }
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 selection:bg-stone-200 dark:bg-[#141312] dark:text-stone-100 transition-colors">
      {/* 1. Public Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-[#faf8f5]/85 backdrop-blur-md dark:border-stone-800 dark:bg-[#141312]/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold shadow-xs dark:bg-stone-100 dark:text-stone-900">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-stone-900 dark:text-stone-100">
                EduApp
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:border-stone-800 dark:bg-stone-800 dark:text-stone-300">
                Ruang Belajar
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <a href="#fitur" className="hover:text-stone-900 dark:hover:text-white transition">
              Fitur Unggulan
            </a>
            <a href="#metode" className="hover:text-stone-900 dark:hover:text-white transition">
              Metode Belajar
            </a>
            <a href="#cara-kerja" className="hover:text-stone-900 dark:hover:text-white transition">
              Cara Kerja
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" className="rounded-2xl text-xs gap-1.5 bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 shadow-xs">
                  Buka Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth("login")}
                  className="rounded-2xl text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Masuk
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth("register")}
                  className="rounded-2xl text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                >
                  Mulai Gratis
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-stone-100/80 px-3.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Fokus Pemahaman Konseptual & Retensi Jangka Panjang</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.15]">
            Belajar Lebih Mendalam. <br />
            <span className="bg-gradient-to-r from-stone-900 via-stone-700 to-stone-500 bg-clip-text text-transparent dark:from-stone-100 dark:via-stone-300 dark:to-stone-500">
              Bukan Sekadar Menghafal.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Ruang belajar mandiri yang memandu pemahaman materi langkah demi langkah,
            memperkuat daya ingat lewat <span className="font-semibold text-stone-800 dark:text-stone-200">Spaced Repetition</span>,
            serta melatih kesiapan menghadapi ujian akademik dengan evaluasi terukur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            {/* Google Quick Sign-In */}
            <button
              onClick={() => openAuth("login")}
              className="flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border border-stone-300/80 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-stone-800 shadow-xs hover:bg-stone-50 hover:border-stone-400 transition dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            {/* Email Register CTA */}
            <Button
              size="lg"
              onClick={() => openAuth("register")}
              className="w-full sm:w-auto h-12 rounded-2xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 font-semibold text-xs sm:text-sm px-6 shadow-md gap-2"
            >
              Mulai Belajar Sekarang <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Guest Sandbox Link */}
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto h-12 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:text-stone-300 text-xs sm:text-sm font-semibold"
              >
                ⚡ Coba Demo Tamu
              </Button>
            </Link>
          </div>

          {/* Micro trust cues */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-[11px] font-medium text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Gratis & Open
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Database Cloud PostgreSQL
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Model AI Adaptif Tanpa Batas
            </span>
          </div>
        </div>

        {/* 3. Product Visual Interactive Showcase Card */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-7 shadow-2xl dark:border-stone-800 dark:bg-[#1a1918]">
            {/* Fake Browser Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-stone-800 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-3 text-[11px] font-medium text-stone-400">
                  app.studycompanion.id/tutor
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Zap className="h-3 w-3" /> Sesi AI Tutor Aktif
              </span>
            </div>

            {/* Showcase Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Box 1: Socratic Dialog */}
              <div className="md:col-span-2 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-900/40 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-bold">
                    AI
                  </div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Socratic Tutor
                  </span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  &ldquo;Daripada langsung menghafal rumus luas elips, bayangkan elips sebagai lingkaran yang diregangkan secara horizontal sebesar <code className="bg-stone-200/70 px-1 py-0.5 rounded text-[11px]">a</code> dan vertikal sebesar <code className="bg-stone-200/70 px-1 py-0.5 rounded text-[11px]">b</code>. Menurutmu, jika luas lingkaran adalah &pi;r&sup2;, berapa luasnya sekarang?&rdquo;
                </p>
                <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-2.5 text-[11.5px] text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300 font-medium">
                  💡 <strong>Pelajar:</strong> &ldquo;Apakah menjadi &pi; &times; a &times; b?&rdquo; &rarr; <strong>AI:</strong> &ldquo;Tepat sekali! Kamu baru saja membuktikan rumusnya sendiri.&rdquo;
                </div>
              </div>

              {/* Box 2: Spaced Repetition Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-[#faf8f5] p-4 dark:border-stone-800 dark:bg-stone-900/60">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 mb-2">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" /> SM-2 Flashcard
                    </span>
                    <span className="text-amber-600 font-bold">Jatuh Tempo Hari Ini</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Konsep &quot;Bayesian Knowledge Tracing&quot;
                  </h4>
                  <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                    Model probabilistik untuk menaksir probabilitas apakah pelajar telah benar-benar menguasai sub-topik.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between gap-1.5 border-t border-stone-200/60 dark:border-stone-800 mt-3">
                  <span className="text-[10px] rounded-lg bg-rose-100 px-2 py-1 font-bold text-rose-700">
                    Lupa
                  </span>
                  <span className="text-[10px] rounded-lg bg-amber-100 px-2 py-1 font-bold text-amber-700">
                    Ragu
                  </span>
                  <span className="text-[10px] rounded-lg bg-emerald-100 px-2 py-1 font-bold text-emerald-700">
                    Kuasai (5d)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Bento Grid */}
      <section id="fitur" className="py-16 sm:py-24 border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Fitur Lengkap
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Dirancang untuk Penguasaan Materi Nyata
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Kombinasi ilmu kognitif modern dan kecerdasan buatan untuk mempercepat kurva pemahamanmu.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <Bot className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                AI Socratic Tutor
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Tutor yang tidak sekadar memberi jawaban instan. AI menstimulasi logika berpikirmu melalui pertanyaan pemantik yang cerdas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <Phone className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Telepon Suara Interaktif
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Lakukan panggilan suara langsung dengan AI Tutor. Latih artikulasi, debat konsep, atau simulasi ujian lisan secara santai.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Spaced Repetition SM-2
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Algoritma pengingat memori otomatis. Materi yang sering kamu lupakan akan dijadwalkan lebih sering hingga menancap permanen.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Simulasi Ujian CAT
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Latihan ujian Computer Assisted Test dengan batas waktu ketat, kalkulasi passing grade, dan pembahasan kelemahan materi seketika.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Bedah Modul & Catatan PDF
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Unggah buku teks atau slide kuliah. AI akan membaca, merangkum poin kritis, dan otomatis membuat kuis pemahaman materi.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-[#1a1918] space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200">
                <Flame className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Gamifikasi & Streak Belajar
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Kumpulkan XP, naikkan level, raih lencana pencapaian, dan pertahankan kobaran api konsistensi belajar harianmu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How it Works (3 Steps) */}
      <section id="cara-kerja" className="py-16 sm:py-24 bg-stone-100/60 dark:bg-[#181716]/60 border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Langkah Sederhana
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Cara Memulai dalam 3 Langkah
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold text-lg dark:bg-stone-100 dark:text-stone-900">
                1
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Pilih atau Unggah Materi
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Mulai dengan topik yang sedang dipelajari di kampus/sekolah, atau unggah slide modul langsung.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold text-lg dark:bg-stone-100 dark:text-stone-900">
                2
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Eksplorasi Bersama AI Tutor
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Tanyakan bagian sulit, lakukan tanya jawab via teks atau suara, dan uji pemahaman dengan kuis instan.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold text-lg dark:bg-stone-100 dark:text-stone-900">
                3
              </div>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Kuasai Secara Permanen
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Sistem Spaced Repetition otomatis menjadwalkan review kartu agar materi tetap segar di memori jangka panjang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom Call to Action Banner */}
      <section className="py-20 border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100">
            Siap Mengubah Cara Belajarmu?
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto">
            Bergabunglah sekarang. Nikmati pengalaman belajar privat berbantuan AI yang benar-benar memahami kebutuhan akademikmu.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => openAuth("register")}
              className="h-12 rounded-2xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs sm:text-sm px-8 shadow-md gap-2"
            >
              Mulai Belajar Gratis <ArrowRight className="h-4 w-4" />
            </Button>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-2xl border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 text-xs sm:text-sm font-semibold"
              >
                Masuk ke Dashboard Tamu &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-stone-200/80 py-8 text-center text-xs text-stone-500 dark:border-stone-800/80 dark:text-stone-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">AI Study Companion</span>
            <span>&copy; {new Date().getFullYear()} Beliaja Edu. Seluruh hak cipta dilindungi.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-stone-900 dark:hover:text-stone-100">
              Dashboard
            </Link>
            <Link href="/tutor" className="hover:text-stone-900 dark:hover:text-stone-100">
              AI Tutor
            </Link>
            <Link href="/settings" className="hover:text-stone-900 dark:hover:text-stone-100">
              Pengaturan
            </Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Google & Email) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          setIsLoggedIn(true);
          window.location.href = "/dashboard";
        }}
      />
    </div>
  );
}
