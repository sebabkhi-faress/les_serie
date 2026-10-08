"use client";

import React from "react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Wand2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FloatingToolbarProps {
  position: { top: number; left: number } | null;
  onExecCommand: (cmd: string, val?: string) => void;
  onAskAiWithSelection?: (selectedText: string) => void;
  selectedText?: string;
}

export function FloatingToolbar({
  position,
  onExecCommand,
  onAskAiWithSelection,
  selectedText,
}: FloatingToolbarProps) {
  if (!position) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translate(-50%, -100%) translateY(-10px)",
      }}
      className="floating-toolbar z-50 flex items-center gap-1 bg-surface border border-border shadow-xl rounded-xl px-2 py-1 text-text animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md"
    >
      <button
        onClick={() => onExecCommand("bold")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-2 text-muted hover:text-text font-bold transition-colors cursor-pointer"
        title="Gras"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("italic")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-2 text-muted hover:text-text italic transition-colors cursor-pointer"
        title="Italique"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("underline")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-2 text-muted hover:text-text underline transition-colors cursor-pointer"
        title="Souligné"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("hiliteColor", "#fef08a")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-2 text-amber-400 transition-colors cursor-pointer"
        title="Surligner"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <Separator orientation="vertical" className="h-4 mx-0.5 bg-border" />

      {/* Quick medical answers formatting */}
      <button
        onClick={() => onExecCommand("foreColor", "#16A34A")}
        className="h-7 px-2 rounded-lg flex items-center gap-1 hover:bg-success/20 text-success transition-colors cursor-pointer text-[11px] font-bold"
        title="Marquer en Vert Vrai (#16A34A)"
      >
        <span className="w-2 h-2 rounded-full bg-success" />
        <span>Vrai</span>
      </button>

      <button
        onClick={() => onExecCommand("foreColor", "#DC2626")}
        className="h-7 px-2 rounded-lg flex items-center gap-1 hover:bg-danger/20 text-danger transition-colors cursor-pointer text-[11px] font-bold"
        title="Marquer en Rouge Faux (#DC2626)"
      >
        <span className="w-2 h-2 rounded-full bg-danger" />
        <span>Faux</span>
      </button>

      {onAskAiWithSelection && selectedText && (
        <>
          <Separator orientation="vertical" className="h-4 mx-0.5 bg-border" />
          <button
            onClick={() => onAskAiWithSelection(selectedText)}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1 bg-accent/20 hover:bg-accent/30 text-accent transition-colors cursor-pointer text-[11px] font-bold"
            title="Demander à l'IA de corriger la sélection"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Corriger IA</span>
          </button>
        </>
      )}
    </div>
  );
}
