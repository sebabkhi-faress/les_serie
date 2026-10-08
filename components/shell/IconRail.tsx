"use client";

import React from "react";
import {
  Bot,
  ClipboardPaste,
  ListChecks,
  FolderKanban,
  Settings,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActivePanel } from "@/types/studio";
import { cn } from "@/lib/utils";

interface IconRailProps {
  activePanel: ActivePanel;
  onSelectPanel: (panel: ActivePanel) => void;
  questionsCount: number;
}

export function IconRail({
  activePanel,
  onSelectPanel,
  questionsCount,
}: IconRailProps) {
  const navItems = [
    {
      id: "ai" as const,
      label: "Agent IA",
      description: "Copilote médical et corrections intelligentes (Ctrl+K)",
      icon: Bot,
      color: "text-accent",
      activeBg: "bg-accent/15 text-accent border-accent/40",
    },
    {
      id: "paste" as const,
      label: "Coller & Convertir",
      description: "Importer du texte brut et générer des QCMs",
      icon: ClipboardPaste,
      color: "text-emerald-500",
      activeBg: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
    },
    {
      id: "questions" as const,
      label: "Questions",
      description: "Exploration des QCMs du document actif",
      icon: ListChecks,
      badge: questionsCount,
      color: "text-primary",
      activeBg: "bg-primary/15 text-primary border-primary/40",
    },
    {
      id: "series" as const,
      label: "Série & Fichiers",
      description: "Gestion des documents Supabase & métadonnées",
      icon: FolderKanban,
      color: "text-amber-500",
      activeBg: "bg-amber-500/15 text-amber-500 border-amber-500/40",
    },
    {
      id: "settings" as const,
      label: "Paramètres",
      description: "Mise en page, filigrane et configuration",
      icon: Settings,
      color: "text-muted",
      activeBg: "bg-surface-secondary text-foreground border-border",
    },
  ];

  return (
    <aside className="icon-rail w-[72px] h-[calc(100vh-56px-32px)] border-r border-border bg-surface flex flex-col items-center py-4 justify-between flex-shrink-0 z-20 transition-all select-none">
      <div className="flex flex-col items-center gap-3 w-full">
        {navItems.map((item) => {
          const isActive = activePanel === item.id;
          const Icon = item.icon;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectPanel(isActive ? null : item.id)}
                  aria-label={item.label}
                  className={cn(
                    "relative group w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 outline-none border",
                    isActive
                      ? cn("shadow-md", item.activeBg)
                      : "border-transparent text-muted hover:text-foreground hover:bg-surface-hover"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "scale-105")} />
                  <span className="text-[9px] font-semibold tracking-tighter mt-1 opacity-90 truncate max-w-[48px] px-0.5">
                    {item.label.split(" ")[0]}
                  </span>

                  {/* Active Indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary" />
                  )}

                  {/* Count badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-0.5">
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-[11px] text-muted">{item.description}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="flex flex-col items-center text-center">
        <span className="text-[9px] font-bold tracking-wider text-muted uppercase">
          v2.5
        </span>
      </div>
    </aside>
  );
}
