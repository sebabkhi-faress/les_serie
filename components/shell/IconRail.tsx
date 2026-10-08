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
    },
    {
      id: "paste" as const,
      label: "Coller",
      description: "Importer du texte brut et générer des QCMs",
      icon: ClipboardPaste,
    },
    {
      id: "questions" as const,
      label: "Questions",
      description: "Index et navigation rapide des QCMs",
      icon: ListChecks,
      badge: questionsCount,
    },
    {
      id: "series" as const,
      label: "Séries",
      description: "Documents Supabase Storage & métadonnées",
      icon: FolderKanban,
    },
    {
      id: "settings" as const,
      label: "Réglages",
      description: "Filigrane, sécurité et mise en page",
      icon: Settings,
    },
  ];

  return (
    <aside className="icon-rail w-[72px] h-[calc(100vh-56px-32px)] border-r border-border bg-surface flex flex-col items-center py-3 justify-between flex-shrink-0 z-20 select-none">
      <div className="flex flex-col items-center gap-2 w-full">
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
                    "relative w-14 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-surface-2 text-primary shadow-xs font-semibold"
                      : "text-muted hover:text-text hover:bg-surface-2/60"
                  )}
                >
                  <Icon className="w-[22px] h-[22px] shrink-0" />
                  <span className="text-[11px] leading-tight tracking-tight mt-0.5">
                    {item.label}
                  </span>

                  {/* Active Indicator on left border */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                  )}

                  {/* Count badge: 16px, top-right corner, not overlapping icon */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[#0B1220] text-[9px] font-black flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-0.5">
                <span className="font-semibold text-text">{item.label}</span>
                <span className="text-[10px] text-muted">{item.description}</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Bottom version pill */}
      <div className="text-[10px] font-bold text-muted/60">
        v2.5
      </div>
    </aside>
  );
}
