"use client";

import React from "react";
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  BookOpen,
  Hash,
  Eraser,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ToolbarProps {
  onExecCommand: (command: string, value?: string) => void;
  onInsertQuestion: () => void;
  onInsertCourseTitle: () => void;
  onRenumberQuestions: () => void;
}

export function Toolbar({
  onExecCommand,
  onInsertQuestion,
  onInsertCourseTitle,
  onRenumberQuestions,
}: ToolbarProps) {
  const medicalColors = [
    { color: "#0F766E", label: "Bleu/Vert Médical (#0F766E)" },
    { color: "#16A34A", label: "Vert Vrai / Validé (#16A34A)" },
    { color: "#DC2626", label: "Rouge Faux / Erreur (#DC2626)" },
    { color: "#D97706", label: "Ambre Remarque (#D97706)" },
    { color: "#4F46E5", label: "Indigo Spécialité (#4F46E5)" },
    { color: "#0F172A", label: "Noir Texte (#0F172A)" },
  ];

  return (
    <div className="toolbar-container sticky top-0 z-10 w-full bg-surface/95 backdrop-blur-md border-b border-border px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs">
      <div className="flex items-center gap-1.5">
        {/* History: Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("undo")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Annuler (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("redo")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Rétablir (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Text Styling: B, I, U, S, Highlight */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("bold")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors font-bold"
                aria-label="Gras (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Gras (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("italic")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors italic"
                aria-label="Italique (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Italique (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("underline")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors underline"
                aria-label="Souligné (Ctrl+U)"
              >
                <Underline className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Souligné (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("strikeThrough")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors line-through"
                aria-label="Barré"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Barré</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("hiliteColor", "#fef08a")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-surface-hover transition-colors"
                aria-label="Surligner en jaune"
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Surligner (Jaune)</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Headings */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("formatBlock", "<h1>")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Titre 1 (h1)"
              >
                <Heading1 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Titre 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("formatBlock", "<h2>")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Titre 2 (h2)"
              >
                <Heading2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Titre 2</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Couleurs médicales (6 swatches + clear) */}
        <div className="flex items-center gap-1 bg-surface-secondary/60 px-1.5 py-1 rounded-lg border border-border/60">
          {medicalColors.map((item) => (
            <Tooltip key={item.color}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onExecCommand("foreColor", item.color)}
                  style={{ backgroundColor: item.color }}
                  className="h-4.5 w-4.5 rounded-full transition-transform hover:scale-125 focus:scale-125 border border-white/20 shadow-xs cursor-pointer"
                  aria-label={item.label}
                />
              </TooltipTrigger>
              <TooltipContent>{item.label}</TooltipContent>
            </Tooltip>
          ))}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("removeFormat")}
                className="h-5 w-5 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-colors cursor-pointer ml-0.5"
                aria-label="Effacer couleur et formatage"
              >
                <Eraser className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Effacer la couleur</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-5 mx-0.5 hidden xl:block" />

        {/* Lists & Alignment */}
        <div className="hidden xl:flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("insertUnorderedList")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Liste à puces"
              >
                <List className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Liste à puces</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("insertOrderedList")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Liste numérotée"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Liste numérotée</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("justifyLeft")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Aligner à gauche"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Aligner à gauche</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("justifyCenter")}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                aria-label="Centrer"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Centrer</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Structure Group: + Question, Titre Cours, Renuméroter 1..N */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onInsertCourseTitle}
          className="h-8 text-xs font-semibold gap-1 px-2.5 text-foreground hover:text-primary"
        >
          <BookOpen className="w-3.5 h-3.5 text-muted" />
          <span className="hidden sm:inline">Titre Cours</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onRenumberQuestions}
          className="h-8 text-xs font-semibold gap-1 px-2.5 text-foreground hover:text-primary"
          title="Renuméroter toutes les questions de 1 à N automatiquement"
        >
          <Hash className="w-3.5 h-3.5 text-muted" />
          <span className="hidden md:inline">Renuméroter</span>
        </Button>

        <Button
          size="sm"
          variant="default"
          onClick={onInsertQuestion}
          className="h-8 text-xs font-semibold gap-1 px-3 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Question</span>
        </Button>
      </div>
    </div>
  );
}
