"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Sparkles, X, CheckCircle2 } from "lucide-react";

export interface PdfRenderModalProps {
  isOpen: boolean;
  onCancel: () => void;
  current: number;
  total: number;
  percent: number;
  statusText: string;
  filename: string;
  isComplete?: boolean;
}

export function PdfRenderModal({
  isOpen,
  onCancel,
  current,
  total,
  percent,
  statusText,
  filename,
  isComplete = false,
}: PdfRenderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md bg-surface border border-border p-6 rounded-2xl shadow-2xl text-text">
        <div className="flex flex-col items-center text-center">
          {/* Animated Medical / PDF Icon */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-inner">
              {isComplete ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-in zoom-in-75 duration-200" />
              ) : (
                <FileDown className="w-8 h-8 text-primary animate-pulse" />
              )}
            </div>
            {!isComplete && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[9px] font-bold text-white items-center justify-center">
                  ⚡
                </span>
              </span>
            )}
          </div>

          <DialogHeader className="space-y-1 mb-2">
            <DialogTitle className="text-base font-bold text-text">
              {isComplete ? "PDF Prêt & Téléchargé" : "Génération du PDF Haute Définition"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted">
              {isComplete
                ? `Le fichier a été enregistré sous "${filename}"`
                : "Rendu mémoire interne sans ralentissement ni bug Chrome"}
            </DialogDescription>
          </DialogHeader>

          {/* Target File Badge */}
          <div className="w-full bg-surface-2/60 border border-border rounded-xl px-3 py-2 text-[11px] font-mono text-muted flex items-center justify-between mb-4">
            <span className="text-text/70">Fichier de sortie :</span>
            <span className="font-bold text-primary truncate max-w-[220px]">
              {filename}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2 mb-4">
            <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden border border-border/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-200 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary truncate max-w-[260px] text-left">
                {statusText || "Traitement en cours..."}
              </span>
              <span className="font-mono font-bold text-text bg-surface-2 border border-border px-2 py-0.5 rounded-md text-[11px]">
                {percent}%
              </span>
            </div>
          </div>

          {/* Medical Notice */}
          <div className="w-full bg-surface-2/40 border border-border/60 rounded-xl p-2.5 text-[10.5px] text-muted text-left mb-4 leading-relaxed">
            <div className="flex items-center gap-1.5 font-semibold text-text mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Pagination A4 garantie</span>
            </div>
            Découpage dynamique empêchant la troncature des QCMs et préservant les justifications.
          </div>

          {/* Action / Cancel Button */}
          {!isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="w-full text-xs text-muted hover:text-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Annuler la génération
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
