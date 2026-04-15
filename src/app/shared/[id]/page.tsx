"use client";

import { useEffect, useState, use } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Anvil, ArrowLeft, Copy, Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SharedDoc {
  markdown: string;
  title: string;
  createdAt: number;
}

export default function SharedDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/share?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Document not found");
        return res.json();
      })
      .then(setDoc)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = async () => {
    if (!doc) return;
    await navigator.clipboard.writeText(doc.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!doc) return;
    const blob = new Blob([doc.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title || "document"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="relative z-10 text-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ambient-glow" />
        <div className="relative z-10 text-center">
          <p className="text-base text-muted-foreground mb-4">
            Document not found
          </p>
          <Button variant="outline" asChild>
            <a href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to DocForge
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ambient-glow" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
          <div className="flex h-14 items-center justify-between px-4 sm:px-6">
            <a
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Anvil className="h-4 w-4" />
              DocForge
            </a>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <Card>
            <CardContent className="p-6 sm:p-10">
              <div className="prose-forge">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {doc.markdown}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
            Generated with DocForge
          </p>
        </main>
      </div>
    </>
  );
}
