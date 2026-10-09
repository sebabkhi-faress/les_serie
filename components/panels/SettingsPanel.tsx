"use client";

import React from "react";
import {
  Settings,
  Shield,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPanelProps {
  studentName: string;
  studentCode: string;
  startPageNumber: number;
  onStudentNameChange: (val: string) => void;
  onStudentCodeChange: (val: string) => void;
  onStartPageNumberChange: (val: number) => void;
  onOpenProtectionModal: () => void;
  onOpenPrintModal?: () => void;
  isProtected?: boolean;
}

export function SettingsPanel({
  studentName,
  studentCode,
  startPageNumber,
  onStudentNameChange,
  onStudentCodeChange,
  onStartPageNumberChange,
  onOpenProtectionModal,
  onOpenPrintModal,
  isProtected = false,
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text font-semibold">
              <Shield className="w-4 h-4 text-primary" />
              <span>Sécurité & Filigrane Nominatif</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isProtected
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-surface-2 text-muted"
              }`}
            >
              {isProtected ? "Actif sur chaque page" : "Non configuré"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">Bénéficiaire :</span>
              <span className="font-semibold text-text truncate max-w-[170px]">{studentName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Matricule :</span>
              <span className="font-mono font-bold text-primary">{studentCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Horodatage :</span>
              <span className="text-muted font-mono text-[10px]">Avec secondes (HH:mm:ss)</span>
            </div>

            <Button
              size="sm"
              variant="default"
              onClick={onOpenProtectionModal}
              className="w-full text-xs font-bold mt-2 gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Gérer & Appliquer les Codes</span>
            </Button>
          </div>
        </div>

        {/* Custom Page Numbering & Print Options */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-text font-semibold">
            <Layers className="w-4 h-4 text-primary" />
            <span>Numérotation & Impression A4</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-2.5">
            <div>
              <label className="block text-muted text-[11px] font-medium mb-1">
                Démarrer la numérotation à la page :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={startPageNumber}
                  onChange={(e) => onStartPageNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-[11px] text-muted">
                  (Ex: 7 si la série commence à la page 7)
                </span>
              </div>
            </div>

            {onOpenPrintModal && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenPrintModal}
                className="w-full text-xs font-semibold gap-1.5 mt-1 cursor-pointer"
              >
                <span>Options d&apos;Impression & PDF</span>
              </Button>
            )}
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
