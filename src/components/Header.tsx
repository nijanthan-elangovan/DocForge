"use client";

import { Anvil, Sparkles, Settings2 } from "lucide-react";

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
          <Anvil className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            DocForge
          </h1>
          <p className="text-[11px] text-white/40 -mt-0.5 tracking-wide uppercase">
            AI Documentation Agent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[12px] text-white/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Powered by AI</span>
        </div>
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all text-sm"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}
