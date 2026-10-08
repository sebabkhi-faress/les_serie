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
} from "lucide-react";
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
}

export function StatusBar({
  questionsCount,
  currentPage,
  totalPages,
  hideAnswers,
  onToggleHideAnswers,
  saveStatus,
  lastSavedTime,
}: StatusBarProps) {
  return (
    <footer className="status-bar h-8 border-t border-border bg-surface px-4 flex items-center justify-between text-xs text-muted select-none flex-shrink-0 z-20">
      {/* Left: Questions Count & Pagination (Single source of truth) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-text">
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

      {/* Center: Mode Étude Single Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleHideAnswers}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer shadow-2xs",
            hideAnswers
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-surface-2 text-muted hover:text-text hover:bg-surface-2/80"
          )}
          title={hideAnswers ? "Afficher les réponses et justifications" : "Masquer les réponses pour s'entraîner"}
        >
          {hideAnswers ? (
            <>
              <EyeOff className="w-3 h-3 text-amber-400" />
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

      {/* Right: Enregistré Single Source of Truth */}
      <div className="flex items-center gap-2 font-medium">
        {saveStatus === "saved" && (
          <span className="flex items-center gap-1.5 text-success text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Enregistré {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
          </span>
        )}
        {saveStatus === "saving" && (
          <span className="flex items-center gap-1.5 text-warning text-[11px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Sauvegarde en cours...</span>
          </span>
        )}
        {saveStatus === "unsaved" && (
          <span className="flex items-center gap-1.5 text-warning text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Modifications non sauvées</span>
          </span>
        )}
      </div>
    </footer>
  );
}
