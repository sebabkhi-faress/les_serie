"use client";

import React from "react";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  HelpCircle,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { SaveStatus } from "@/types/studio";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  questionsCount: number;
  currentPage: number;
  totalPages: number;
  hideAnswers: boolean;
  onToggleHideAnswers: () => void;
  saveStatus: SaveStatus;
  lastSavedTime: string;
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}

export function StatusBar({
  questionsCount,
  currentPage,
  totalPages,
  hideAnswers,
  onToggleHideAnswers,
  saveStatus,
  lastSavedTime,
  zoom,
}: StatusBarProps) {
  return (
    <footer className="status-bar h-8 border-t border-border bg-surface px-4 flex items-center justify-between text-xs text-muted select-none flex-shrink-0 z-20">
      {/* Left: Questions Count & Pagination */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span>
            {questionsCount} {questionsCount > 1 ? "Questions" : "Question"}
          </span>
        </div>

        <span className="text-border">•</span>

        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-muted" />
          <span>
            Page {currentPage} sur {Math.max(totalPages, 1)}
          </span>
        </div>
      </div>

      {/* Center: Mode Étude Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleHideAnswers}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-150 cursor-pointer",
            hideAnswers
              ? "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/20 shadow-xs"
              : "bg-surface-secondary text-muted border-border hover:text-foreground"
          )}
          title={hideAnswers ? "Afficher les réponses et justifications" : "Masquer les réponses pour s'entraîner"}
        >
          {hideAnswers ? (
            <>
              <EyeOff className="w-3 h-3 text-amber-500" />
              <span>Mode Étude (Réponses Masquées)</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              <span>Mode Normal (Réponses Visibles)</span>
            </>
          )}
        </button>
      </div>

      {/* Right: Zoom Level & Save Indicator */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 text-[11px]">
          <ZoomIn className="w-3 h-3 text-muted" />
          <span>{zoom}%</span>
        </div>

        <span className="text-border hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5 font-medium">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-success text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>Enregistré {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-warning text-[11px]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Enregistrement...</span>
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1 text-warning text-[11px]">
              <AlertCircle className="w-3 h-3" />
              <span>Non enregistré</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
