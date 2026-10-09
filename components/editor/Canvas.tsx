"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  FileQuestion,
  Plus,
  ClipboardPaste,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewSwitcher } from "./ViewSwitcher";
import { FloatingToolbar } from "./FloatingToolbar";
import { EditorViewMode } from "@/types/studio";

interface CanvasProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  viewMode: EditorViewMode;
  onViewModeChange: (mode: EditorViewMode) => void;
  documentContent: string;
  onDocumentContentChange: (newContent: string) => void;
  onIframeLoad?: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isEmpty: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  onInsertFirstQuestion: () => void;
  onOpenPastePanel: () => void;
  onCreateNewSeries?: () => void;
  currentPage: number;
  totalPages: number;
  startPageNumber?: number;
  onStartPageNumberChange?: (val: number) => void;
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
  onIframeLoad,
  zoom,
  onZoomChange,
  isEmpty,
  isLoading = false,
  loadingMessage = "Synchronisation avec Supabase Cloud...",
  onInsertFirstQuestion,
  onOpenPastePanel,
  onCreateNewSeries,
  currentPage,
  totalPages,
  startPageNumber = 1,
  onStartPageNumberChange,
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

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 80;
      // 210mm in pixels at 96dpi is ~794px
      const scale = Math.min(130, Math.max(70, Math.round((containerWidth / 794) * 100)));
      onZoomChange(scale);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-bg overflow-hidden relative select-none"
    >
      {/* 1. Canvas Header Bar (h-10) */}
      <div className="h-10 border-b border-border bg-surface px-3 flex items-center justify-between flex-shrink-0 z-10">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-2">
          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Right Info: HTML format indicator without fake page numbering */}
        <div className="flex items-center gap-2 text-muted text-[11px]">
          <span className="hidden sm:inline">Format A4 Continu (Édition HTML)</span>
        </div>
      </div>

      {/* 2. Floating Toolbar on Text Selection */}
      <FloatingToolbar
        position={floatingPos}
        onExecCommand={onExecCommand}
        onAskAiWithSelection={onAskAiWithSelection}
        selectedText={selectedText}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Canvas Area with A4 Sheet */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start bg-bg relative">
          {/* 1. Loading Overlay: Kept as an overlay so iframe is never unmounted */}
          {isLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/85 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="max-w-sm w-full bg-surface border border-border rounded-2xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-text">Chargement de la série QCM</h3>
                  <p className="text-xs text-muted leading-relaxed">{loadingMessage}</p>
                </div>
                <div className="w-full space-y-2 pt-1 opacity-70">
                  <div className="h-2.5 bg-surface-2 rounded-full w-4/5 mx-auto animate-pulse" />
                  <div className="h-2 bg-surface-2 rounded-full w-3/5 mx-auto animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* 2. Empty State (Only if not loading and actually empty) */}
          {isEmpty && !isLoading ? (
            <div className="my-auto max-w-sm w-full bg-surface border border-border rounded-2xl p-6 text-center shadow-lg flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <FileQuestion className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-text">Série de QCM vide</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Aucun document actif. Créez une nouvelle série ou collez vos annales pour démarrer.
                </p>
              </div>

              <div className="flex flex-col w-full gap-2 pt-2">
                <Button
                  variant="default"
                  size="default"
                  onClick={onCreateNewSeries || onInsertFirstQuestion}
                  className="w-full gap-2 font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer une série de QCMs</span>
                </Button>

                <button
                  onClick={onOpenPastePanel}
                  className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5 py-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Coller depuis un texte brut</span>
                </button>
              </div>
            </div>
          ) : viewMode === "code" ? (
            /* Raw HTML Code View */
            <div className="w-full max-w-4xl h-full flex flex-col bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
              <div className="px-4 py-2 border-b border-border bg-surface-2 flex items-center justify-between text-xs font-mono text-muted">
                <span>Éditeur HTML source (UTF-8)</span>
                <span>{documentContent.length} car.</span>
              </div>
              <textarea
                value={documentContent}
                onChange={(e) => onDocumentContentChange(e.target.value)}
                className="flex-1 w-full bg-surface text-text font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          ) : (
            /* A4 Document Sheet - Always mounted so iframeRef is never null */
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 150ms ease-out",
              }}
              className="w-[210mm] min-h-[297mm] flex flex-col relative pb-16"
            >
              <iframe
                ref={iframeRef}
                title="Document QCM A4"
                onLoad={onIframeLoad}
                className="w-[210mm] min-h-[297mm] h-[1120px] bg-white rounded-md shadow-2xl border-0"
              />
            </div>
          )}
        </div>

        {/* 4. Single Zoom Control (Bottom-Right of Canvas) */}
        <div className="absolute bottom-3 right-4 z-20 flex items-center bg-surface-2 rounded-xl p-0.5 shadow-md border border-border/80">
          <button
            onClick={handleZoomOut}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            title="Zoom arrière (-)"
            aria-label="Zoom arrière"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 h-7 rounded-lg text-xs font-semibold text-text hover:bg-surface transition-colors cursor-pointer"
            title="Réinitialiser zoom à 100%"
          >
            {zoom}%
          </button>

          <button
            onClick={handleZoomIn}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            title="Zoom avant (+)"
            aria-label="Zoom avant"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
