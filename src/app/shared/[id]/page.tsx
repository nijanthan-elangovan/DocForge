"use client";

import { useEffect, useState, use } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Anvil, ArrowLeft, Copy, Check, Download } from "lucide-react";

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
        <div className="gradient-bg" />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto pulse-glow">
            <Anvil className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-sm text-white/40 mt-4">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="gradient-bg" />
        <div className="relative z-10 text-center">
          <p className="text-lg text-white/60 mb-4">Document not found</p>
          <a
            href="/"
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to DocForge
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="gradient-bg" />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              DocForge
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Document */}
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
          <div className="glass p-8 md:p-12">
            <div className="prose-forge">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.markdown}
              </ReactMarkdown>
            </div>
          </div>
          <p className="text-center text-[11px] text-white/20 mt-6">
            Generated with DocForge
          </p>
        </main>
      </div>
    </>
  );
}
