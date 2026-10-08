"use client";

import React from "react";
import {
  Bot,
  ClipboardPaste,
  ListChecks,
  FolderKanban,
  QrCode,
  Settings,
  Lock,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ActivePanel } from "@/types/studio";
import { cn } from "@/lib/utils";

interface IconRailProps {
  activePanel: ActivePanel;
  onSelectPanel: (panel: ActivePanel) => void;
  onLockedItemClick?: (label: string) => void;
  questionsCount: number;
}

export function IconRail({
  activePanel,
  onSelectPanel,
  onLockedItemClick,
  questionsCount,
}: IconRailProps) {
  const navItems = [
    {
      id: "ai" as const,
      label: "Agent IA",
      description: "Verrouillé — Apprentissage direct avec Antigravity",
      icon: Bot,
      locked: true,
    },
    {
      id: "paste" as const,
      label: "Coller",
      description: "Verrouillé — Import automatique restreint",
      icon: ClipboardPaste,
      locked: true,
    },
    {
      id: "questions" as const,
      label: "Questions",
      description: "Verrouillé — Index questions restreint",
      icon: ListChecks,
      badge: questionsCount,
      locked: true,
    },
    {
      id: "series" as const,
      label: "Séries",
      description: "Documents Supabase Storage & métadonnées",
      icon: FolderKanban,
      locked: false,
    },
    {
      id: "codebars" as const,
      label: "Codes",
      description: "Registre Supabase, protection & codes-barres",
      icon: QrCode,
      locked: false,
    },
    {
      id: "settings" as const,
      label: "Réglages",
      description: "Filigrane, sécurité et mise en page",
      icon: Settings,
      locked: false,
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
                  onClick={() => {
                    if (item.locked) {
                      onLockedItemClick?.(item.label);
                      return;
                    }
                    onSelectPanel(isActive ? null : item.id);
                  }}
                  aria-label={item.label}
                  className={cn(
                    "relative w-14 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-surface-2 text-primary shadow-xs font-semibold"
                      : item.locked
                      ? "text-muted/70 hover:text-text hover:bg-surface-2/40"
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

                  {/* Locked Badge Icon */}
                  {item.locked && (
                    <span
                      className="absolute top-1 right-1 h-4 w-4 rounded-full bg-surface border border-border/80 text-amber-500 flex items-center justify-center shadow-2xs"
                      title="Verrouillé"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}

                  {/* Count badge for unlocked items */}
                  {!item.locked && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[#0B1220] text-[9px] font-black flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex flex-col gap-0.5">
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.locked && (
                    <span className="text-[9px] font-bold text-amber-500 uppercase">
                      🔒 Verrouillé
                    </span>
                  )}
                </span>
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
