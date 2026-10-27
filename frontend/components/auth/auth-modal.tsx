"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (mode === "register") {
        if (!fullName.trim()) {
          setError("Nama lengkap wajib diisi.");
          setLoading(false);
          return;
        }
        res = await api.auth.register({
          email,
          password,
          full_name: fullName,
        });
      } else {
        res = await api.auth.login({
          email,
          password,
        });
      }

      if (res?.access_token) {
        localStorage.setItem("study_token", res.access_token);
        localStorage.setItem("study_user", JSON.stringify(res.user));
        if (onSuccess) onSuccess();
        else window.location.href = "/dashboard";
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      // Fast 1-click Google OAuth authentication
      // In production, Google Client ID token is passed here
      const res = await api.auth.googleAuth({
        email: email || "pelajar.google@studycompanion.id",
        full_name: fullName || "Pelajar Teladan",
      });

      if (res?.access_token) {
        localStorage.setItem("study_token", res.access_token);
        localStorage.setItem("study_user", JSON.stringify(res.user));
        if (onSuccess) onSuccess();
        else window.location.href = "/dashboard";
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Gagal masuk dengan Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    // 1-Click Guest Exploration Mode
    localStorage.removeItem("study_token");
    window.location.href = "/dashboard";
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-2xl dark:border-stone-800 dark:bg-[#1a1918]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand & Heading */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 font-bold shadow-xs dark:bg-stone-100 dark:text-stone-900 mb-3">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {mode === "login" ? "Selamat Datang Kembali" : "Mulai Perjalanan Belajarmu"}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {mode === "login"
              ? "Masuk untuk melanjutkan riwayat dan target belajar"
              : "Daftar gratis untuk akses AI Tutor & Spaced Repetition"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="mt-5 space-y-3">
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 hover:border-stone-300 transition dark:border-stone-700 dark:bg-stone-850 dark:text-stone-200 dark:hover:bg-stone-800"
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

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-stone-200/70 dark:border-stone-800" />
            <span className="relative bg-white px-3 text-[10.5px] font-medium uppercase tracking-wider text-stone-400 dark:bg-[#1a1918]">
              atau email
            </span>
            <div className="w-full border-t border-stone-200/70 dark:border-stone-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelajar@email.com"
                  className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/60 pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-hidden dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-100"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-10 rounded-2xl bg-stone-900 text-stone-50 font-semibold text-xs hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 shadow-xs gap-1.5"
            >
              {mode === "login" ? "Masuk ke Akun" : "Daftar Sekarang"}{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition"
            >
              {mode === "login" ? (
                <>
                  Belum punya akun?{" "}
                  <span className="font-semibold underline">Daftar di sini</span>
                </>
              ) : (
                <>
                  Sudah punya akun?{" "}
                  <span className="font-semibold underline">Masuk sekarang</span>
                </>
              )}
            </button>
          </div>

          {/* 1-Click Guest Mode Shortcut */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 text-center">
            <button
              onClick={handleGuestDemo}
              className="text-[11px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition"
            >
              ⚡ Eksplorasi Demo Langsung (Tanpa Login)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
