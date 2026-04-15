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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    toast.success("Copied to clipboard");
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
        toast.success("Share link copied!");
      }
    } catch {
      toast.error("Failed to create share link");
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
    toast.success("Document downloaded");
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Preview</CardTitle>

          <div className="flex items-center gap-1">
            <Tabs
              value={viewMode}
              onValueChange={(v) =>
                setViewMode(v as "preview" | "markdown")
              }
            >
              <TabsList className="h-7">
                <TabsTrigger
                  value="preview"
                  className="text-xs px-2.5 h-5 gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="markdown"
                  className="text-xs px-2.5 h-5 gap-1"
                >
                  <Code className="h-3 w-3" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {markdown && (
              <div className="flex items-center gap-0.5 ml-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleDownload}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download .md</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleShare}
                      disabled={sharing}
                    >
                      {sharing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share link</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-y-auto pt-0">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Generating documentation...
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                This may take a few seconds
              </p>
            </div>
            <div className="w-full max-w-md space-y-3 mt-4">
              <div className="h-5 w-3/4 shimmer" />
              <div className="h-4 w-full shimmer" />
              <div className="h-4 w-5/6 shimmer" />
              <div className="h-4 w-2/3 shimmer" />
              <div className="h-5 w-1/2 shimmer mt-6" />
              <div className="h-4 w-full shimmer" />
              <div className="h-4 w-4/5 shimmer" />
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
            <pre className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
              {markdown}
            </pre>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted/50 mb-4">
              <Eye className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your generated document will appear here
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Add your input and hit Generate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
