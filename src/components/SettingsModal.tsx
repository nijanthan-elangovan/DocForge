"use client";

import { useState } from "react";
import {
  BookOpen,
  Users,
  Layout,
  Key,
  Eye,
  EyeOff,
  Cpu,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DocSettings,
  StyleGuide,
  Audience,
  Surface,
  Provider,
  GeminiModel,
  OpenRouterModel,
  STYLE_GUIDE_LABELS,
  AUDIENCE_LABELS,
  SURFACE_LABELS,
  GEMINI_MODEL_LABELS,
  OPENROUTER_MODEL_LABELS,
} from "@/lib/types";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: DocSettings;
  onSettingsChange: (settings: DocSettings) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onSettingsChange,
  apiKey,
  onApiKeyChange,
}: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false);
  const isGemini = settings.provider === "gemini";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Provider */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Provider
            </Label>
            <Tabs
              value={settings.provider}
              onValueChange={(v) =>
                onSettingsChange({ ...settings, provider: v as Provider })
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="gemini" className="flex-1">
                  Google Gemini
                </TabsTrigger>
                <TabsTrigger value="openrouter" className="flex-1">
                  OpenRouter
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <Key className="h-3 w-3" />
              {isGemini ? "Gemini API Key" : "OpenRouter API Key"}
            </Label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={isGemini ? "AIza..." : "sk-or-..."}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/60">
              {isGemini
                ? "Get your key from Google AI Studio"
                : "Get your key from openrouter.ai/keys — free models available"}
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <Cpu className="h-3 w-3" />
              Model
            </Label>
            {isGemini ? (
              <Select
                value={settings.geminiModel}
                onValueChange={(v) =>
                  onSettingsChange({
                    ...settings,
                    geminiModel: v as GeminiModel,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GEMINI_MODEL_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={settings.openrouterModel}
                onValueChange={(v) =>
                  onSettingsChange({
                    ...settings,
                    openrouterModel: v as OpenRouterModel,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OPENROUTER_MODEL_LABELS).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <Separator />

          {/* Style Guide */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <BookOpen className="h-3 w-3" />
              Style Guide
            </Label>
            <Select
              value={settings.styleGuide}
              onValueChange={(v) =>
                onSettingsChange({ ...settings, styleGuide: v as StyleGuide })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STYLE_GUIDE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.styleGuide === "custom" && (
              <Textarea
                value={settings.customStyleGuidePrompt || ""}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    customStyleGuidePrompt: e.target.value,
                  })
                }
                placeholder="Describe your custom style guide rules..."
                className="resize-none h-20"
              />
            )}
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <Users className="h-3 w-3" />
              Audience
            </Label>
            <Select
              value={settings.audience}
              onValueChange={(v) =>
                onSettingsChange({ ...settings, audience: v as Audience })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIENCE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Surface */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              <Layout className="h-3 w-3" />
              Surface
            </Label>
            <Select
              value={settings.surface}
              onValueChange={(v) =>
                onSettingsChange({ ...settings, surface: v as Surface })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SURFACE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
