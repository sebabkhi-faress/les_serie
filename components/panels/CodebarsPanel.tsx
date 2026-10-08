"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  QrCode,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit2,
  X,
  ShieldCheck,
  Database,
  ExternalLink,
  Barcode as BarcodeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CodebarRecord } from "@/types/studio";
import { generateBarcodeSVG, generateUniqueCode } from "@/lib/barcode";

interface CodebarsPanelProps {
  onApplyCodeToDocument: (svg: string, code: string, studentName: string) => void;
  currentDocumentTitle?: string;
}

export function CodebarsPanel({
  onApplyCodeToDocument,
  currentDocumentTitle = "DOCUMENT MÉDICAL",
}: CodebarsPanelProps) {
  const [records, setRecords] = useState<CodebarRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // New code creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [isSavingNew, setIsSavingNew] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/codebars");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
      }
    } catch (e) {
      console.error("Erreur de récupération des codes-barres Supabase:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleStartEdit = (rec: CodebarRecord) => {
    setEditingId(rec.id);
    setEditName(rec.student_name);
    setEditBarcode(rec.barcode);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditBarcode("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setIsSavingEdit(true);

    try {
      const freshSvg = generateBarcodeSVG(editBarcode.trim(), {
        height: 34,
        fontSize: 9,
        unitWidth: 1.4,
      });

      const res = await fetch("/api/codebars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          id,
          studentName: editName.trim(),
          barcode: editBarcode.trim(),
          barcodeSvg: freshSvg,
        }),
      });

      const json = await res.json();
      if (json.success && json.record) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...json.record } : r))
        );
        setEditingId(null);
      }
    } catch (e) {
      console.error("Erreur de mise à jour du code-barres:", e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRecord = (id: string, code: string) => {
    setDeleteTarget({ id, code });
  };

  const executeDeleteRecord = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/codebars?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      }
    } catch (e) {
      console.error("Erreur de suppression:", e);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    setIsSavingNew(true);
    const finalCode = newBarcode.trim() || generateUniqueCode();

    try {
      const res = await fetch("/api/codebars", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          studentName: newName.trim(),
          documentTitle: currentDocumentTitle,
          customBarcode: finalCode,
        }),
      });

      const json = await res.json();
      if (json.success && json.record) {
        setRecords((prev) => [json.record, ...prev]);
        setIsCreatingNew(false);
        setNewName("");
        setNewBarcode("");
      }
    } catch (e) {
      console.error("Erreur de création:", e);
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (rec: CodebarRecord) => {
    const svg =
      rec.barcode_svg ||
      generateBarcodeSVG(rec.barcode, { height: 34, fontSize: 9, unitWidth: 1.4 });
    onApplyCodeToDocument(svg, rec.barcode, rec.student_name);
  };

  const filtered = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(q) ||
      r.barcode?.toLowerCase().includes(q) ||
      r.document_title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-surface select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-border bg-surface flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text">
                Codes Supabase ({records.length})
              </h3>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-emerald-400" />
                Table public.codebars
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={fetchRecords}
              title="Rafraîchir les codes"
              className="h-7 w-7 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-muted ${isLoading ? "animate-spin text-primary" : ""}`}
              />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setIsCreatingNew(true);
                setNewBarcode(generateUniqueCode());
              }}
              className="h-7 text-xs font-bold gap-1 px-2.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nouveau</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher étudiant ou matricule..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* New Code Form Inline */}
      {isCreatingNew && (
        <div className="p-3 bg-surface-2/70 border-b border-border space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-text">
            <span>Ajouter un Bénéficiaire à Supabase</span>
            <button
              onClick={() => setIsCreatingNew(false)}
              className="text-muted hover:text-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Nom du médecin / étudiant (ex: Dr. Amine)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Matricule (12 chiffres)"
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleCreateNew}
              disabled={isSavingNew || !newName.trim()}
              className="text-xs h-7 font-bold px-3 shrink-0 cursor-pointer"
            >
              {isSavingNew ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Créer"}
            </Button>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted flex flex-col items-center gap-2">
            <QrCode className="w-8 h-8 text-muted/50" />
            <span>
              {isLoading ? "Chargement des matricules..." : "Aucun code-barres trouvé"}
            </span>
          </div>
        ) : (
          filtered.map((rec) => {
            const isEditing = editingId === rec.id;

            return (
              <div
                key={rec.id}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-2/90 border border-border transition-all flex flex-col gap-2 shadow-2xs group"
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted">
                        Nom de l&apos;Étudiant :
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted">
                        Matricule / Code-Barres :
                      </label>
                      <input
                        type="text"
                        value={editBarcode}
                        onChange={(e) => setEditBarcode(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-6 text-[11px] px-2"
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSaveEdit(rec.id)}
                        disabled={isSavingEdit || !editName.trim()}
                        className="h-6 text-[11px] px-2.5 font-bold gap-1"
                      >
                        {isSavingEdit ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>Enregistrer</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal View Mode */
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-text truncate">
                          {rec.student_name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {rec.barcode}
                          </span>
                          <span className="text-[10px] text-muted">
                            {new Date(rec.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      {/* Top Action icons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleStartEdit(rec)}
                          className="p-1 rounded text-muted hover:text-text hover:bg-surface cursor-pointer"
                          title="Modifier le nom ou le code"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopyCode(rec.barcode, rec.id)}
                          className="p-1 rounded text-muted hover:text-text hover:bg-surface cursor-pointer"
                          title="Copier le code"
                        >
                          {copiedId === rec.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id, rec.barcode)}
                          className="p-1 rounded text-muted hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Supprimer de Supabase"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* SVG Barcode thumbnail if available */}
                    {rec.barcode_svg && (
                      <div
                        className="bg-white p-1 rounded border border-border/80 flex items-center justify-center overflow-hidden max-h-12"
                        dangerouslySetInnerHTML={{ __html: rec.barcode_svg }}
                      />
                    )}

                    {/* Apply Button */}
                    <button
                      onClick={() => handleApply(rec)}
                      className="w-full text-[11px] font-bold text-primary hover:bg-primary/10 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 border border-primary/20 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Appliquer à la série ouverte</span>
                    </button>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteRecord}
        title="Supprimer le code-barres"
        description={`Confirmer la suppression définitive du matricule ${deleteTarget?.code} de la table Supabase ? Cette opération est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </div>
  );
}
