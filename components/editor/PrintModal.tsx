"use client";

import React, { useState } from "react";
import {
  Printer,
  FileDown,
  Shield,
  Layers,
  Check,
  FileText,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Code,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchPrint: (options: {
    repeatProtection: boolean;
    pageNumbering: boolean;
    startPage: number;
    hideAnswers: boolean;
    useNativePrint?: boolean;
  }) => void;
  startPageNumber: number;
  onStartPageNumberChange: (val: number) => void;
  isProtected: boolean;
  studentName?: string;
  studentCode?: string;
  onExportWord?: () => void;
  onDownloadHtml?: () => void;
  selectedFile?: string;
}

export function PrintModal({
  isOpen,
  onClose,
  onLaunchPrint,
  startPageNumber,
  onStartPageNumberChange,
  isProtected,
  studentName = "Dr. Médecin Résident",
  studentCode = "714415235521",
  onExportWord,
  onDownloadHtml,
}: PrintModalProps) {
  const [repeatProtection, setRepeatProtection] = useState<boolean>(true);
  const [pageNumbering, setPageNumbering] = useState<boolean>(true);
  const [localStartPage, setLocalStartPage] = useState<number>(startPageNumber || 1);
  const [hideAnswers, setHideAnswers] = useState<boolean>(false);

  // Sync with prop when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalStartPage(startPageNumber || 1);
    }
  }, [isOpen, startPageNumber]);

  const handleConfirmPrint = () => {
    onStartPageNumberChange(Math.max(1, localStartPage));
    onLaunchPrint({
      repeatProtection,
      pageNumbering,
      startPage: Math.max(1, localStartPage),
      hideAnswers,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border border-border p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 bg-surface-2/40 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-text">
                Options d&apos;Impression & PDF A4
              </DialogTitle>
              <DialogDescription className="text-xs text-muted">
                Numérotation, filigrane sur chaque page et mode d&apos;examen
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* 1. Sécurité & Protection sur toutes les pages */}
          <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-text">
                <Shield className="w-4 h-4 text-primary" />
                <span>Protéger chaque page A4</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeatProtection}
                  onChange={(e) => setRepeatProtection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Répète la bannière nominative, le matricule et le code-barres avec l&apos;heure précise (
              <span className="text-primary font-mono font-semibold">HH:mm:ss</span>) en haut de{" "}
              <strong>chaque page imprimée</strong>.
            </p>
            {isProtected && (
              <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Bénéficiaire :</span>
                <span className="font-semibold text-text truncate max-w-[200px]">
                  {studentName} • {studentCode}
                </span>
              </div>
            )}
          </div>

          {/* 2. Numérotation des pages */}
          <div className="p-3.5 rounded-xl bg-surface-2/60 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-text">
                <Layers className="w-4 h-4 text-primary" />
                <span>Numérotation des pages A4</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pageNumbering}
                  onChange={(e) => setPageNumbering(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {pageNumbering && (
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-muted">Démarrer la numérotation à la page :</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={localStartPage}
                    onChange={(e) => setLocalStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-surface border border-border rounded-lg px-2 py-1 text-center font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Mode d'impression : Série Complète vs Mode Étudiant (Masquer réponses) */}
          <div className="space-y-2">
            <label className="block font-semibold text-text text-[11px]">
              Contenu de la série imprimée :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHideAnswers(false)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  !hideAnswers
                    ? "bg-primary/10 border-primary text-text shadow-xs"
                    : "bg-surface-2 border-border text-muted hover:text-text hover:bg-surface-2/80"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Eye className={`w-3.5 h-3.5 ${!hideAnswers ? "text-primary" : "text-muted"}`} />
                  <span>Série Corrigée</span>
                </div>
                <span className="text-[10px] text-muted leading-tight">
                  Avec réponses & justifications
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHideAnswers(true)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  hideAnswers
                    ? "bg-primary/10 border-primary text-text shadow-xs"
                    : "bg-surface-2 border-border text-muted hover:text-text hover:bg-surface-2/80"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <EyeOff className={`w-3.5 h-3.5 ${hideAnswers ? "text-primary" : "text-muted"}`} />
                  <span>Mode Étudiant</span>
                </div>
                <span className="text-[10px] text-muted leading-tight">
                  Masquer réponses (examen blanc)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer & Bouton principal */}
        <div className="p-4 bg-surface-2/40 border-t border-border flex flex-col gap-2.5">
          <Button
            variant="default"
            size="default"
            onClick={handleConfirmPrint}
            className="w-full gap-2 font-bold cursor-pointer py-2.5 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lancer l&apos;enregistrement en PDF (Rendu Interne HD)</span>
          </Button>

          <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-muted">
            <button
              type="button"
              onClick={() => {
                onStartPageNumberChange(Math.max(1, localStartPage));
                onLaunchPrint({
                  repeatProtection,
                  pageNumbering,
                  startPage: Math.max(1, localStartPage),
                  hideAnswers,
                  useNativePrint: true,
                });
              }}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              title="Ouvre la boîte de dialogue standard du navigateur si nécessaire"
            >
              <Printer className="w-3 h-3" />
              <span>Imprimer via le navigateur (Ctrl+P)</span>
            </button>

            <div className="flex items-center gap-3">
              {onExportWord && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExportWord();
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>Word</span>
                </button>
              )}
              {onDownloadHtml && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDownloadHtml();
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Code className="w-3 h-3" />
                  <span>HTML</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
