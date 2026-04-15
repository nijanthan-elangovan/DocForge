"use client";

import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Wand2, Loader2, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import InputArea from "@/components/InputArea";
import PreviewPanel from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DocSettings } from "@/lib/types";

const DEFAULT_SETTINGS: DocSettings = {
  styleGuide: "google",
  audience: "developer",
  surface: "api-doc",
  provider: "openrouter",
  geminiModel: "gemini-2.0-flash-lite",
  openrouterModel: "nvidia/nemotron-3-super-120b-a12b:free",
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
        `Add your ${settings.provider === "gemini" ? "Gemini" : "OpenRouter"} API key in Settings`
      );
      return;
    }
    if (!rawInput.trim()) {
      toast.error("Please provide some input content");
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
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setMarkdown(data.markdown);
      toast.success("Documentation generated!");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const title = markdown.match(/^#\s+(.+)$/m)?.[1] || "Untitled Document";

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "hsl(0 0% 7%)",
            color: "hsl(0 0% 95%)",
            border: "1px solid hsl(0 0% 14%)",
            fontSize: "13px",
          },
        }}
      />

      <div className="ambient-glow" />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onSettingsClick={() => setShowSettings(true)} />

        <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
          {/* Left — Input */}
          <div className="flex flex-col gap-3 w-full lg:w-[460px] shrink-0">
            <InputArea rawInput={rawInput} onInputChange={setRawInput} />

            {/* Instructions */}
            <Card>
              <CardHeader className="pb-2 space-y-0">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  Instructions
                  <span className="text-muted-foreground/50 font-normal text-xs ml-1">
                    optional
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder='e.g. "Write docs only for the auth module" or "Focus on REST API endpoints"'
                  className="resize-none h-[68px] text-sm"
                />
              </CardContent>
            </Card>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !rawInput.trim()}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Documentation
                </>
              )}
            </Button>
          </div>

          {/* Right — Preview */}
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
