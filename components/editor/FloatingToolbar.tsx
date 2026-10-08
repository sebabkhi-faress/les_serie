"use client";

import React from "react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Wand2,
  Check,
  X,
  Palette,
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
      className="floating-toolbar z-50 flex items-center gap-1 bg-surface border border-border shadow-xl shadow-black/25 rounded-xl px-2 py-1 text-foreground animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md"
    >
      <button
        onClick={() => onExecCommand("bold")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
        title="Gras"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("italic")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground italic transition-colors cursor-pointer"
        title="Italique"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("underline")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted hover:text-foreground underline transition-colors cursor-pointer"
        title="Souligné"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onExecCommand("hiliteColor", "#fef08a")}
        className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-surface-hover text-amber-500 transition-colors cursor-pointer"
        title="Surligner"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <Separator orientation="vertical" className="h-4 mx-0.5" />

      {/* Quick medical answers formatting */}
      <button
        onClick={() => onExecCommand("foreColor", "#16A34A")}
        className="h-7 px-1.5 rounded-lg flex items-center gap-1 hover:bg-success/15 text-success transition-colors cursor-pointer text-[11px] font-semibold"
        title="Marquer en Vert Vrai (#16A34A)"
      >
        <span className="w-2 h-2 rounded-full bg-success" />
        <span>Vrai</span>
      </button>

      <button
        onClick={() => onExecCommand("foreColor", "#DC2626")}
        className="h-7 px-1.5 rounded-lg flex items-center gap-1 hover:bg-danger/15 text-danger transition-colors cursor-pointer text-[11px] font-semibold"
        title="Marquer en Rouge Faux (#DC2626)"
      >
        <span className="w-2 h-2 rounded-full bg-danger" />
        <span>Faux</span>
      </button>

      {onAskAiWithSelection && selectedText && (
        <>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <button
            onClick={() => onAskAiWithSelection(selectedText)}
            className="h-7 px-2 rounded-lg flex items-center gap-1 bg-accent/15 hover:bg-accent/25 text-accent transition-colors cursor-pointer text-[11px] font-semibold"
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
