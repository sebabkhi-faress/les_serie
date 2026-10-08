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
  ShieldAlert,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Loader2,
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
  lastSavedTime: string;
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
  lastSavedTime,
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
    <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-30 transition-colors">
      {/* Left: Brand Logo & File Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-sm shadow-primary/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">
                QCM Studio
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 font-semibold">
                Médical
              </Badge>
            </div>
            <span className="text-[11px] text-muted hidden sm:inline">
              Édition & Certification Résidanat
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-border mx-1 hidden md:block" />

        {/* Current Document Name & Protection Badge */}
        <div className="hidden md:flex items-center gap-2 bg-surface-secondary/80 border border-border/80 px-3 py-1.5 rounded-xl">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground max-w-[180px] lg:max-w-[240px] truncate" title={selectedFile}>
            {selectedFile || "Aucune série sélectionnée"}
          </span>

          {isProtected ? (
            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
              <Shield className="w-3 h-3" />
              Protégé
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 text-muted border-border">
              <ShieldAlert className="w-3 h-3 text-warning" />
              Non protégé
            </Badge>
          )}
        </div>
      </div>

      {/* Center: Auto-Save & Status Pill */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Auto-save status */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-warning font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sauvegarde...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-success font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enregistré {lastSavedTime ? `(${lastSavedTime})` : ""}</span>
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1.5 text-warning font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Modifications en attente</span>
            </span>
          )}
        </div>

        {/* Gemini Status Pill */}
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent px-2.5 py-1 rounded-full text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span>Gemini Flash Actif</span>
        </div>
      </div>

      {/* Right: Actions (Theme, Save, ONE primary Exporter dropdown) */}
      <div className="flex items-center gap-2">
        {/* Dark Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Basculer le mode sombre"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Changer de thème (Sombre / Clair)</span>
          </TooltipContent>
        </Tooltip>

        {/* Secondary: Sauvegarder */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={saveStatus === "saving" || !selectedFile}
          className="gap-1.5 text-xs font-semibold h-9"
          title="Sauvegarder (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Sauvegarder</span>
        </Button>

        {/* ONE Primary Action: Exporter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 text-xs font-semibold h-9 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Formats d&apos;exportation</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold">Imprimer / PDF A4</span>
                <span className="text-[10px] text-muted">Impression système optimisée</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDownloadPdf || onPrint} className="gap-2">
              <FileDown className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <span className="font-semibold">Télécharger PDF</span>
                <span className="text-[10px] text-muted">Document A4 vectoriel</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportWord} className="gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="font-semibold">Document Word</span>
                <span className="text-[10px] text-muted">Fichier éditable compatible .docx</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportImage} className="gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-semibold">Image Haute Résolution</span>
                <span className="text-[10px] text-muted">Aperçu PNG pleine page</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDownloadHtml} className="gap-2">
              <Code className="w-4 h-4 text-amber-500" />
              <div className="flex flex-col">
                <span className="font-semibold">Code HTML UTF-8</span>
                <span className="text-[10px] text-muted">Code source avec métadonnées</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Sécurité & Marquage</DropdownMenuLabel>

            <DropdownMenuItem onClick={onOpenProtectionModal} className="gap-2 text-primary font-semibold">
              <Shield className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span>Protéger un PDF</span>
                <span className="text-[10px] text-muted font-normal">Bannière nominative anti-copie</span>
              </div>
            </DropdownMenuItem>

            {onOpenBarcodeModal && (
              <DropdownMenuItem onClick={onOpenBarcodeModal} className="gap-2">
                <QrCode className="w-4 h-4 text-foreground" />
                <div className="flex flex-col">
                  <span>Codes-barres d&apos;examen</span>
                  <span className="text-[10px] text-muted">Identifiant d&apos;épreuve et anonymat</span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
