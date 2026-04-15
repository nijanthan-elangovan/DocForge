"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  Layout,
  Key,
  Eye,
  EyeOff,
  X,
  Cpu,
  Zap,
} from "lucide-react";
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
  PROVIDER_LABELS,
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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const isGemini = settings.provider === "gemini";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto glass fade-in shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[rgba(10,10,26,0.85)] backdrop-blur-xl z-10">
          <h2 className="text-base font-semibold text-white/90">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Provider Toggle */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Provider
            </label>
            <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5">
              {(Object.entries(PROVIDER_LABELS) as [Provider, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() =>
                      onSettingsChange({ ...settings, provider: value })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                      settings.provider === value
                        ? "bg-white/[0.08] text-white/90"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5" />
              {isGemini ? "Gemini API Key" : "OpenRouter API Key"}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={isGemini ? "AIza..." : "sk-or-..."}
                className="glass-input w-full px-3.5 py-2.5 pr-10 text-sm"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-white/25">
              {isGemini ? (
                <>
                  Get your key from{" "}
                  <span className="text-indigo-400/60">Google AI Studio</span>
                </>
              ) : (
                <>
                  Get your key from{" "}
                  <span className="text-indigo-400/60">openrouter.ai/keys</span>
                  {" — free models available"}
                </>
              )}
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              Model
            </label>
            {isGemini ? (
              <select
                value={settings.geminiModel}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    geminiModel: e.target.value as GeminiModel,
                  })
                }
                className="glass-select w-full"
              >
                {Object.entries(GEMINI_MODEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={settings.openrouterModel}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    openrouterModel: e.target.value as OpenRouterModel,
                  })
                }
                className="glass-select w-full"
              >
                {Object.entries(OPENROUTER_MODEL_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            )}
          </div>

          <hr className="border-white/[0.06]" />

          {/* Style Guide */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              Style Guide
            </label>
            <select
              value={settings.styleGuide}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  styleGuide: e.target.value as StyleGuide,
                })
              }
              className="glass-select w-full"
            >
              {Object.entries(STYLE_GUIDE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {settings.styleGuide === "custom" && (
              <textarea
                value={settings.customStyleGuidePrompt || ""}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    customStyleGuidePrompt: e.target.value,
                  })
                }
                placeholder="Describe your custom style guide rules..."
                className="glass-input w-full px-3.5 py-2.5 text-sm resize-none h-20"
              />
            )}
          </div>

          {/* Audience */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              Audience
            </label>
            <select
              value={settings.audience}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  audience: e.target.value as Audience,
                })
              }
              className="glass-select w-full"
            >
              {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Surface */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-white/50 uppercase tracking-wider">
              <Layout className="w-3.5 h-3.5" />
              Surface
            </label>
            <select
              value={settings.surface}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  surface: e.target.value as Surface,
                })
              }
              className="glass-select w-full"
            >
              {Object.entries(SURFACE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] sticky bottom-0 bg-[rgba(10,10,26,0.85)] backdrop-blur-xl">
          <button
            onClick={onClose}
            className="btn-primary w-full py-2.5 text-sm font-medium"
          >
            <span className="relative z-10">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
