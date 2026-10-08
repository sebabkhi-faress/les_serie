"use client";

import React from "react";
import {
  Settings,
  Shield,
  Type,
  Palette,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPanelProps {
  studentName: string;
  studentCode: string;
  onStudentNameChange: (val: string) => void;
  onStudentCodeChange: (val: string) => void;
  onOpenProtectionModal: () => void;
}

export function SettingsPanel({
  studentName,
  studentCode,
  onStudentNameChange,
  onStudentCodeChange,
  onOpenProtectionModal,
}: SettingsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-3 border-b border-border bg-surface-secondary/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-surface-secondary text-foreground flex items-center justify-center">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Paramètres du Studio</h3>
            <span className="text-[10px] text-muted">
              Mise en page, filigrane et configuration IA
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Security & Watermark defaults */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Shield className="w-4 h-4 text-primary" />
            <span>Sécurité & Filigrane Nominatif</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-muted text-[11px] font-medium mb-1">
                Bénéficiaire par défaut (Résident / Étudiant) :
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => onStudentNameChange(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted text-[11px] font-medium mb-1">
                Matricule / Identifiant d&apos;examen :
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => onStudentCodeChange(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onOpenProtectionModal}
              className="w-full text-xs mt-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              Appliquer le filigrane au document
            </Button>
          </div>
        </div>

        {/* AI Copilot Status */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Assistant IA (Gemini)</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">Modèle par défaut :</span>
              <span className="font-semibold text-accent">gemini-2.5-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Température :</span>
              <span className="font-mono text-foreground">0.2 (Rigueur clinique)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Protocole d&apos;action :</span>
              <span className="font-mono text-emerald-500 font-semibold">json-action v2</span>
            </div>
          </div>
        </div>

        {/* About info */}
        <div className="space-y-2 pt-2 border-t border-border text-[11px] text-muted">
          <div className="flex items-center gap-1.5 text-foreground font-semibold">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>À propos de QCM Studio</span>
          </div>
          <p>
            Plateforme médicale conçue pour la rédaction, la mise en page d&apos;annales et l&apos;export certifié de QCMs de concours médical (Résidanat & Internat).
          </p>
          <div className="text-[10px] text-muted/80">
            Encodage UTF-8 standard garanti • Rendu A4 conforme impression.
          </div>
        </div>
      </div>
    </div>
  );
}
