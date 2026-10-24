"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart.trim()) return;
      setLoading(true);
      setError(null);

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (isMounted) {
          setSvgContent(svg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid render error:", err);
          setError("Gagal merender diagram. Pastikan sintaks Mermaid valid.");
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (loading) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-400">
        Memuat visualisasi diagram...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
        <p className="font-semibold mb-1">Visualisasi belum tersedia</p>
        <p className="font-mono text-[11px] opacity-80">{chart}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto p-4 flex justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
