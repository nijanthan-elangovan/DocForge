"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  PenLine,
  GitFork,
  Loader2,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

type InputMode = "text" | "github";

interface InputAreaProps {
  rawInput: string;
  onInputChange: (input: string) => void;
}

export default function InputArea({ rawInput, onInputChange }: InputAreaProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [repoUrl, setRepoUrl] = useState("");
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [repoName, setRepoName] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          onInputChange(text);
        }
      };
      reader.readAsText(file);
    },
    [onInputChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/html": [".html"],
      "application/json": [".json"],
      "text/csv": [".csv"],
    },
    multiple: false,
    noClick: inputMode === "github",
    noDrag: inputMode === "github",
  });

  const clearFile = () => {
    setFileName(null);
    setRepoName(null);
    onInputChange("");
  };

  const handleFetchRepo = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL", {
        className: "toast-custom",
      });
      return;
    }

    setFetchingRepo(true);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch repository");
      }

      onInputChange(data.content);
      setRepoName(data.repoName);
      toast.success(`Fetched ${data.repoName}`, {
        className: "toast-custom",
        iconTheme: { primary: "#6366f1", secondary: "#fff" },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch repository";
      toast.error(message, { className: "toast-custom" });
    } finally {
      setFetchingRepo(false);
    }
  };

  return (
    <div className="glass fade-in flex flex-col flex-1 min-h-0">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <PenLine className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-white/90">
            Source Input
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Source badge */}
          {(fileName || repoName) && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-white/40 bg-white/[0.04] px-2.5 py-1 rounded-lg">
                {repoName ? (
                  <GitFork className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                {repoName || fileName}
              </span>
              <button
                onClick={clearFile}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
            <button
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                inputMode === "text"
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <FileText className="w-3 h-3" />
              File / Text
            </button>
            <button
              onClick={() => setInputMode("github")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                inputMode === "github"
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <GitFork className="w-3 h-3" />
              GitHub
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
        {inputMode === "text" ? (
          <>
            {/* Drop zone */}
            <div
              {...getRootProps()}
              className={`dropzone flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer transition-all ${
                isDragActive ? "dropzone-active" : ""
              }`}
            >
              <input {...getInputProps()} />
              <Upload
                className={`w-6 h-6 mb-2 transition-colors ${
                  isDragActive ? "text-indigo-400" : "text-white/20"
                }`}
              />
              <p className="text-sm text-white/40">
                {isDragActive
                  ? "Drop your file here..."
                  : "Drop a file or click to upload"}
              </p>
              <p className="text-[11px] text-white/20 mt-1">
                .txt, .md, .html, .json, .csv
              </p>
            </div>

            {/* Text area */}
            <div className="flex-1 min-h-0">
              <textarea
                value={rawInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Or paste your unstructured notes, requirements, specs, or raw documentation here..."
                className="glass-input w-full h-full px-4 py-3 text-sm resize-none leading-relaxed min-h-[200px]"
              />
            </div>
          </>
        ) : (
          <>
            {/* GitHub URL input */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <GitFork className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFetchRepo();
                    }}
                    placeholder="https://github.com/owner/repo"
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  onClick={handleFetchRepo}
                  disabled={fetchingRepo || !repoUrl.trim()}
                  className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {fetchingRepo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {fetchingRepo ? "Fetching..." : "Fetch"}
                  </span>
                </button>
              </div>

              <div className="glass-subtle p-3.5 space-y-2">
                <p className="text-xs text-white/40">
                  Fetches README, config files, and directory structure from public GitHub repos to generate documentation.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["README.md", "package.json", "Directory tree"].map(
                    (item) => (
                      <span
                        key={item}
                        className="text-[10px] text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-md"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Preview of fetched content */}
            <div className="flex-1 min-h-0">
              <textarea
                value={rawInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Fetched repository content will appear here. You can also edit it before generating..."
                className="glass-input w-full h-full px-4 py-3 text-sm resize-none leading-relaxed min-h-[200px] font-mono text-xs"
                readOnly={fetchingRepo}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
