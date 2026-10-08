"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (val: string) => void;
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  label,
  defaultValue = "",
  placeholder = "",
  submitText = "Valider",
  cancelText = "Annuler",
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-surface border border-border p-6 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1 pt-0.5">
              <DialogTitle className="text-sm font-bold text-text leading-tight">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-xs text-muted leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {label && (
              <label className="text-[11px] font-semibold text-muted">
                {label}
              </label>
            )}
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!value.trim()}
              className="text-xs font-bold"
            >
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
