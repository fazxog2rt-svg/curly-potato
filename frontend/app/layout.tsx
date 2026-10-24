import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Study Companion — Platform Belajar Cerdas GutsAI",
  description:
    "Asisten belajar pribadi modern berbasis kecerdasan buatan, tutor adaptif, kuis interaktif, analisis dokumen, dan spaced repetition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
