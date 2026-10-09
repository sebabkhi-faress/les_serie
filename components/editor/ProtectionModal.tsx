"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  RefreshCw,
  Database,
  Trash2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  QrCode,
  Barcode as BarcodeIcon,
  ScanLine,
  Edit2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  generateBarcodeSVG,
  generateUniqueCode,
  generateUnifiedBarcodeSVG,
  BarcodeFormat,
} from "@/lib/barcode";
import { CodebarRecord } from "@/types/studio";

interface ProtectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentCode: string;
  documentTitle?: string;
  onStudentNameChange: (val: string) => void;
  onStudentCodeChange: (val: string) => void;
  onApplyProtection: (barcodeSvg?: string, finalCode?: string, overrideStudentName?: string) => void;
}

export function ProtectionModal({
  isOpen,
  onClose,
  studentName,
  studentCode,
  documentTitle = "DOCUMENT MÉDICAL",
  onStudentNameChange,
  onStudentCodeChange,
  onApplyProtection,
}: ProtectionModalProps) {
  const [activeTab, setActiveTab] = useState<"apply" | "registry">("apply");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>("code128");
  const [localCode, setLocalCode] = useState(studentCode || generateUniqueCode());
  const [barcodeSvg, setBarcodeSvg] = useState<string>("");
  const [records, setRecords] = useState<CodebarRecord[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dbHint, setDbHint] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);

  // Inline edit state in registry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editBarcode, setEditBarcode] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Real-time HH:mm:ss timestamp for preview
  const [currentTimestamp, setCurrentTimestamp] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCurrentTimestamp(`${now.toLocaleDateString("fr-FR")} ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Re-generate SVG whenever code or format changes
  const updateSvg = (code: string, format: BarcodeFormat) => {
    const svg = generateUnifiedBarcodeSVG(code, format, {
      height: 38,
      fontSize: 10,
      unitWidth: 1.5,
    });
    setBarcodeSvg(svg);
  };

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      const code = studentCode || generateUniqueCode();
      setLocalCode(code);
      onStudentCodeChange(code);
      updateSvg(code, barcodeFormat);
      fetchRecords();
    }
  }, [isOpen]);

  // Update SVG when code changes
  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
    onStudentCodeChange(newCode);
    updateSvg(newCode, barcodeFormat);
  };

  const handleFormatChange = (newFormat: BarcodeFormat) => {
    setBarcodeFormat(newFormat);
    updateSvg(localCode, newFormat);
  };

  const handleRegenerateCode = () => {
    const freshCode = generateUniqueCode();
    handleCodeChange(freshCode);
  };

  // Fetch from Supabase PostgreSQL table 'codebars'
  const fetchRecords = useCallback(async () => {
    setIsLoadingRegistry(true);
    setDbHint(null);
    try {
      const res = await fetch("/api/codebars");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
      } else {
        if (json.hint) setDbHint(json.hint);
        setRecords([]);
      }
    } catch (e) {
      console.error("Erreur de récupération des codes-barres Supabase:", e);
    } finally {
      setIsLoadingRegistry(false);
    }
  }, []);

  const handleDeleteRecord = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    } catch (err) {
      console.error("Erreur de suppression:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectRecord = (rec: CodebarRecord) => {
    onStudentNameChange(rec.student_name);
    handleCodeChange(rec.barcode);
    setActiveTab("apply");
  };

  const handleApplyRecordToDoc = (rec: CodebarRecord) => {
    const svg =
      rec.barcode_svg ||
      generateUnifiedBarcodeSVG(rec.barcode, "code128", { height: 38, fontSize: 10, unitWidth: 1.5 });
    onStudentNameChange(rec.student_name);
    onStudentCodeChange(rec.barcode);
    onApplyProtection(svg, rec.barcode, rec.student_name);
    onClose();
  };

  // Save to Supabase and apply protection
  const handleSaveAndApply = async () => {
    setIsSaving(true);
    const code = localCode.trim() || generateUniqueCode();
    const svg =
      barcodeSvg ||
      generateUnifiedBarcodeSVG(code, barcodeFormat, { height: 38, fontSize: 10, unitWidth: 1.5 });

    try {
      // 1. Enregistrement direct dans Supabase PostgreSQL (public.codebars)
      await fetch("/api/codebars", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          studentName: studentName || "Destinataire Inconnu",
          documentTitle: documentTitle,
          customBarcode: code,
          barcodeFormat: barcodeFormat,
          customSvg: svg,
        }),
      });
    } catch (e) {
      console.error("Erreur d'insertion dans Supabase codebars:", e);
    } finally {
      setIsSaving(false);
      // 2. Application du filigrane et fermeture
      onApplyProtection(svg, code, studentName);
      onClose();
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.student_name?.toLowerCase().includes(q) ||
      r.barcode?.toLowerCase().includes(q) ||
      r.document_title?.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-surface border border-border p-0 overflow-hidden shadow-2xl rounded-2xl">
        <DialogHeader className="p-5 pb-3 bg-surface-2/40 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-text">
                    Protection Anti-Copie & Codes-barres
                  </DialogTitle>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-medium">
                    Codes illimités (Code 128 = standard ASCII)
                  </span>
                </div>
                <DialogDescription className="text-xs text-muted">
                  Bannière infalsifiable sur toutes les pages A4 avec horodatage{" "}
                  <code className="text-primary font-mono font-semibold">HH:mm:ss</code> et table{" "}
                  <code className="text-primary font-mono font-semibold">public.codebars</code>
                </DialogDescription>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-surface-2 p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setActiveTab("apply")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "apply"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Appliquer</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("registry");
                  fetchRecords();
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "registry"
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Registre Supabase ({records.length})</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* TAB 1: APPLIQUER LA PROTECTION */}
        {activeTab === "apply" && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Nom de l&apos;Étudiant / Médecin Résident :
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => onStudentNameChange(e.target.value)}
                  placeholder="Dr. Mohamed El Fateh"
                  className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text">
                    Code Unique ({barcodeFormat === "qrcode" ? "Matricule / URL" : "12 Chiffres"}) :
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Régénérer</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={localCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="714415235521"
                    maxLength={barcodeFormat === "qrcode" ? 128 : 20}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-text font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* FORMAT SELECTOR PILLS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text">
                Format de Code & Tatouage Anti-Copie :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFormatChange("code128")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    barcodeFormat === "code128"
                      ? "bg-primary/10 border-primary text-text shadow-xs"
                      : "bg-surface-2 border-border text-muted hover:text-text hover:bg-surface-2/80"
                  }`}
                >
                  <BarcodeIcon className={`w-4 h-4 shrink-0 ${barcodeFormat === "code128" ? "text-primary" : "text-muted"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Code 128 (1D - Illimité)</div>
                    <div className="text-[10px] text-muted truncate">Standard Concours (Codes illimités)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange("qrcode")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    barcodeFormat === "qrcode"
                      ? "bg-primary/10 border-primary text-text shadow-xs"
                      : "bg-surface-2 border-border text-muted hover:text-text hover:bg-surface-2/80"
                  }`}
                >
                  <QrCode className={`w-4 h-4 shrink-0 ${barcodeFormat === "qrcode" ? "text-primary" : "text-muted"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">QR Code (2D)</div>
                    <div className="text-[10px] text-muted truncate">Scan Smartphone</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange("code39")}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    barcodeFormat === "code39"
                      ? "bg-primary/10 border-primary text-text shadow-xs"
                      : "bg-surface-2 border-border text-muted hover:text-text hover:bg-surface-2/80"
                  }`}
                >
                  <ScanLine className={`w-4 h-4 shrink-0 ${barcodeFormat === "code39" ? "text-primary" : "text-muted"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Code 39 (1D)</div>
                    <div className="text-[10px] text-muted truncate">Matricule Classique</div>
                  </div>
                </button>
              </div>
            </div>

            {/* LIVE BARCODE SVG PREVIEW */}
            <div className="p-4 rounded-xl bg-surface-2/60 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Aperçu de la Bannière Tatouée :</span>
                </span>
                <span className="text-[10px] text-muted">
                  {barcodeFormat === "qrcode"
                    ? "Format QR Code 2D Vectoriel"
                    : barcodeFormat === "code39"
                    ? "Format Code 39 1D"
                    : "Format Code 128 SVG HD (Illimité)"}
                </span>
              </div>

              {/* Slim & Essential Borderless Watermark Strip Simulation */}
              <div className="bg-transparent text-slate-900 p-1.5 flex items-center justify-between gap-3 border-b border-border/70">
                <div className="flex items-center gap-2 font-medium text-xs text-slate-900 flex-wrap">
                  <span className="font-bold text-sky-700">{studentName || "Dr. Destinataire"}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">Matricule: {localCode}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-mono font-semibold text-[10.5px]">
                    {currentTimestamp || `${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR")}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {barcodeSvg && (
                    <div
                      className="bg-transparent p-0 max-h-9 overflow-hidden flex items-center"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Fermer
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveAndApply}
                disabled={isSaving}
                className="gap-2 font-bold px-4"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Appliquer & Sauvegarder sur Supabase</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRE DES CODES-BARRES SUPABASE AVEC ÉDITION INLINE */}
        {activeTab === "registry" && (
          <div className="p-5 space-y-3">
            {/* Search and refresh toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Filtrer par étudiant, document ou code-barres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchRecords}
                disabled={isLoadingRegistry}
                className="gap-1.5 text-xs shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRegistry ? "animate-spin" : ""}`} />
                <span>Actualiser</span>
              </Button>
            </div>

            {dbHint && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                {dbHint}
              </div>
            )}

            {/* List of records with inline edit */}
            <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-muted text-xs bg-surface-2/30 rounded-xl border border-dashed border-border">
                  {isLoadingRegistry
                    ? "Connexion à la table Supabase codebars..."
                    : "Aucun code-barres enregistré dans la table PostgreSQL codebars."}
                </div>
              ) : (
                filteredRecords.map((rec) => {
                  const isEditing = editingId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-surface-2/50 hover:bg-surface-2 border border-border rounded-xl transition-all flex flex-col gap-2 group"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nom de l'étudiant"
                              className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-text font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editBarcode}
                              onChange={(e) => setEditBarcode(e.target.value)}
                              placeholder="Matricule"
                              className="w-36 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                              className="h-6 text-[11px] px-2"
                            >
                              Annuler
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={async () => {
                                if (!editName.trim()) return;
                                setIsSavingEdit(true);
                                try {
                                  const freshSvg = generateUnifiedBarcodeSVG(editBarcode.trim(), barcodeFormat, {
                                    height: 38,
                                    fontSize: 10,
                                    unitWidth: 1.5,
                                  });
                                  const res = await fetch("/api/codebars", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json; charset=utf-8" },
                                    body: JSON.stringify({
                                      id: rec.id,
                                      studentName: editName.trim(),
                                      barcode: editBarcode.trim(),
                                      barcodeSvg: freshSvg,
                                    }),
                                  });
                                  const json = await res.json();
                                  if (json.success && json.record) {
                                    setRecords((prev) =>
                                      prev.map((r) => (r.id === rec.id ? { ...r, ...json.record } : r))
                                    );
                                    setEditingId(null);
                                  }
                                } finally {
                                  setIsSavingEdit(false);
                                }
                              }}
                              disabled={isSavingEdit || !editName.trim()}
                              className="h-6 text-[11px] px-2.5 font-bold gap-1"
                            >
                              {isSavingEdit ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Sauvegarder</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div
                            onClick={() => handleSelectRecord(rec)}
                            className="space-y-0.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text text-xs truncate">
                                {rec.student_name}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {rec.barcode}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {rec.document_title} • {new Date(rec.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          </div>

                          {rec.barcode_svg && (
                            <div
                              className="bg-white p-1 rounded border border-slate-200 hidden sm:block shrink-0 max-h-10 overflow-hidden"
                              dangerouslySetInnerHTML={{ __html: rec.barcode_svg }}
                            />
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyRecordToDoc(rec);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Appliquer immédiatement ce matricule au document actif"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Appliquer</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(rec.id);
                                setEditName(rec.student_name);
                                setEditBarcode(rec.barcode);
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
                              title="Modifier le nom ou le code"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(rec.barcode, rec.id);
                              }}
                              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
                              title="Copier le code"
                            >
                              {copiedId === rec.id ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRecord(rec.id, rec.barcode, e)}
                              className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all cursor-pointer"
                              title="Supprimer de Supabase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border text-xs text-muted">
              <span>Table : <code className="text-primary font-mono">public.codebars</code></span>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={executeDeleteRecord}
          title="Supprimer le code-barres"
          description={`Confirmer la suppression définitive du code-barres ${deleteTarget?.code} de Supabase ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
        />
      </DialogContent>
    </Dialog>
  );
}
