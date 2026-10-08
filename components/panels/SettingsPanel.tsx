"use client";

import React from "react";
import {
  Settings,
  Shield,
  Sparkles,
  Info,
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
    <div className="flex flex-col h-full bg-surface select-none">
      <div className="p-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-surface-2 text-text flex items-center justify-center">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Réglages du Studio</h3>
            <span className="text-[10px] text-muted">
              Filigrane, sécurité et configuration IA
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Security & Watermark defaults */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text font-semibold">
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
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenProtectionModal}
              className="w-full text-xs font-semibold mt-1"
            >
              Appliquer le filigrane au document
            </Button>
          </div>
        </div>

        {/* AI Copilot Status */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-text font-semibold">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Assistant IA (Gemini)</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">Modèle par défaut :</span>
              <span className="font-semibold text-accent">gemini-2.5-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Température :</span>
              <span className="font-mono text-text">0.2 (Rigueur clinique)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Protocole d&apos;action :</span>
              <span className="font-mono text-emerald-400 font-semibold">json-action v2</span>
            </div>
          </div>
        </div>

        {/* About info */}
        <div className="space-y-2 pt-2 border-t border-border text-[11px] text-muted">
          <div className="flex items-center gap-1.5 text-text font-semibold">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>À propos de QCM Studio</span>
          </div>
          <p>
            Plateforme médicale pour la rédaction d&apos;annales, l&apos;export certifié A4 et l&apos;assistance IA de concours de Résidanat & Internat.
          </p>
        </div>
      </div>
    </div>
  );
}
