"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileQuestion,
  Plus,
  ClipboardPaste,
  Maximize2,
  FileCode,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewSwitcher } from "./ViewSwitcher";
import { FloatingToolbar } from "./FloatingToolbar";
import { EditorViewMode } from "@/types/studio";
import { cn } from "@/lib/utils";

interface CanvasProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  documentContent: string;
  onDocumentContentChange: (newContent: string) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isEmpty: boolean;
  onInsertFirstQuestion: () => void;
  onOpenPastePanel: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onExecCommand: (cmd: string, val?: string) => void;
  onAskAiWithSelection?: (text: string) => void;
}

export function Canvas({
  iframeRef,
  viewMode,
  onViewModeChange,
  documentContent,
  onDocumentContentChange,
  zoom,
  onZoomChange,
  isEmpty,
  onInsertFirstQuestion,
  onOpenPastePanel,
  currentPage,
  totalPages,
  onPageChange,
  onExecCommand,
  onAskAiWithSelection,
}: CanvasProps) {
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor text selection inside iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleSelection = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        const sel = doc.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const iframeRect = iframe.getBoundingClientRect();

          setFloatingPos({
            top: iframeRect.top + rect.top,
            left: iframeRect.left + rect.left + rect.width / 2,
          });
          setSelectedText(sel.toString().trim());
        } else {
          setFloatingPos(null);
          setSelectedText("");
        }
      } catch {
        setFloatingPos(null);
      }
    };

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.addEventListener("selectionchange", handleSelection);
      doc.addEventListener("mouseup", handleSelection);
    }

    return () => {
      if (doc) {
        doc.removeEventListener("selectionchange", handleSelection);
        doc.removeEventListener("mouseup", handleSelection);
      }
    };
  }, [iframeRef, viewMode]);

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 10, 160));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 10, 60));
  };

  const handleResetZoom = () => {
    onZoomChange(100);
  };

  // Generate page tabs
  const pageList = Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-slate-900/60 dark:bg-[#070b12] overflow-hidden relative select-none"
    >
      {/* Top Workspace Canvas Header */}
      <div className="h-11 border-b border-border bg-surface/80 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-10">
        {/* Left: View Mode Switcher */}
        <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />

        {/* Center: Page Tabs */}
        <div className="hidden sm:flex items-center gap-1 bg-surface-secondary/60 p-1 rounded-xl border border-border/80">
          {pageList.slice(0, 5).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                currentPage === page
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-foreground"
              )}
            >
              Page {page}
            </button>
          ))}
          {pageList.length > 5 && (
            <span className="text-[11px] text-muted px-1.5 font-medium">
              +{pageList.length - 5}
            </span>
          )}
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface-secondary/80 p-0.5 rounded-xl border border-border">
          <button
            onClick={handleZoomOut}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Zoom arrière (-)"
            aria-label="Zoom arrière"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 h-7 rounded-lg text-xs font-semibold text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Réinitialiser zoom à 100%"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
            title="Zoom avant (+)"
            aria-label="Zoom avant"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Toolbar on Text Selection */}
      <FloatingToolbar
        position={floatingPos}
        onExecCommand={onExecCommand}
        onAskAiWithSelection={onAskAiWithSelection}
        selectedText={selectedText}
      />

      {/* Workspace Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        {isEmpty ? (
          /* Empty State */
          <div className="my-auto max-w-md w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-xl shadow-black/10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <FileQuestion className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">
                Votre série de QCM est vide
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Créez votre première question médicale d&apos;annales ou collez directement
                le texte brut de votre concours pour mise en page automatique.
              </p>
            </div>

            <div className="flex flex-col w-full gap-2 pt-2">
              <Button
                variant="default"
                size="default"
                onClick={onInsertFirstQuestion}
                className="w-full gap-2 font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Ajoutez votre première question</span>
              </Button>

              <button
                onClick={onOpenPastePanel}
                className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5 py-1.5 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Coller depuis un texte brut</span>
              </button>
            </div>
          </div>
        ) : viewMode === "code" ? (
          /* Raw HTML Code View */
          <div className="w-full max-w-4xl h-full flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-2 border-b border-border bg-surface-secondary/60 flex items-center justify-between text-xs font-mono text-muted">
              <span>Éditeur de code source HTML (UTF-8)</span>
              <span>{documentContent.length} caractères</span>
            </div>
            <textarea
              value={documentContent}
              onChange={(e) => onDocumentContentChange(e.target.value)}
              className="flex-1 w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed selection:bg-primary/30"
              spellCheck={false}
            />
          </div>
        ) : (
          /* A4 Document Sheet View */
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="w-full max-w-[210mm] min-h-[297mm] flex flex-col relative pb-12"
          >
            <iframe
              ref={iframeRef}
              title="Aperçu Médical A4"
              className={cn(
                "w-[210mm] min-h-[297mm] h-[1050px] bg-white rounded-md shadow-2xl border border-slate-300 dark:border-slate-800 transition-all",
                viewMode === "preview" && "pointer-events-auto"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
