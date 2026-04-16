"use client";

import { useState, useEffect, useCallback } from "react";
import { History, FileText, MessageSquare, Loader2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ArticleEntry {
  id: string;
  title: string;
  source_preview: string | null;
  created_at: string;
  expires_at: string;
}

interface ChatEntry {
  id: string;
  title: string;
  source_preview: string | null;
  updated_at: string;
  expires_at: string;
}

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onLoadArticle: (id: string) => void;
  onLoadChat: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function expiresIn(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1h left";
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

export default function HistoryPanel({
  open,
  onClose,
  onLoadArticle,
  onLoadChat,
}: HistoryPanelProps) {
  const [tab, setTab] = useState<"articles" | "chats">("articles");
  const [articles, setArticles] = useState<ArticleEntry[]>([]);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [artRes, chatRes] = await Promise.all([
        fetch("/api/history"),
        fetch("/api/chat-session"),
      ]);
      const artData = await artRes.json();
      const chatData = await chatRes.json();
      setArticles(artData.articles || []);
      setChats(chatData.sessions || []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            History
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "articles" | "chats")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="articles" className="flex-1 text-xs gap-1.5">
              <FileText className="h-3 w-3" />
              Articles
              {articles.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {articles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex-1 text-xs gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Chats
              {chats.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {chats.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tab === "articles" ? (
            articles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No articles yet</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Generated docs are saved for 7 days
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => {
                      onLoadArticle(article.id);
                      onClose();
                    }}
                    className="w-full text-left rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {article.title}
                        </p>
                        {article.source_preview && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {article.source_preview}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(article.created_at)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {expiresIn(article.expires_at)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No chat sessions</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Chat sessions are saved for 24 hours
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onLoadChat(chat.id);
                    onClose();
                  }}
                  className="w-full text-left rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {chat.title}
                      </p>
                      {chat.source_preview && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {chat.source_preview}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(chat.updated_at)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {expiresIn(chat.expires_at)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
