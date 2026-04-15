"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Eye,
  Code,
  Copy,
  Check,
  Share2,
  Download,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface PreviewPanelProps {
  markdown: string;
  isGenerating: boolean;
  title?: string;
}

export default function PreviewPanel({
  markdown,
  isGenerating,
  title,
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<"preview" | "markdown">("preview");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Copied to clipboard", {
      className: "toast-custom",
      iconTheme: { primary: "#6366f1", secondary: "#fff" },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, title }),
      });
      const data = await res.json();
      if (data.id) {
        const shareUrl = `${window.location.origin}/shared/${data.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied!", {
          className: "toast-custom",
          iconTheme: { primary: "#6366f1", secondary: "#fff" },
        });
      }
    } catch {
      toast.error("Failed to create share link", {
        className: "toast-custom",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded", {
      className: "toast-custom",
      iconTheme: { primary: "#6366f1", secondary: "#fff" },
    });
  };

  return (
    <div className="glass fade-in flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white/90">
            Document Preview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                viewMode === "preview"
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
            <button
              onClick={() => setViewMode("markdown")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                viewMode === "markdown"
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Code className="w-3 h-3" />
              Markdown
            </button>
          </div>

          {/* Actions */}
          {markdown && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all disabled:opacity-50"
                title="Share"
              >
                {sharing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center pulse-glow">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-white/50">Generating documentation...</p>
              <p className="text-xs text-white/25 mt-1">
                This may take a few seconds
              </p>
            </div>
            {/* Skeleton */}
            <div className="w-full max-w-lg space-y-3 mt-4">
              <div className="h-6 w-3/4 rounded-lg shimmer" />
              <div className="h-4 w-full rounded-lg shimmer" />
              <div className="h-4 w-5/6 rounded-lg shimmer" />
              <div className="h-4 w-2/3 rounded-lg shimmer" />
              <div className="h-6 w-1/2 rounded-lg shimmer mt-6" />
              <div className="h-4 w-full rounded-lg shimmer" />
              <div className="h-4 w-4/5 rounded-lg shimmer" />
            </div>
          </div>
        ) : markdown ? (
          viewMode === "preview" ? (
            <div className="prose-forge max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <pre className="text-sm text-white/70 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {markdown}
            </pre>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Eye className="w-7 h-7 text-white/10" />
            </div>
            <p className="text-sm text-white/30">
              Your generated document will appear here
            </p>
            <p className="text-xs text-white/15 mt-1">
              Configure settings, add your input, and hit Generate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
