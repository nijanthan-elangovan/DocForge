"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMessage, DocSettings } from "@/lib/types";

interface ChatPanelProps {
  sourceContext: string;
  settings: DocSettings;
  apiKey: string;
  initialMessages?: ChatMessage[];
  sessionId?: string | null;
  onSessionUpdate?: (sessionId: string, messages: ChatMessage[]) => void;
}

export default function ChatPanel({
  sourceContext,
  settings,
  apiKey,
  initialMessages,
  sessionId: externalSessionId,
  onSessionUpdate,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(externalSessionId || null);

  // Sync with external initial messages (when loading from history)
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    sessionIdRef.current = externalSessionId || null;
  }, [externalSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveSession = useCallback(
    async (msgs: ChatMessage[]) => {
      if (msgs.length === 0) return;
      try {
        const res = await fetch("/api/chat-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            title: msgs[0]?.content.slice(0, 60) || "Chat Session",
            messages: msgs,
            sourcePreview: sourceContext.slice(0, 200),
          }),
        });
        const data = await res.json();
        if (data.id) {
          sessionIdRef.current = data.id;
          onSessionUpdate?.(data.id, msgs);
        }
      } catch {
        // silent — don't block chat for save failures
      }
    },
    [sourceContext, onSessionUpdate]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!apiKey) {
      toast.error("Add your API key in Settings first");
      return;
    }

    const userMessage: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          provider: settings.provider,
          model:
            settings.provider === "gemini"
              ? settings.geminiModel
              : settings.openrouterModel,
          messages: updated,
          sourceContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      const withReply = [...updated, { role: "assistant" as const, content: data.reply }];
      setMessages(withReply);
      saveSession(withReply);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      toast.error(msg);
      setMessages(messages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([]);
    sessionIdRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5 text-primary" />
            Chat with Source
          </CardTitle>
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleClear}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear chat</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col pt-0 gap-3">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/50 mb-3">
                <Bot className="h-5 w-5 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ask anything about the loaded source
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                e.g. &quot;What does this project do?&quot; or &quot;Explain the auth flow&quot;
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-forge prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-muted/50 border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the code..."
            rows={1}
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[36px] max-h-[100px]"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
