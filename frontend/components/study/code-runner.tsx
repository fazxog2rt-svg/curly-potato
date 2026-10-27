"use client";

import React, { useState } from "react";
import { Play, Copy, Check, Terminal, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface CodeRunnerProps {
  language: string;
  code: string;
  className?: string;
}

export function CodeRunner({ language, code, className = "" }: CodeRunnerProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [stderr, setStderr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const cleanLang = language.toLowerCase().replace(/^(language-|lang-)/, "").trim() || "python";

  const handleRun = async () => {
    setLoading(true);
    setOutput(null);
    setStderr(null);
    setHasRun(true);

    try {
      const res = await api.tools.executeCode(cleanLang, code);
      setOutput(res.stdout);
      setStderr(res.stderr);
    } catch (err: any) {
      setStderr(err?.message || "Gagal menjalankan kode pada sandbox.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-800 bg-[#151413] text-stone-100 shadow-md my-3 ${className}`}>
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone-800/80 bg-stone-900/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <span className="font-mono font-semibold text-[11px] uppercase tracking-wider text-stone-400">
            {cleanLang}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="rounded-lg px-2 py-1 text-[11px] text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition flex items-center gap-1"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Tersalin" : "Salin"}</span>
          </button>

          <Button
            size="sm"
            onClick={handleRun}
            isLoading={loading}
            className="h-6 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] gap-1 shadow-xs"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Jalankan</span>
          </Button>
        </div>
      </div>

      {/* Code Block Content */}
      <pre className="p-3.5 font-mono text-xs overflow-x-auto text-stone-200 leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>

      {/* Terminal Output */}
      {hasRun && (
        <div className="border-t border-stone-800 bg-black/60 p-3 text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px] text-stone-500">
            <span className="flex items-center gap-1 font-semibold">
              <Terminal className="h-3 w-3" /> Terminal Output (Piston API Sandbox):
            </span>
            <button
              onClick={() => {
                setHasRun(false);
                setOutput(null);
                setStderr(null);
              }}
              className="hover:text-stone-300"
            >
              Tutup
            </button>
          </div>

          {loading && (
            <div className="text-stone-400 italic text-[11px] animate-pulse">
              Sedang mengompilasi dan mengeksekusi kode...
            </div>
          )}

          {output && (
            <pre className="text-emerald-400 whitespace-pre-wrap text-[11px] leading-snug">
              {output}
            </pre>
          )}

          {stderr && (
            <pre className="text-rose-400 whitespace-pre-wrap text-[11px] leading-snug flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{stderr}</span>
            </pre>
          )}

          {!output && !stderr && !loading && (
            <div className="text-stone-500 text-[11px]">
              (Program selesai tanpa keluaran output terminal)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
