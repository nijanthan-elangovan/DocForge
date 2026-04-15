"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Wand2, Loader2, Settings2 } from "lucide-react";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import InputArea from "@/components/InputArea";
import PreviewPanel from "@/components/PreviewPanel";
import { DocSettings } from "@/lib/types";

const DEFAULT_SETTINGS: DocSettings = {
  styleGuide: "google",
  audience: "developer",
  surface: "api-doc",
  provider: "openrouter",
  geminiModel: "gemini-2.0-flash-lite",
  openrouterModel: "google/gemma-4-31b-it:free",
};

const GEMINI_KEY_STORAGE = "docforge-gemini-key";
const OPENROUTER_KEY_STORAGE = "docforge-openrouter-key";

export default function Home() {
  const [settings, setSettings] = useState<DocSettings>(DEFAULT_SETTINGS);
  const [geminiKey, setGeminiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const apiKey = settings.provider === "gemini" ? geminiKey : openrouterKey;

  // Persist API keys in localStorage
  useEffect(() => {
    const gk = localStorage.getItem(GEMINI_KEY_STORAGE);
    const ok = localStorage.getItem(OPENROUTER_KEY_STORAGE);
    if (gk) setGeminiKey(gk);
    if (ok) setOpenrouterKey(ok);
  }, []);

  const handleApiKeyChange = (key: string) => {
    if (settings.provider === "gemini") {
      setGeminiKey(key);
      localStorage.setItem(GEMINI_KEY_STORAGE, key);
    } else {
      setOpenrouterKey(key);
      localStorage.setItem(OPENROUTER_KEY_STORAGE, key);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      toast.error(
        `Please enter your ${settings.provider === "gemini" ? "Gemini" : "OpenRouter"} API key`,
        { className: "toast-custom" }
      );
      return;
    }
    if (!rawInput.trim()) {
      toast.error("Please provide some input content", {
        className: "toast-custom",
      });
      return;
    }

    setIsGenerating(true);
    setMarkdown("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, rawInput, userPrompt, settings }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setMarkdown(data.markdown);
      toast.success("Documentation generated!", {
        className: "toast-custom",
        iconTheme: { primary: "#6366f1", secondary: "#fff" },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message, { className: "toast-custom" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract title from markdown
  const title = markdown.match(/^#\s+(.+)$/m)?.[1] || "Untitled Document";

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Animated background */}
      <div className="gradient-bg" />

      {/* Settings Modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      {/* App */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onSettingsClick={() => setShowSettings(true)} />

        <main className="flex-1 flex flex-col lg:flex-row gap-5 p-5 min-h-0">
          {/* Left column — Input */}
          <div className="flex flex-col gap-4 w-full lg:w-[480px] shrink-0">
            <InputArea rawInput={rawInput} onInputChange={setRawInput} />

            {/* User instruction */}
            <div className="glass fade-in px-4 py-3">
              <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider mb-2">
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                Instructions (optional)
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g. &quot;Write docs only for the authentication module&quot; or &quot;Focus on the REST API endpoints&quot; or &quot;Generate a getting started guide&quot;..."
                className="glass-input w-full px-3.5 py-2.5 text-sm resize-none h-[72px] leading-relaxed"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !rawInput.trim()}
              className="btn-primary flex items-center justify-center gap-2.5 py-3.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Documentation
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Right column — Preview */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <PreviewPanel
              markdown={markdown}
              isGenerating={isGenerating}
              title={title}
            />
          </div>
        </main>
      </div>
    </>
  );
}
