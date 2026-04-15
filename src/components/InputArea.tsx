"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  GitFork,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InputMode = "text" | "github";

interface InputAreaProps {
  rawInput: string;
  onInputChange: (input: string) => void;
}

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  if (chars < 1_000_000) return `${(chars / 1000).toFixed(1)}K chars`;
  return `${(chars / 1_000_000).toFixed(1)}M chars`;
}

export default function InputArea({ rawInput, onInputChange }: InputAreaProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [repoUrl, setRepoUrl] = useState("");
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [repoName, setRepoName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const hasContent = rawInput.length > 0;
  const isLarge = rawInput.length > 500;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setFileName(file.name);
      setExpanded(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") onInputChange(text);
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
    setExpanded(false);
    onInputChange("");
  };

  const handleFetchRepo = async () => {
    if (!repoUrl.trim()) {
      toast.error("Please enter a GitHub repository URL");
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
      if (!res.ok) throw new Error(data.error || "Failed to fetch repository");
      onInputChange(data.content);
      setRepoName(data.repoName);
      setExpanded(false);
      toast.success(`Fetched ${data.repoName}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch repository";
      toast.error(message);
    } finally {
      setFetchingRepo(false);
    }
  };

  // Collapsed content preview: show first few lines
  const previewLines = rawInput.split("\n").slice(0, 6).join("\n");
  const previewText =
    rawInput.length > 300 ? rawInput.slice(0, 300) + "..." : previewLines;

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium shrink-0">
            Source Input
          </CardTitle>

          <div className="flex items-center gap-1.5 min-w-0">
            {hasContent && (
              <Badge
                variant="outline"
                className="text-[10px] font-normal text-muted-foreground/60 px-1.5 py-0 shrink-0"
              >
                {formatSize(rawInput.length)}
              </Badge>
            )}

            {(fileName || repoName) && (
              <>
                <Badge
                  variant="secondary"
                  className="gap-1 text-[10px] font-normal max-w-[120px] shrink min-w-0"
                >
                  {repoName ? (
                    <GitFork className="h-2.5 w-2.5 shrink-0" />
                  ) : (
                    <FileText className="h-2.5 w-2.5 shrink-0" />
                  )}
                  <span className="truncate">{repoName || fileName}</span>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={clearFile}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}

            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as InputMode)}
              className="shrink-0"
            >
              <TabsList className="h-7">
                <TabsTrigger value="text" className="text-xs px-2 h-5 gap-1">
                  <FileText className="h-3 w-3" />
                  File
                </TabsTrigger>
                <TabsTrigger
                  value="github"
                  className="text-xs px-2 h-5 gap-1"
                >
                  <GitFork className="h-3 w-3" />
                  GitHub
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col min-h-0 gap-3 pt-0">
        {inputMode === "text" ? (
          <>
            {/* Drop zone — hide when content loaded */}
            {!hasContent && (
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 px-4 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-muted-foreground/25 hover:bg-muted/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload
                  className={`h-5 w-5 mb-2 ${
                    isDragActive ? "text-primary" : "text-muted-foreground/40"
                  }`}
                />
                <p className="text-xs text-muted-foreground">
                  {isDragActive
                    ? "Drop your file here..."
                    : "Drop a file or click to upload"}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  .txt .md .html .json .csv
                </p>
              </div>
            )}

            {/* Textarea — full when no content or expanded, collapsed preview otherwise */}
            {!hasContent || !isLarge || expanded ? (
              <Textarea
                value={rawInput}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Or paste your unstructured notes, requirements, specs, or raw documentation here..."
                className={`resize-none text-sm leading-relaxed ${
                  expanded ? "min-h-[220px] max-h-[350px]" : "min-h-[180px]"
                }`}
              />
            ) : (
              <div className="relative">
                <pre className="rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-hidden">
                  {previewText}
                </pre>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent rounded-b-md" />
              </div>
            )}

            {/* Expand/collapse for loaded content */}
            {hasContent && isLarge && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand to edit ({formatSize(rawInput.length)})
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <GitFork className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchRepo()}
                  placeholder="https://github.com/owner/repo"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <Button
                onClick={handleFetchRepo}
                disabled={fetchingRepo || !repoUrl.trim()}
                size="sm"
                className="h-9 px-3"
              >
                {fetchingRepo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                <span className="ml-1.5">
                  {fetchingRepo ? "Fetching" : "Fetch"}
                </span>
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground/50">
              Fetches README, config files, and directory structure from public
              repos.
            </p>

            {/* Collapsed preview for fetched content */}
            {hasContent && !expanded ? (
              <>
                <div className="relative">
                  <pre className="rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-hidden">
                    {previewText}
                  </pre>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent rounded-b-md" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground"
                  onClick={() => setExpanded(true)}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand to edit ({formatSize(rawInput.length)})
                </Button>
              </>
            ) : (
              <>
                <Textarea
                  value={rawInput}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder="Fetched repository content will appear here..."
                  className="resize-none text-xs font-mono leading-relaxed min-h-[180px] max-h-[350px]"
                  readOnly={fetchingRepo}
                />
                {hasContent && isLarge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => setExpanded(false)}
                  >
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Collapse
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
