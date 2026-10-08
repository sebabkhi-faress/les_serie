"use client";

import React from "react";
import {
  Sparkles,
  Save,
  Download,
  Printer,
  FileDown,
  FileText,
  Image as ImageIcon,
  Code,
  QrCode,
  Shield,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SaveStatus } from "@/types/studio";

interface TopBarProps {
  selectedFile: string;
  isProtected: boolean;
  saveStatus: SaveStatus;
  lastSavedTime?: string;
  onSave: () => void;
  onPrint: () => void;
  onDownloadHtml: () => void;
  onDownloadPdf?: () => void;
  onExportWord?: () => void;
  onExportImage?: () => void;
  onOpenProtectionModal: () => void;
  onOpenBarcodeModal?: () => void;
}

export function TopBar({
  selectedFile,
  isProtected,
  saveStatus,
  onSave,
  onPrint,
  onDownloadHtml,
  onDownloadPdf,
  onExportWord,
  onExportImage,
  onOpenProtectionModal,
  onOpenBarcodeModal,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between flex-shrink-0 z-30 transition-colors select-none">
      {/* Left: Brand Logo & File Name as Plain Text */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-[#0B1220]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-text">
              QCM Studio
            </span>
            <span className="text-[10px] font-semibold text-muted bg-surface-2 px-1.5 py-0.5 rounded">
              Pro
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />

        {/* Current Document Name & Protection Badge (plain text, no outline box) */}
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0 hidden sm:block" />
          <span
            className="text-xs font-medium text-text truncate max-w-[200px] md:max-w-[280px]"
            title={selectedFile || "Aucune série"}
          >
            {selectedFile || "Nouvelle Série"}
          </span>

          {isProtected ? (
            <Badge variant="success" className="shrink-0 text-[10px] px-1.5 py-0">
              <Shield className="w-2.5 h-2.5" />
              Protégé
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0 text-[10px] px-1.5 py-0">
              Non protégé
            </Badge>
          )}
        </div>
      </div>

      {/* Center: Save Dot & Gemini Status (No duplicate text) */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        {/* Auto-save small indicator dot */}
        <div className="flex items-center gap-1.5 text-muted">
          <span
            className={`w-2 h-2 rounded-full ${
              saveStatus === "saving"
                ? "bg-warning animate-ping"
                : saveStatus === "saved"
                ? "bg-success"
                : "bg-warning"
            }`}
          />
          <span className="text-[11px]">
            {saveStatus === "saving"
              ? "Sauvegarde..."
              : saveStatus === "saved"
              ? "Synchronisé"
              : "Modifications en cours"}
          </span>
        </div>

        {/* Gemini status: small dot + text */}
        <div className="flex items-center gap-1.5 text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-medium text-text">Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Right: Actions (Theme, Save, ONE primary Exporter dropdown) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Changer le thème"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-text" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-text" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mode clair / sombre</TooltipContent>
        </Tooltip>

        {/* Secondary: Sauvegarder (filled surface, no outline) */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={saveStatus === "saving" || !selectedFile}
          className="gap-1.5 text-xs font-semibold h-8"
          title="Sauvegarder (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Sauvegarder</span>
        </Button>

        {/* ONE Primary: Exporter dropdown (filled teal, no outline) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 text-xs font-bold h-8"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface border border-border shadow-xl">
            <DropdownMenuLabel className="text-muted text-[11px]">Formats d&apos;exportation</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={onPrint} className="gap-2 cursor-pointer hover:bg-surface-2">
              <Printer className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold text-text">Imprimer / PDF A4</span>
                <span className="text-[10px] text-muted">Impression système sans chrome</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDownloadPdf || onPrint} className="gap-2 cursor-pointer hover:bg-surface-2">
              <FileDown className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <span className="font-semibold text-text">Télécharger PDF</span>
                <span className="text-[10px] text-muted">Document A4 vectoriel</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportWord} className="gap-2 cursor-pointer hover:bg-surface-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="font-semibold text-text">Document Word (.doc)</span>
                <span className="text-[10px] text-muted">Compatible Microsoft Word</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportImage} className="gap-2 cursor-pointer hover:bg-surface-2">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="font-semibold text-text">Image Haute Résolution</span>
                <span className="text-[10px] text-muted">Capture de page A4</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDownloadHtml} className="gap-2 cursor-pointer hover:bg-surface-2">
              <Code className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="font-semibold text-text">Code HTML UTF-8</span>
                <span className="text-[10px] text-muted">Code source avec métadonnées</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            <DropdownMenuLabel className="text-muted text-[11px]">Sécurité & Examen</DropdownMenuLabel>

            <DropdownMenuItem onClick={onOpenProtectionModal} className="gap-2 cursor-pointer hover:bg-surface-2 text-primary font-semibold">
              <Shield className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span>Protéger un PDF</span>
                <span className="text-[10px] text-muted font-normal">Bannière nominative anti-copie</span>
              </div>
            </DropdownMenuItem>

            {onOpenBarcodeModal && (
              <DropdownMenuItem onClick={onOpenBarcodeModal} className="gap-2 cursor-pointer hover:bg-surface-2">
                <QrCode className="w-4 h-4 text-text" />
                <div className="flex flex-col">
                  <span className="font-semibold text-text">Codes-barres d&apos;examen</span>
                  <span className="text-[10px] text-muted">Anonymat et numérisation</span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
