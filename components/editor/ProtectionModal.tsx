"use client";

import React from "react";
import { Shield, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentCode: string;
  onStudentNameChange: (val: string) => void;
  onStudentCodeChange: (val: string) => void;
  onApplyProtection: () => void;
}

export function ProtectionModal({
  isOpen,
  onClose,
  studentName,
  studentCode,
  onStudentNameChange,
  onStudentCodeChange,
  onApplyProtection,
}: ProtectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="text-text">Protection Anti-Copie Nominative</DialogTitle>
          </div>
          <DialogDescription className="text-muted">
            Appliquez un filigrane de sécurité et une bannière officielle assignée
            nominativement au candidat pour dissuader les fuites et la copie non autorisée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div>
            <label className="block text-text font-semibold mb-1">
              Nom de l&apos;étudiant / Candidat Résident :
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => onStudentNameChange(e.target.value)}
              placeholder="Dr. Nom Prénom"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-text font-semibold mb-1">
              Matricule / Identifiant d&apos;examen :
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => onStudentCodeChange(e.target.value)}
              placeholder="RES-2026-ALG"
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="p-3 rounded-xl bg-surface-2 text-[11px] text-muted space-y-1">
            <span className="font-semibold text-primary block">
              Aperçu de la bannière insérée :
            </span>
            <div className="bg-white text-slate-900 border border-slate-300 p-2 rounded text-[10px] flex justify-between items-center shadow-xs">
              <div>
                <strong className="text-teal-700 block">DOCUMENT SÉCURISÉ & PROTÉGÉ</strong>
                <span>Attribué à : {studentName || "Dr. Médecin Résident"}</span>
              </div>
              <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded text-[9px]">
                STRICTEMENT CONFIDENTIEL
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onApplyProtection}
            className="gap-1.5 font-bold"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Appliquer & Sauvegarder</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
