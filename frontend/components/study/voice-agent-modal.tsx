"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Zap,
  RotateCcw,
  Bot,
  User,
  Settings2,
  Sliders,
  Send,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface VoiceMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string;
  model?: string;
}

type AgentState = "IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING";

export function VoiceAgentModal({
  isOpen,
  onClose,
  topic = "Diskusi Pembelajaran",
  model = "gemini-3.8-flash",
}: VoiceAgentModalProps) {
  const [agentState, setAgentState] = useState<AgentState>("IDLE");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textInput, setTextInput] = useState("");

  // Natural Voice Customization States
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speechPitch, setSpeechPitch] = useState<number>(1.02);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // References to prevent Chrome GC bug and state race conditions
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const isMutedRef = useRef(isMuted);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const gcWatchdogRef = useRef<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    isMutedRef.current = isMuted;
  }, [isOpen, isMuted]);

  // Load available speech synthesis voices & auto-select the best natural one
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const idVoices = allVoices.filter(
        (v) => v.lang.startsWith("id") || v.name.toLowerCase().includes("indonesia")
      );

      // Best candidates: Microsoft Natural / Online / Neural or Google
      const naturalIdVoice = idVoices.find(
        (v) =>
          v.name.includes("Natural") ||
          v.name.includes("Online") ||
          v.name.includes("Neural") ||
          v.name.includes("Google")
      );

      setAvailableVoices(allVoices);

      if (naturalIdVoice) {
        setSelectedVoiceURI(naturalIdVoice.voiceURI);
      } else if (idVoices.length > 0) {
        setSelectedVoiceURI(idVoices[0].voiceURI);
      } else {
        const fallbackNatural = allVoices.find(
          (v) => v.name.includes("Natural") || v.name.includes("Online")
        );
        if (fallbackNatural) setSelectedVoiceURI(fallbackNatural.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          text: `Halo! Saya AI Study Companion. Silakan tanyakan atau diskusikan materi mengenai ${topic}. Saya mendengarkan suara Anda.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      initVoiceEngine();

      setTimeout(() => {
        speakText(`Halo! Saya AI Study Companion. Silakan mulai berbicara tentang ${topic}.`);
      }, 500);
    } else {
      cleanupVoice();
    }

    return () => {
      cleanupVoice();
    };
  }, [isOpen]);

  const initVoiceEngine = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "id-ID";

    recognition.onresult = (event: any) => {
      // ANTI-ECHO / ACOUSTIC ISOLATION:
      // If AI is currently speaking through speaker, ignore mic input completely
      // to avoid AI echoing its own voice or interrupting itself.
      if (isSpeakingRef.current) {
        return;
      }

      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const activeText = final || interim;
      setTranscript(activeText);

      if (final.trim()) {
        const query = final.trim();
        setTranscript("");
        handleUserSpeech(query);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition notice:", e.error);
      if (e.error === "not-allowed") {
        setAgentState("IDLE");
      }
    };

    recognition.onend = () => {
      // Safely restart recognition with gentle debounce if still open, unmuted, and not speaking
      if (isOpenRef.current && !isMutedRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isOpenRef.current && !isMutedRef.current && !isSpeakingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setAgentState("LISTENING");
    } catch (e) {
      console.error("Recognition start error:", e);
    }

    // Audio Visualizer setup
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVisualizer = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(avg);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          updateVisualizer();
        })
        .catch(() => {});
    }
  };

  const cleanupVoice = () => {
    if (gcWatchdogRef.current) {
      clearInterval(gcWatchdogRef.current);
      gcWatchdogRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    currentUtteranceRef.current = null;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAgentState("IDLE");
  };

  const handleUserSpeech = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: VoiceMessage = {
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setAgentState("PROCESSING");

    // Temporarily pause recognition while processing & preparing to speak
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    try {
      const chatPayload = {
        messages: [
          ...messages.slice(-4).map((m) => ({ role: m.role, content: m.text })),
          { role: "user", content: text },
        ],
        model,
        style: "conversational_oral",
        temperature: 0.65,
        max_tokens: 220,
      };

      const res = await api.ai.chat(chatPayload);
      const aiReply = res.content || "Bisa tolong ulangi pertanyaan Anda?";

      const aiMsg: VoiceMessage = {
        role: "assistant",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      speakText(aiReply);
    } catch (err) {
      console.error("Voice chat error:", err);
      speakText("Koneksi terputus sebentar. Bisakah Anda mengulangi kalimat tadi?");
    }
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setAgentState("LISTENING");
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for natural human cadence
    const cleanSpeech = text
      .replace(/[*_#`$]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = "id-ID";
    utterance.pitch = speechPitch;
    utterance.rate = speechRate;

    // Persist in ref to prevent Chrome V8 Garbage Collection hang bug
    currentUtteranceRef.current = utterance;

    // Apply selected Natural voice if available
    if (selectedVoiceURI && availableVoices.length > 0) {
      const match = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setAgentState("SPEAKING");

      // Chrome GC Keepalive Watchdog
      if (gcWatchdogRef.current) clearInterval(gcWatchdogRef.current);
      gcWatchdogRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          clearInterval(gcWatchdogRef.current);
        }
      }, 5000);
    };

    const finishSpeaking = () => {
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      if (gcWatchdogRef.current) {
        clearInterval(gcWatchdogRef.current);
        gcWatchdogRef.current = null;
      }

      setAgentState("LISTENING");

      // Safely resume listening after AI finishes speaking
      if (isOpenRef.current && !isMutedRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (isOpenRef.current && !isMutedRef.current && !isSpeakingRef.current) {
            try {
              recognitionRef.current.start();
            } catch {}
          }
        }, 200);
      }
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    window.speechSynthesis.speak(utterance);
  };

  const handleInterrupt = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    currentUtteranceRef.current = null;
    setAgentState("LISTENING");

    if (isOpenRef.current && !isMutedRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      try {
        recognitionRef.current?.start();
        setAgentState("LISTENING");
      } catch {}
    } else {
      setIsMuted(true);
      try {
        recognitionRef.current?.stop();
      } catch {}
      setAgentState("IDLE");
    }
  };

  const handleSendManualText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || agentState === "PROCESSING") return;
    const query = textInput.trim();
    setTextInput("");
    handleInterrupt();
    handleUserSpeech(query);
  };

  if (!isOpen) return null;

  const relevantVoices = availableVoices.filter(
    (v) =>
      v.lang.startsWith("id") ||
      v.name.includes("Natural") ||
      v.name.includes("Online") ||
      v.name.includes("Google")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-lg h-[680px] rounded-3xl border border-indigo-900/40 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Phone className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Telepon AI Tutor
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Anti-Echo Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">{topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition ${
                settingsOpen ? "bg-indigo-600/30 text-indigo-300" : ""
              }`}
              title="Pengaturan Suara Manusiawi"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dropdown Drawer: Suara & Nada Suara Manusiawi */}
        {settingsOpen && (
          <div className="bg-slate-950/90 border-b border-slate-800 p-4 space-y-3 animate-in slide-in-from-top-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Pilihan Suara (Natural & Jernih):</span>
                <span className="text-[10px] text-indigo-400">
                  {selectedVoiceURI ? "Aktif" : "Default Sistem"}
                </span>
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => {
                  setSelectedVoiceURI(e.target.value);
                  setTimeout(() => speakText("Halo, ini contoh suara baru saya."), 200);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {relevantVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name.includes("Natural") || v.name.includes("Online")
                      ? `✨ ${v.name}`
                      : v.name}
                  </option>
                ))}
                {relevantVoices.length === 0 && (
                  <option value="">Suara Default Browser</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Kecepatan Bicara:</span>
                  <span className="font-bold text-indigo-300">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Kehangatan Nada (Pitch):</span>
                  <span className="font-bold text-indigo-300">{speechPitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Center: Pulsating Audio Orb Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative flex items-center justify-center">
            {/* Outer dynamic breathing halo */}
            <div
              className={`absolute rounded-full transition-all duration-300 ${
                agentState === "SPEAKING"
                  ? "bg-indigo-500/30 blur-2xl animate-pulse"
                  : agentState === "LISTENING"
                  ? "bg-emerald-500/30 blur-2xl"
                  : "bg-purple-500/20 blur-xl"
              }`}
              style={{
                width: `${160 + (audioLevel > 5 ? audioLevel * 1.5 : 0)}px`,
                height: `${160 + (audioLevel > 5 ? audioLevel * 1.5 : 0)}px`,
              }}
            />

            {/* Glowing Core Orb */}
            <div
              className={`relative z-10 flex h-36 w-36 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ${
                agentState === "SPEAKING"
                  ? "border-indigo-400 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-indigo-500/50 scale-105"
                  : agentState === "LISTENING"
                  ? "border-emerald-400 bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 shadow-emerald-500/50"
                  : agentState === "PROCESSING"
                  ? "border-purple-400 bg-gradient-to-tr from-purple-600 to-pink-600"
                  : "border-slate-700 bg-slate-800"
              }`}
            >
              {agentState === "SPEAKING" ? (
                <Volume2 className="h-14 w-14 text-white animate-bounce" />
              ) : agentState === "LISTENING" ? (
                <Mic className="h-14 w-14 text-white animate-pulse" />
              ) : agentState === "PROCESSING" ? (
                <Sparkles className="h-14 w-14 text-white animate-spin" />
              ) : (
                <Bot className="h-14 w-14 text-slate-300" />
              )}
            </div>
          </div>

          {/* Status Label Badge */}
          <div className="mt-8 flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                agentState === "SPEAKING"
                  ? "bg-indigo-400 animate-ping"
                  : agentState === "LISTENING"
                  ? "bg-emerald-400 animate-pulse"
                  : agentState === "PROCESSING"
                  ? "bg-purple-400 animate-spin"
                  : "bg-slate-500"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {agentState === "SPEAKING" && "AI Sedang Berbicara..."}
              {agentState === "LISTENING" && "Mendengarkan suara Anda..."}
              {agentState === "PROCESSING" && "Menalarkan respon..."}
              {agentState === "IDLE" && "Mikrofon Jeda"}
            </span>
          </div>

          {/* Real-time Voice Live Transcript Bubble */}
          <div className="mt-4 w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center min-h-[48px] flex items-center justify-center">
            <p className="text-xs text-slate-300 italic">
              {transcript
                ? `"${transcript}"`
                : agentState === "SPEAKING"
                ? "Dengarkan penjelasan AI..."
                : "Bicaralah sekarang..."}
            </p>
          </div>

          {/* Fallback Text Input if User in Noisy Room */}
          <form onSubmit={handleSendManualText} className="mt-3 w-full max-w-sm flex gap-1.5">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Atau ketik pesan jika ruangan bising..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || agentState === "PROCESSING"}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-40 transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Footer Call Controls */}
        <div className="flex items-center justify-around p-6 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-xs transition ${
              isMuted
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span>{isMuted ? "Buka Mic" : "Mute Mic"}</span>
          </button>

          {/* End Call Button */}
          <button
            onClick={onClose}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 transition hover:scale-105"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          {/* Interrupt AI Button */}
          <button
            onClick={handleInterrupt}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-xs transition ${
              agentState === "SPEAKING"
                ? "bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Zap className="h-5 w-5 text-amber-400" />
            <span>Potong Bicara</span>
          </button>
        </div>
      </div>
    </div>
  );
}
