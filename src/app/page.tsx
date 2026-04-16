"use client";

import { useState, useEffect, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Wand2, Loader2, MessageSquare, Eye, Bot } from "lucide-react";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import HistoryPanel from "@/components/HistoryPanel";
import InputArea from "@/components/InputArea";
import PreviewPanel from "@/components/PreviewPanel";
import ChatPanel from "@/components/ChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DocSettings, ChatMessage } from "@/lib/types";

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
  const [showHistory, setShowHistory] = useState(false);
  const [rightTab, setRightTab] = useState<"preview" | "chat">("preview");

  // Chat session state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

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

  // Save article to history
  const saveArticle = useCallback(
    async (title: string, md: string) => {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            markdown: md,
            sourcePreview: rawInput.slice(0, 200),
            settings,
          }),
        });
      } catch {
        // silent — don't block UX for save failures
      }
    },
    [rawInput, settings]
  );

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
    setRightTab("preview");

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

      // Auto-save to history
      const docTitle = data.markdown.match(/^#\s+(.+)$/m)?.[1] || "Untitled Document";
      saveArticle(docTitle, data.markdown);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load article from history
  const handleLoadArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/history?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load article");

      setMarkdown(data.article.markdown);
      setRightTab("preview");
      toast.success("Article loaded from history");
    } catch {
      toast.error("Failed to load article");
    }
  };

  // Load chat session from history
  const handleLoadChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chat-session?id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load chat");

      setChatMessages(data.session.messages || []);
      setChatSessionId(data.session.id);
      setRightTab("chat");
      toast.success("Chat session restored");
    } catch {
      toast.error("Failed to load chat session");
    }
  };

  const handleChatSessionUpdate = useCallback(
    (sessionId: string, msgs: ChatMessage[]) => {
      setChatSessionId(sessionId);
      setChatMessages(msgs);
    },
    []
  );

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

      <HistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadArticle={handleLoadArticle}
        onLoadChat={handleLoadChat}
      />

      <div className="relative z-10 flex flex-col h-screen overflow-hidden">
        <Header
          onSettingsClick={() => setShowSettings(true)}
          onHistoryClick={() => setShowHistory(true)}
        />

        <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
          {/* Left — Input */}
          <div className="flex flex-col gap-3 w-full lg:w-[460px] shrink-0 overflow-y-auto">
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

          {/* Right — Preview / Chat */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 gap-2">
            {/* Tab switcher */}
            <Tabs
              value={rightTab}
              onValueChange={(v) => setRightTab(v as "preview" | "chat")}
            >
              <TabsList className="h-8 w-fit">
                <TabsTrigger value="preview" className="text-xs px-3 h-6 gap-1.5">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="text-xs px-3 h-6 gap-1.5"
                  disabled={!rawInput.trim()}
                >
                  <Bot className="h-3 w-3" />
                  Chat with Source
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Tab content */}
            <div className="flex-1 flex flex-col min-h-0">
              {rightTab === "preview" ? (
                <PreviewPanel
                  markdown={markdown}
                  isGenerating={isGenerating}
                  title={title}
                />
              ) : (
                <ChatPanel
                  sourceContext={rawInput}
                  settings={settings}
                  apiKey={apiKey}
                  initialMessages={chatMessages}
                  sessionId={chatSessionId}
                  onSessionUpdate={handleChatSessionUpdate}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
