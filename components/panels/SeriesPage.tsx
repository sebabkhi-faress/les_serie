"use client";

import React, { useRef } from "react";
import {
  FolderKanban,
  FileText,
  Plus,
  Upload,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Database,
  Cloud,
  FileCode,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageFile } from "@/types/studio";
import { cn } from "@/lib/utils";

interface SeriesPageProps {
  files: StorageFile[];
  selectedFile: string;
  loadingFiles: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectDocument: (filename: string) => void;
  onRefreshFiles: () => void;
  onCreateNewFile: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (filename: string, e: React.MouseEvent) => void;
  onDownloadFile: (filename: string) => void;
  onInsertCourseTitle?: () => void;
}

export function SeriesPage({
  files,
  selectedFile,
  loadingFiles,
  searchQuery,
  onSearchChange,
  onSelectDocument,
  onRefreshFiles,
  onCreateNewFile,
  onFileUpload,
  onDeleteFile,
  onDownloadFile,
  onInsertCourseTitle,
}: SeriesPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Panel Header */}
      <div className="p-3 border-b border-border bg-surface-secondary/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                Séries Supabase ({files.length})
              </h3>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-emerald-500" />
                Cloud Bucket • Stockage persistant
              </span>
            </div>
          </div>

          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRefreshFiles}
            title="Rafraîchir"
            className="h-7 w-7"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 text-muted",
                loadingFiles && "animate-spin text-primary"
              )}
            />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une série..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateNewFile}
            className="text-xs h-8 gap-1.5 font-semibold justify-center"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Nouvelle Série</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs h-8 gap-1.5 font-semibold justify-center"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Importer HTML/PDF</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.pdf"
            className="hidden"
            onChange={onFileUpload}
          />
        </div>

        {onInsertCourseTitle && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onInsertCourseTitle}
            className="w-full text-xs h-8 gap-1.5 justify-center font-medium mt-1 text-primary border-primary/20"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Insérer En-tête de Cours Médical</span>
          </Button>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingFiles && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Chargement du bucket Supabase...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted">
            Aucun document trouvé
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile === file.name;
            const isPdf = file.name.endsWith(".pdf");

            return (
              <div
                key={file.name}
                onClick={() => onSelectDocument(file.name)}
                className={cn(
                  "group px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-all border",
                  isSelected
                    ? "bg-primary/10 text-primary border-primary/30 shadow-xs font-semibold"
                    : "bg-surface hover:bg-surface-secondary/80 text-foreground border-border/70 hover:border-border"
                )}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <FileText
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isSelected
                        ? "text-primary"
                        : isPdf
                        ? "text-rose-500"
                        : "text-muted"
                    )}
                  />
                  <div className="truncate flex flex-col">
                    <span className="truncate">{file.name}</span>
                    {file.created_at && (
                      <span className="text-[10px] text-muted font-normal">
                        {new Date(file.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadFile(file.name);
                    }}
                    className="p-1 rounded hover:bg-surface-hover text-muted hover:text-foreground"
                    title="Télécharger le fichier"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDeleteFile(file.name, e)}
                    className="p-1 rounded hover:bg-surface-hover text-muted hover:text-danger"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
