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
  Plus,
  BookOpen,
  Hash,
  Palette,
  ChevronDown,
  MoreHorizontal,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Eraser,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    { color: "#0F766E", label: "Bleu/Vert Médical" },
    { color: "#16A34A", label: "Vert Vrai / Validé" },
    { color: "#DC2626", label: "Rouge Faux / Erreur" },
    { color: "#D97706", label: "Ambre Remarque" },
    { color: "#4F46E5", label: "Indigo Spécialité" },
    { color: "#0F172A", label: "Noir Texte" },
  ];

  return (
    <div className="toolbar-container h-10 border-b border-border bg-surface px-3 flex items-center justify-between gap-2 flex-shrink-0 z-10 select-none">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* 1. Undo / Redo */}
        <div className="flex items-center bg-surface-2 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("undo")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                aria-label="Annuler (Ctrl+Z)"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Annuler (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("redo")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                aria-label="Rétablir (Ctrl+Y)"
              >
                <Redo className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Rétablir (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* 2. Text Formatting: B, I, U, S, Highlight */}
        <div className="flex items-center bg-surface-2 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("bold")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface font-bold transition-colors cursor-pointer"
                aria-label="Gras (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Gras (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("italic")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface italic transition-colors cursor-pointer"
                aria-label="Italique (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Italique (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("underline")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface underline transition-colors cursor-pointer"
                aria-label="Souligné (Ctrl+U)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Souligné (Ctrl+U)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("strikeThrough")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface line-through transition-colors cursor-pointer"
                aria-label="Barré"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Barré</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("hiliteColor", "#fef08a")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-amber-400 hover:bg-surface transition-colors cursor-pointer"
                aria-label="Surligner"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Surligner (Jaune)</TooltipContent>
          </Tooltip>
        </div>

        {/* 3. Headings: H1, H2 */}
        <div className="flex items-center bg-surface-2 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("formatBlock", "<h1>")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                aria-label="Titre 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Titre 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onExecCommand("formatBlock", "<h2>")}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                aria-label="Titre 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Titre 2</TooltipContent>
          </Tooltip>
        </div>

        {/* 4. Colors Popover */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 px-2 rounded-lg bg-surface-2 text-muted hover:text-text flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label="Palette de couleurs médicales"
                >
                  <Palette className="w-3.5 h-3.5 text-primary" />
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Couleurs médicales</TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="p-2 bg-surface border border-border shadow-xl">
            <DropdownMenuLabel className="text-[11px] text-muted">Couleurs Médicales</DropdownMenuLabel>
            <div className="grid grid-cols-3 gap-1.5 p-1">
              {medicalColors.map((item) => (
                <button
                  key={item.color}
                  onClick={() => onExecCommand("foreColor", item.color)}
                  style={{ backgroundColor: item.color }}
                  className="h-6 w-6 rounded-md hover:scale-110 transition-transform cursor-pointer shadow-xs border border-white/20"
                  title={item.label}
                />
              ))}
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => onExecCommand("removeFormat")}
              className="gap-2 text-xs cursor-pointer hover:bg-surface-2"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Effacer la couleur</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Structure Dropdown (+ Question, Titre Cours, Renuméroter) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Structure</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-surface border border-border shadow-xl">
            <DropdownMenuItem onClick={onInsertQuestion} className="gap-2 cursor-pointer hover:bg-surface-2 font-semibold text-primary">
              <Plus className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span>+ Insérer Question QCM</span>
                <span className="text-[10px] text-muted font-normal">Modèle standard d&apos;annales</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onInsertCourseTitle} className="gap-2 cursor-pointer hover:bg-surface-2">
              <BookOpen className="w-4 h-4 text-text" />
              <div className="flex flex-col">
                <span className="font-medium text-text">Titre de Cours</span>
                <span className="text-[10px] text-muted">Bannière officielle du module</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRenumberQuestions} className="gap-2 cursor-pointer hover:bg-surface-2">
              <Hash className="w-4 h-4 text-text" />
              <div className="flex flex-col">
                <span className="font-medium text-text">Renuméroter 1..N</span>
                <span className="text-[10px] text-muted">Réaligner automatiquement l&apos;ordre</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 6. Overflow Menu (...) for Extra Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 w-8 rounded-lg bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
              title="Plus d'actions de mise en page"
              aria-label="Plus d'actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-surface border border-border shadow-xl">
            <DropdownMenuLabel className="text-[11px] text-muted">Listes & Alignement</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onExecCommand("insertUnorderedList")} className="gap-2 cursor-pointer hover:bg-surface-2">
              <List className="w-3.5 h-3.5" />
              <span>Liste à puces</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExecCommand("insertOrderedList")} className="gap-2 cursor-pointer hover:bg-surface-2">
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Liste numérotée</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExecCommand("justifyLeft")} className="gap-2 cursor-pointer hover:bg-surface-2">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Aligner à gauche</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExecCommand("justifyCenter")} className="gap-2 cursor-pointer hover:bg-surface-2">
              <AlignCenter className="w-3.5 h-3.5" />
              <span>Centrer</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Add Question Shortcut Button */}
      <Button
        size="sm"
        variant="default"
        onClick={onInsertQuestion}
        className="h-8 text-xs font-bold gap-1 px-3 shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>+ Question</span>
      </Button>
    </div>
  );
}
