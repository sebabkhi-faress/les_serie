"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

export interface LockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export function LockedModal({
  isOpen,
  onClose,
  feature = "Cette fonctionnalité",
}: LockedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border border-border p-6 rounded-2xl shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-inner">
            <Lock className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-2.5 pt-0.5">
            <DialogHeader className="p-0 space-y-1 text-left">
              <DialogTitle className="text-base font-bold text-text flex items-center gap-2">
                <span>{feature}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  Verrouillé
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted leading-relaxed">
                Cette fonctionnalité ({feature}) est verrouillée sur cette interface.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl bg-surface-2 p-3.5 border border-border/80 text-xs text-text space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Apprentissage direct avec Antigravity</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Vous apprendrez à formuler, corriger et concevoir directement vos QCMs avec <strong>Antigravity</strong> !
              </p>
              <div className="pt-1 border-t border-border/60 text-[11px] text-success flex items-center gap-1.5 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>Séries, Protection HTML & Pages restent 100% accessibles.</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="text-xs font-semibold px-4 cursor-pointer"
          >
            J&apos;ai compris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
