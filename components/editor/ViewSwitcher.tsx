"use client";

import React from "react";
import { Edit3, Eye, Code } from "lucide-react";
import { EditorViewMode } from "@/types/studio";
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
}

export function ViewSwitcher({
  viewMode,
  onViewModeChange,
}: ViewSwitcherProps) {
  return (
    <div className="flex items-center bg-surface-2 p-0.5 rounded-xl">
      <button
        onClick={() => onViewModeChange("edit")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "edit"
            ? "bg-surface text-primary shadow-xs"
            : "text-muted hover:text-text"
        )}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Édition</span>
      </button>

      <button
        onClick={() => onViewModeChange("preview")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "preview"
            ? "bg-surface text-primary shadow-xs"
            : "text-muted hover:text-text"
        )}
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Aperçu A4</span>
      </button>

      <button
        onClick={() => onViewModeChange("code")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
          viewMode === "code"
            ? "bg-surface text-primary shadow-xs"
            : "text-muted hover:text-text"
        )}
      >
        <Code className="w-3.5 h-3.5" />
        <span>Code HTML</span>
      </button>
    </div>
  );
}
