"use client";

import React, { useState, useEffect } from "react";
import { FolderPlus, FileCode2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NewSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  defaultName?: string;
}

export function NewSeriesModal({
  isOpen,
  onClose,
  onCreate,
  defaultName = "Nouvelle_Serie.html",
}: NewSeriesModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
  }, [isOpen, defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    const finalName = cleanName.endsWith(".html") ? cleanName : `${cleanName}.html`;
    onCreate(finalName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border border-border shadow-2xl rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1 text-primary">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-text">
                  Nouvelle Série de QCM
                </DialogTitle>
                <DialogDescription className="text-xs text-muted">
                  Création d&apos;un nouveau document dans votre stockage Supabase.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="block text-xs font-semibold text-text">
              Nom du fichier :
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cardiologie_2026.html"
                autoFocus
                className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-text font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-10"
              />
              <FileCode2 className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted">
              Le document sera initialisé avec la structure médicale officielle prête à l&apos;emploi.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="font-medium"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="gap-2 font-bold px-4"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Créer la Série</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
