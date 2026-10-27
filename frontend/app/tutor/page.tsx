"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Award,
  Sparkles,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Share2,
  Camera,
  GraduationCap,
  Headphones,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { AudioPlayerButton } from "@/components/study/audio-player-button";
import { MindMapModal } from "@/components/study/mindmap-modal";
import { CheatSheetModal } from "@/components/study/cheatsheet-modal";
import { AIMotivationCard } from "@/components/study/ai-motivation-card";
import { CodeRunner } from "@/components/study/code-runner";
import { SnapSolveModal } from "@/components/study/snap-solve-modal";
import { AcademicPapersModal } from "@/components/study/academic-papers-modal";
import { PodcastModal } from "@/components/study/podcast-modal";
import { api } from "@/lib/api";
import { ConversationItem, LearningMaterialItem, MessageItem, ModelInfo } from "@/lib/types";

export default function TutorPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Settings & Context
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState("minimax-m3.1-flash");
  const [explanationStyle, setExplanationStyle] = useState("step_by_step");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [materials, setMaterials] = useState<LearningMaterialItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | "">("");

  // Modals
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // New Feature Modals (Mind Map & Cheatsheet)
  const [mindmapOpen, setMindmapOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [snapModalOpen, setSnapModalOpen] = useState(false);
  const [papersModalOpen, setPapersModalOpen] = useState(false);
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [activeModalSeed, setActiveModalSeed] = useState("");
  const [activeModalTopic, setActiveModalTopic] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load models, conversations, and materials
  useEffect(() => {
    api.ai.getModels()
      .then((mods: ModelInfo[]) => {
        if (Array.isArray(mods) && mods.length > 0) {
          setModels(mods);
          const preferred =
            mods.find((m) => m.id === "minimax-m3.1-flash" && m.status !== "offline") ||
            mods.find((m) => m.id === "gemini-3.8-flash" && m.status !== "offline") ||
            mods.find((m) => m.id === "gpt-5.6-luna" && m.status !== "offline") ||
            mods.find((m) => m.status !== "offline") ||
            mods[0];
          setSelectedModel(preferred.id);
        }
      })
      .catch(() => {});

    api.conversations.list()
      .then((convs: ConversationItem[]) => {
        if (Array.isArray(convs)) {
          setConversations(convs);
          if (convs.length > 0) {
            loadConversation(convs[0].id);
          }
        }
      })
      .catch(() => {});

    api.materials.list()
      .then((mats: LearningMaterialItem[]) => {
        if (Array.isArray(mats)) setMaterials(mats);
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const data = await api.conversations.get(convId);
      setMessages(data.messages || []);
      if (data.model) setSelectedModel(data.model);
    } catch (e) {
      console.error("Error loading conversation:", e);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.conversations.create({
        title: "Percakapan Baru",
        model: selectedModel,
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (e: any) {
      console.error("Error creating conversation:", e);
      alert("Gagal menghubungi server backend. Pastikan server backend FastAPI aktif di port 8000 (Jalankan 'npm run backend' atau 'npm run dev' di folder root).");
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Hapus percakapan ini?")) return;
    try {
      await api.conversations.delete(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = inputPrompt.trim();
    if (!promptText || loading) return;

    setInputPrompt("");
    const userMsg: MessageItem = { role: "user", content: promptText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await api.ai.chat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        conversation_id: activeConvId || undefined,
        model: selectedModel,
        style: explanationStyle,
        difficulty: difficulty,
        material_id: selectedMaterialId || undefined,
      });

      const assistantMsg: MessageItem = {
        role: "assistant",
        content: response.content,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If this was a new conversation, update active id and title
      if (!activeConvId && response.conversation_id) {
        setActiveConvId(response.conversation_id);
        const updatedList = await api.conversations.list();
        setConversations(updatedList);
      }
    } catch (err: any) {
      const errMsg: MessageItem = {
        role: "assistant",
        content: `⚠️ **Gagal mendapatkan respons AI**: ${err.message || "Silakan periksa konfigurasi GutsAI API key di backend."}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openSaveNoteModal = (content: string) => {
    setNoteTitle(`Catatan Tutor - ${new Date().toLocaleDateString("id-ID")}`);
    setNoteContent(content);
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return;
    setSavingNote(true);
    try {
      await api.notes.create({
        title: noteTitle,
        content: noteContent,
        material_id: selectedMaterialId || undefined,
        tags: "AI Tutor, Ringkasan",
      });
      setNoteModalOpen(false);
      alert("Catatan berhasil disimpan! Anda dapat melihatnya di halaman Catatan.");
    } catch (e: any) {
      alert("Gagal menyimpan catatan: " + e.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateQuizFromResponse = (text: string) => {
    // Save prompt to session storage so the quiz generator can pick it up
    sessionStorage.setItem("quiz_seed_content", text.slice(0, 1000));
    window.location.href = "/quiz";
  };

  return (
    <AppLayout
      title="Tutor Belajar"
      subtitle="Diskusikan konsep pelajaran secara interaktif dan bertahap"
    >
      <div className="flex h-[calc(100vh-10rem)] gap-4 overflow-hidden">
        {/* Left Side: Conversation History Drawer */}
        <div className="hidden lg:flex w-64 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Button
            onClick={handleNewConversation}
            size="sm"
            className="w-full gap-2 justify-start font-semibold text-xs"
          >
            <Plus className="h-4 w-4" /> Percakapan Baru
          </Button>

          <div className="mt-3 flex-1 overflow-y-auto space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              Riwayat Sesi
            </span>
            {conversations.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-400">Belum ada percakapan tersimpan.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    activeConvId === c.id
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate pr-2">{c.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                    title="Hapus percakapan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Tutor Area */}
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center gap-2">
              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.status === "offline"}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Style Selector */}
              <select
                value={explanationStyle}
                onChange={(e) => setExplanationStyle(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="step_by_step">Gaya: Bertahap (Step-by-step)</option>
                <option value="feynman">🧠 Gaya: Teknik Feynman (Ajarkan ke AI)</option>
                <option value="socratic">🎙️ Gaya: Ujian Sokratik (Uji Saya)</option>
                <option value="debate">⚔️ Gaya: Partner Debat (Uji Argumen)</option>
                <option value="practical">Gaya: Contoh Praktis</option>
                <option value="analogy">Gaya: Analogi & Perumpamaan</option>
                <option value="exercise">Gaya: Latihan Soal Interaktif</option>
              </select>

              {/* Difficulty Selector */}
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="beginner">Tingkat: Pemula</option>
                <option value="intermediate">Tingkat: Menengah</option>
                <option value="advanced">Tingkat: Mendalam</option>
              </select>
            </div>

            {/* Document Grounding Selector */}
            {materials.length > 0 && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="h-8 max-w-[180px] truncate rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="">Konteks: Umum (Tanpa Dokumen)</option>
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      Dokumen: {mat.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center text-center py-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 shadow-xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Ruang Diskusi & Pemahaman Materi
                  </h3>
                  <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Ajukan materi apapun yang ingin Anda pahami secara bertahap dan terarah.
                  </p>
                </div>

                {/* AI Dynamic Motivation & Hikmah Card */}
                <AIMotivationCard className="w-full max-w-xl text-left my-1 shadow-sm" />

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full text-left">
                  <button
                    onClick={() => {
                      setInputPrompt("Jelaskan konsep dasar jaringan komputer dan model OSI 7 layer secara bertahap.");
                    }}
                    className="p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    🌐 Jaringan Komputer & Model OSI
                  </button>
                  <button
                    onClick={() => {
                      setInputPrompt("Berikan analogi sederhana untuk memahami cara kerja memori RAM dan SSD pada komputer.");
                    }}
                    className="p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    ⚡ Analogi RAM vs SSD Komputer
                  </button>
                  <button
                    onClick={() => {
                      setInputPrompt("Jelaskan perbedaan fotosintesis reaksi terang dan reaksi gelap dalam biologi.");
                    }}
                    className="p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    🌱 Fotosintesis: Reaksi Terang & Gelap
                  </button>
                  <button
                    onClick={() => {
                      setInputPrompt("Bantu saya memahami rumus integral parsial dengan contoh langkah demi langkah.");
                    }}
                    className="p-3 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    📐 Integral Parsial Langkah demi Langkah
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm mt-0.5">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}

                  <div
                    className={`group relative rounded-2xl shadow-xs transition-all ${
                      msg.role === "user"
                        ? "max-w-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-3.5 text-[13.5px] leading-relaxed font-normal"
                        : "w-full max-w-3xl lg:max-w-4xl border border-slate-200/90 bg-white p-5 md:p-6 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI Tutor
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 font-mono text-[10.5px] font-medium border border-indigo-100 dark:border-indigo-900/40">
                            {selectedModel}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-slate-400 uppercase tracking-wider font-medium">
                          {difficulty}
                        </span>
                      </div>
                    )}

                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1.5 border-b border-slate-200/70 dark:border-slate-800">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm md:text-base font-bold text-indigo-700 dark:text-indigo-300 mt-4 mb-2 flex items-center gap-1.5 border-l-4 border-indigo-500 pl-2.5">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1.5">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3.5 leading-relaxed text-slate-700 dark:text-slate-300 text-[13.5px] last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[13.5px]">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-slate-700 dark:text-slate-300 text-[13.5px]">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed pl-1 text-[13.5px]">
                                {children}
                              </li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 pl-3.5 py-2 my-3 rounded-r-xl italic text-slate-600 dark:text-slate-400 text-xs">
                                {children}
                              </blockquote>
                            ),
                            code: ({ inline, className, children, ...props }: any) => {
                              return inline ? (
                                <code
                                  className="bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[12px] px-1.5 py-0.5 rounded border border-slate-200/70 dark:border-slate-700"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <CodeRunner
                                  code={String(children).replace(/\n$/, "")}
                                  language={className ? className.replace("language-", "") : "python"}
                                />
                              );
                            },
                            hr: () => (
                              <hr className="my-4 border-slate-200/70 dark:border-slate-800" />
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-900 dark:text-white">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Action Toolbar on AI Response */}
                    {msg.role === "assistant" && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {/* Audio Narrator Button */}
                        <AudioPlayerButton text={msg.content} />

                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 transition-colors font-medium text-[11.5px]"
                          title="Salin Teks"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-600 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openSaveNoteModal(msg.content)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 transition-colors font-medium text-[11.5px]"
                          title="Simpan sebagai Catatan Belajar"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          <span>Catatan</span>
                        </button>

                        {/* Mind Map Generator Button */}
                        <button
                          onClick={() => {
                            setActiveModalSeed(msg.content);
                            setActiveModalTopic("Bagan Konsep AI Tutor");
                            setMindmapOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 transition-colors font-medium text-[11.5px] border border-indigo-100 dark:border-indigo-900/40"
                          title="Visualisasikan menjadi Mind Map"
                        >
                          <Share2 className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Mind Map</span>
                        </button>

                        {/* Exam Cheatsheet Button */}
                        <button
                          onClick={() => {
                            setActiveModalSeed(msg.content);
                            setActiveModalTopic("Rangkuman Ujian");
                            setCheatsheetOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 transition-colors font-medium text-[11.5px] border border-amber-100 dark:border-amber-900/40"
                          title="Buat Cheatsheet Ujian 1 Lembar"
                        >
                          <FileText className="h-3.5 w-3.5 text-amber-500" />
                          <span>Cheatsheet</span>
                        </button>

                        {/* 2-Host AI Podcast Generator Button */}
                        <button
                          onClick={() => {
                            setActiveModalSeed(msg.content);
                            setActiveModalTopic("Diskusi Podcast Materi AI Tutor");
                            setPodcastOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50/70 hover:bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:hover:bg-orange-900 dark:text-orange-300 transition-colors font-medium text-[11.5px] border border-orange-100 dark:border-orange-900/40"
                          title="Ubah Penjelasan Menjadi Podcast 2 Host (NotebookLM Style)"
                        >
                          <Headphones className="h-3.5 w-3.5 text-orange-500" />
                          <span>Podcast</span>
                        </button>

                        <button
                          onClick={() => handleCreateQuizFromResponse(msg.content)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors font-semibold text-[11.5px] ml-auto shadow-xs"
                          title="Buat Kuis Berdasarkan Materi Ini"
                        >
                          <Award className="h-3.5 w-3.5 text-white" />
                          <span>Uji Pemahaman</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 mt-0.5">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-xs dark:border-slate-800 dark:bg-slate-850 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1">Menyiapkan penjelasan materi...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSnapModalOpen(true)}
                title="Snap & Solve - Bedah Soal dari Foto / Kamera"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 bg-stone-50 hover:bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition shadow-2xs"
              >
                <Camera className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => setPapersModalOpen(true)}
                title="Cari Jurnal Ilmiah (Semantic Scholar)"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 bg-stone-50 hover:bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition shadow-2xs"
              >
                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModalSeed("");
                  setActiveModalTopic("");
                  setPodcastOpen(true);
                }}
                title="AI Podcast Studio (NotebookLM Style)"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 bg-stone-50 hover:bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 transition shadow-2xs"
              >
                <Headphones className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </button>

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ajukan pertanyaan materi, atau gunakan tombol kamera/jurnal..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                disabled={loading}
              />
              <Button type="submit" disabled={!inputPrompt.trim() || loading} size="md" className="gap-2">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Kirim</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Save Note Modal */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Simpan sebagai Catatan Belajar"
        description="Hasil penjelasan AI Tutor akan disimpan ke daftar catatan Anda."
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Catatan
            </label>
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="mt-1"
              placeholder="Contoh: Ringkasan Cara Kerja OSI Layer"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Isi Catatan
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setNoteModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveNote} isLoading={savingNote}>
              Simpan Catatan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Visual Mind Map Modal */}
      <MindMapModal
        isOpen={mindmapOpen}
        onClose={() => setMindmapOpen(false)}
        seedContent={activeModalSeed}
        topicTitle={activeModalTopic}
        model={selectedModel}
      />

      {/* Quick Exam Cheatsheet Modal */}
      <CheatSheetModal
        isOpen={cheatsheetOpen}
        onClose={() => setCheatsheetOpen(false)}
        seedContent={activeModalSeed}
        subjectTitle={activeModalTopic}
        model={selectedModel}
      />

      {/* Snap & Solve Multimodal Vision Modal */}
      <SnapSolveModal
        isOpen={snapModalOpen}
        onClose={() => setSnapModalOpen(false)}
        onAskTutor={(solutionText) => {
          setInputPrompt(`Tolong jelaskan lebih lanjut mengenai penyelesaian soal ini:\n\n${solutionText}`);
        }}
      />

      {/* Academic Papers Search Modal (Semantic Scholar) */}
      <AcademicPapersModal
        isOpen={papersModalOpen}
        onClose={() => setPapersModalOpen(false)}
        onImportToNotes={(paper) => {
          openSaveNoteModal(
            `## ${paper.title}\n\n**Penulis:** ${paper.authors?.join(", ")} (${paper.year})\n**Sitasi APA:** ${paper.apa_citation}\n**Link:** ${paper.url}\n\n### Abstrak\n${paper.abstract}`
          );
        }}
      />

      {/* AI Podcast Studio Modal (2-Host Audio Overview) */}
      <PodcastModal
        isOpen={podcastOpen}
        onClose={() => setPodcastOpen(false)}
        initialTopic={activeModalTopic || "Materi AI Tutor"}
        initialSourceText={activeModalSeed}
        onImportToNotes={(text) => openSaveNoteModal(text)}
      />
    </AppLayout>
  );
}
