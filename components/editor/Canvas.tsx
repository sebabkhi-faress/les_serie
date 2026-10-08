"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  FileQuestion,
  Plus,
  ClipboardPaste,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewSwitcher } from "./ViewSwitcher";
import { FloatingToolbar } from "./FloatingToolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditorViewMode } from "@/types/studio";
import { cn } from "@/lib/utils";

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
  onPageChange,
  onExecCommand,
  onAskAiWithSelection,
}: CanvasProps) {
  const [floatingPos, setFloatingPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [showThumbnails, setShowThumbnails] = useState(false);
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

  const pagesArray = Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-bg overflow-hidden relative select-none"
    >
      {/* 1. Canvas Header Bar (h-10) */}
      <div className="h-10 border-b border-border bg-surface px-3 flex items-center justify-between flex-shrink-0 z-10">
        {/* Left: View Mode Switcher + Thumbnails toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
              showThumbnails
                ? "bg-surface-2 text-primary"
                : "text-muted hover:text-text hover:bg-surface-2"
            )}
            title={showThumbnails ? "Masquer les vignettes" : "Afficher les vignettes"}
            aria-label="Vignettes de pages"
          >
            {showThumbnails ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
          </button>

          <ViewSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Center: Fixed Page Navigation [<] [Page 4 / 36 v] [>] */}
        <div className="flex items-center bg-surface-2 rounded-xl p-0.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted cursor-pointer transition-colors"
            title="Page précédente"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="px-2.5 h-7 rounded-lg text-xs font-semibold text-text hover:bg-surface flex items-center gap-1.5 transition-colors cursor-pointer"
                aria-label="Sélectionner une page"
              >
                <span>
                  Page {currentPage} / {Math.max(totalPages, 1)}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="max-h-60 overflow-y-auto w-36 bg-surface border border-border shadow-xl p-1">
              {pagesArray.map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "text-xs cursor-pointer rounded-lg px-2 py-1.5",
                    currentPage === p ? "bg-primary text-[#0B1220] font-bold" : "hover:bg-surface-2 text-text"
                  )}
                >
                  Page {p}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text disabled:opacity-30 disabled:hover:text-muted cursor-pointer transition-colors"
            title="Page suivante"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right placeholder to keep center aligned */}
        <div className="w-20 hidden sm:block" />
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
        {/* Collapsible Left Thumbnails Strip */}
        {showThumbnails && (
          <aside className="w-36 border-r border-border bg-surface flex flex-col p-2 space-y-2 overflow-y-auto shrink-0 z-10 animate-in slide-in-from-left-2 duration-150">
            <div className="text-[11px] font-semibold text-muted px-1 pb-1 border-b border-border">
              Pages ({totalPages})
            </div>
            {pagesArray.map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-full h-24 rounded-lg flex flex-col items-center justify-between p-1.5 cursor-pointer transition-all border",
                  currentPage === p
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border/60 bg-surface-2 hover:border-border"
                )}
              >
                <div className="w-full flex-1 bg-white rounded shadow-2xs opacity-80" />
                <span className="text-[10px] font-semibold text-text mt-1">Page {p}</span>
              </button>
            ))}
          </aside>
        )}

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
