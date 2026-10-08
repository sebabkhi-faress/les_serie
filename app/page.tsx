"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { IconRail } from "@/components/shell/IconRail";
import { SidePanel } from "@/components/shell/SidePanel";
import { StatusBar } from "@/components/shell/StatusBar";
import { AgentChat } from "@/components/panels/AgentChat";
import { PasteConvert } from "@/components/panels/PasteConvert";
import { QuestionsList } from "@/components/panels/QuestionsList";
import { SeriesPage } from "@/components/panels/SeriesPage";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { Toolbar } from "@/components/editor/Toolbar";
import { Canvas } from "@/components/editor/Canvas";
import { ProtectionModal } from "@/components/editor/ProtectionModal";
import { NewSeriesModal } from "@/components/panels/NewSeriesModal";
import { CodebarsPanel } from "@/components/panels/CodebarsPanel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PromptModal } from "@/components/ui/PromptModal";
import {
  StorageFile,
  ChatMessage,
  AgentAction,
  ParsedQuestion,
  SaveStatus,
  ActivePanel,
  EditorViewMode,
} from "@/types/studio";
import { generateBarcodeSVG } from "@/lib/barcode";

const DEFAULT_MEDICAL_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Série d'Annales Médicales</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 10pt;
    }
    .empty-notice-box {
      border: 1.5px solid #000000;
      padding: 6px 14px;
      margin: 0 auto 12px auto;
      max-width: 540px;
      text-align: center;
      font-size: 9.5pt;
      font-weight: 500;
      color: #0f172a;
    }
    .course-header-banner {
      text-align: center;
      margin: 14px 0 20px 0;
    }
    .course-header-banner h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      text-decoration: underline;
    }
    .question-box {
      margin-bottom: 20px;
      padding: 14px 18px;
      border: 1.5px solid #38bdf8;
      border-left: 5px solid #0284c7;
      border-radius: 8px;
      background: #ffffff;
      page-break-inside: avoid;
      position: relative;
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 8px;
    }
    .q-stem {
      font-weight: 700;
      color: #0f172a;
      font-size: 10pt;
    }
    .q-num {
      color: #0284c7;
      font-weight: 800;
      font-size: 10pt;
    }
    .year-badge {
      font-size: 8.5pt;
      font-weight: 600;
      color: #0284c7;
      background: #f0f9ff;
      border: 1px solid #38bdf8;
      padding: 2px 10px;
      border-radius: 12px;
      white-space: nowrap;
    }
    .btn-delete-q {
      background: none;
      border: 1px solid transparent;
      color: #94a3b8;
      cursor: pointer;
      font-size: 11px;
      padding: 2px 5px;
      border-radius: 4px;
      line-height: 1;
      transition: all 120ms;
    }
    .btn-delete-q:hover {
      color: #dc2626;
      background: #fee2e2;
      border-color: #fca5a5;
    }
    .items-list {
      margin: 8px 0;
      padding-left: 4px;
      color: #0f172a;
      line-height: 1.5;
    }
    .propositions-list {
      margin: 8px 0 10px 0;
      padding-left: 4px;
      color: #1e293b;
      font-weight: 500;
      line-height: 1.5;
    }
    ol.options {
      margin: 8px 0;
      padding-left: 20px;
      color: #1e293b;
      line-height: 1.5;
    }
    ol.options li {
      margin-bottom: 3px;
    }
    .answer-section {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      font-size: 8.5pt;
    }
    .answer-line {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .answer-label {
      font-weight: 800;
      color: #0284c7;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }
    .answer-badge {
      background: #059669;
      color: #ffffff;
      font-weight: 800;
      font-size: 9pt;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .justification-title {
      font-weight: 800;
      color: #0284c7;
      font-size: 8.5pt;
      margin-top: 6px;
      letter-spacing: 0.5px;
    }
    .justifications {
      margin: 4px 0 0 0;
      padding-left: 16px;
      color: #334155;
      list-style-type: disc;
    }
    .justifications li {
      margin-bottom: 3px;
    }
    .text-correct {
      color: #059669;
      font-weight: 700;
    }
    .text-incorrect {
      color: #dc2626;
      font-weight: 700;
    }
    .study-mode-active .answer-section {
      display: none !important;
    }
    /* Hide duplicate action bar inside A4 document */
    .screen-toolbar, aside.screen-toolbar, .toolbar-brand, .toolbar-tags, .toolbar-actions,
    .document-header-bar, .header-bar, .exam-top-bar, .action-bar-top, .header-actions,
    .study-header, [class*="action-bar"], [class*="action_bar"], .ue1-header-actions,
    button.print-btn, button.mode-btn, .btn-toggle-mode, .btn-print {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    @media print {
      .btn-delete-q {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="empty-notice-box">Il n'y a pas de QCSs à ce cours dans les examens disponibles</div>
  <div class="course-header-banner">
    <h2>2- Fièvre</h2>
  </div>

  <!-- QUESTION 1 -->
  <div class="question-box">
    <div class="question-header">
      <div style="display: flex; align-items: baseline; gap: 4px;">
        <span class="q-num">Question 1 :</span>
        <span class="q-stem">1. Les causes infectieuses localisées de la fièvre :</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="year-badge">(Dr Kahel,2024,2025)</span>
        <button type="button" class="btn-delete-q" title="Supprimer cette question" onclick="window.parent?.postMessage({type:'REQUEST_DELETE_QUESTION', num: '1'},'*');">✕</button>
      </div>
    </div>
    <div class="items-list">
      <div>1) Pneumonie.</div>
      <div>2) Tuberculose.</div>
      <div>3) Endocardite infectieuse.</div>
      <div>4) Ostéomyélite.</div>
      <div>5) Fièvre typhoïde</div>
    </div>
    <div class="propositions-list">
      <div>A. 1.2</div>
      <div>B. 4.5</div>
      <div>C. 1.2.3.4.5</div>
      <div>D. 1.3.4</div>
      <div>E. 3.4.5</div>
    </div>
    <div class="answer-section">
      <div class="answer-line">
        <span class="answer-label">RÉPONSE :</span>
        <span class="answer-badge">D</span>
      </div>
      <div class="justification-title">JUSTIFICATION :</div>
      <ul class="justifications">
        <li><strong class="text-incorrect">A : Faux</strong> — La tuberculose (2) est une infection spécifique bactérienne, pas une infection localisée.</li>
        <li><strong class="text-incorrect">B : Faux</strong> — La fièvre typhoïde (5) est une infection spécifique bactérienne, pas une infection localisée.</li>
        <li><strong class="text-incorrect">C : Faux</strong> — Inclut la tuberculose (2) et la fièvre typhoïde (5) qui ne sont pas des infections localisées.</li>
        <li><strong class="text-correct">D : Vrai</strong> — Selon le tableau de la page 29, les infections localisées sont : Pyélonéphrite aiguë, Pneumonie (1), Abcès, Rhino-sinusite aiguë, Ostéomyélite (4), Endocardite infectieuse (3).</li>
        <li><strong class="text-incorrect">E : Faux</strong> — Inclut la fièvre typhoïde (5) qui n'est pas une infection localisée.</li>
      </ul>
    </div>
  </div>

  <!-- QUESTION 2 -->
  <div class="question-box">
    <div class="question-header">
      <div style="display: flex; align-items: baseline; gap: 4px;">
        <span class="q-num">Question 2 :</span>
        <span class="q-stem">L'analyse de la courbe thermique peut nous renseigner et donne :</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="year-badge">(Dr Kahel,2025)</span>
        <button type="button" class="btn-delete-q" title="Supprimer cette question" onclick="window.parent?.postMessage({type:'REQUEST_DELETE_QUESTION', num: '2'},'*');">✕</button>
      </div>
    </div>
    <ol class="options alpha">
      <li>La fièvre en plateau peut se voire dans le paludisme.</li>
      <li>La fièvre ondulante on peut se voire dans la tuberculose</li>
      <li>La fièvre intermittente en plateau peut se voire dans la brucellose.</li>
      <li>La fièvre rémittente quotidienne se voit dans les suppurations profondes</li>
      <li>Le fébricule qu'on peut le trouver dans la septicémie.</li>
    </ol>
    <div class="answer-section">
      <div class="answer-line">
        <span class="answer-label">RÉPONSE :</span>
        <span class="answer-badge">D</span>
      </div>
      <div class="justification-title">JUSTIFICATION :</div>
      <ul class="justifications">
        <li><strong class="text-correct">D : Vrai</strong> — La fièvre rémittente quotidienne est caractéristique des suppurations profondes et abcès collectés.</li>
        <li><strong class="text-incorrect">A : Faux</strong> — La fièvre en plateau est typique de la fièvre typhoïde (pas du paludisme qui donne des accès périodiques).</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

export default function StudioPage() {
  // File management
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [isLoadingDocument, setIsLoadingDocument] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Editor states
  const [viewMode, setViewMode] = useState<EditorViewMode>("edit");
  const [hideAnswers, setHideAnswers] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [startPageNumber, setStartPageNumber] = useState<number>(1);

  // Panels & Modals
  const [activePanel, setActivePanel] = useState<ActivePanel>("ai");
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState<boolean>(false);
  const [isNewSeriesModalOpen, setIsNewSeriesModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>("Dr. Médecin Résident");
  const [studentCode, setStudentCode] = useState<string>("RES-2026-ALG");
  const [isProtected, setIsProtected] = useState<boolean>(false);

  // Parsed Questions state
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Bonjour ! Je suis votre copilote médical IA. Je peux corriger la formulation de vos QCMs, vérifier vos justifications cliniques, ajuster la numérotation ou modifier directement le document HTML.",
    },
  ]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  // References
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  // Custom Confirmation & Prompt Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "default";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    submitText?: string;
    cancelText?: string;
    onSubmit: (val: string) => void;
  }>({
    isOpen: false,
    title: "",
    onSubmit: () => {},
  });

  // ==================== STRICT QUESTION BOUNDARIES ====================
  // Enforces:
  // 1. Two questions can NEVER be in the same square (nested question boxes are extracted as siblings)
  // 2. A question can NEVER be in the same field/container with a course title banner or empty notice
  const enforceQuestionBoundaries = (doc: Document): boolean => {
    let modified = false;

    // 1. Check for nested question boxes
    const qBoxes = Array.from(doc.querySelectorAll(".question-box"));
    for (const box of qBoxes) {
      const nestedBoxes = Array.from(box.querySelectorAll(".question-box"));
      for (const nested of nestedBoxes) {
        if (box.parentNode) {
          box.parentNode.insertBefore(nested, box.nextSibling);
          modified = true;
        }
      }
    }

    // 2. Check for trapped titles/banners inside question boxes
    const currentBoxes = Array.from(doc.querySelectorAll(".question-box"));
    for (const box of currentBoxes) {
      const trappedBanners = Array.from(
        box.querySelectorAll(".course-header-banner, .empty-notice-box, h1, h2, h3")
      );
      for (const banner of trappedBanners) {
        if (box.parentNode) {
          box.parentNode.insertBefore(banner, box);
          modified = true;
        }
      }
    }

    return modified;
  };

  // ==================== 3. ANALYSE ET INDEXATION DES QUESTIONS ====================
  const extractQuestionsFromDoc = (doc: Document) => {
    enforceQuestionBoundaries(doc);

    const questions: ParsedQuestion[] = [];
    const qBoxes = doc.querySelectorAll(".question-box");

    if (qBoxes.length > 0) {
      qBoxes.forEach((box, index) => {
        const qNumEl = box.querySelector(".q-num");
        const qStemEl = box.querySelector(".q-stem");
        const yearEl = box.querySelector(".year-badge");
        const ansEl = box.querySelector(".answer-badge");
        const optsEls = box.querySelectorAll("ol.options li");

        const numText = qNumEl ? qNumEl.textContent?.replace(/\D/g, "") || `${index + 1}` : `${index + 1}`;
        const stemText = qStemEl ? qStemEl.textContent?.replace(qNumEl?.textContent || "", "").trim() : "Question";
        const optionsList = Array.from(optsEls).map((li) => li.textContent || "");

        questions.push({
          id: `q-${index}`,
          num: numText,
          title: stemText || `Question ${numText}`,
          year: yearEl?.textContent || "",
          options: optionsList,
          answer: ansEl?.textContent?.replace("*", "").trim(),
          rawHtml: (box as HTMLElement).outerHTML,
        });
      });
    }

    setParsedQuestions(questions);

    // Check protection
    const hasProtection = !!doc.querySelector(".protection-screen-banner");
    setIsProtected(hasProtection);

    // Approximate page count
    const docHeight = doc.body.scrollHeight || 1000;
    const computedPages = Math.max(1, Math.ceil(docHeight / 1120));
    setTotalPages(computedPages);
  };

  // Delete question by number or index
  const deleteQuestion = (num: string | number) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const qBoxes = doc.querySelectorAll(".question-box");
    let removed = false;

    qBoxes.forEach((box) => {
      const qNumEl = box.querySelector(".q-num");
      const numText = qNumEl?.textContent?.replace(/\D/g, "") || "";
      if (numText === String(num)) {
        box.remove();
        removed = true;
      }
    });

    if (!removed) {
      const idx = parseInt(String(num), 10) - 1;
      if (idx >= 0 && idx < qBoxes.length) {
        qBoxes[idx].remove();
        removed = true;
      }
    }

    enforceQuestionBoundaries(doc);
    extractQuestionsFromDoc(doc);
    saveCurrentDocument();
  };

  // Custom modal-protected question deletion
  const requestDeleteQuestion = (num: string | number) => {
    setConfirmModal({
      isOpen: true,
      title: `Supprimer la Question ${num}`,
      description: `Confirmer la suppression définitive de la Question ${num} ? Le document et l'index seront mis à jour.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "danger",
      onConfirm: () => deleteQuestion(num),
    });
  };

  // Listen for messages from inside the iframe (e.g. from inline delete buttons)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "DOCUMENT_CHANGED") {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (doc) {
          enforceQuestionBoundaries(doc);
          extractQuestionsFromDoc(doc);
          saveCurrentDocument();
        }
      } else if (e.data?.type === "REQUEST_DELETE_QUESTION") {
        requestDeleteQuestion(e.data.num);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ==================== 4. INJECTION & SYNCHRONISATION IFRAME ====================
  const injectIntoIframe = (html: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Ensure utf-8 charset and hide rules for duplicate action header inside document
    let safeHtml = html;
    if (!safeHtml.includes('charset="utf-8"')) {
      safeHtml = safeHtml.replace("<head>", '<head><meta charset="utf-8">');
    }

    // Add CSS rule hiding any duplicate header bar inside document
    const hideHeaderCss = `<style id="qcm-studio-overrides">
      .screen-toolbar, aside.screen-toolbar, .toolbar-brand, .toolbar-tags, .toolbar-actions,
      .document-header-bar, .header-bar, .exam-top-bar, .action-bar-top, .header-actions,
      .study-header, [class*="action-bar"], [class*="action_bar"], .ue1-header-actions,
      button.print-btn, button.mode-btn, .btn-toggle-mode, .btn-print {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .study-mode-active .answer-section {
        display: none !important;
      }
    </style>`;
    if (!safeHtml.includes("qcm-studio-overrides")) {
      safeHtml = safeHtml.replace("</head>", `${hideHeaderCss}</head>`);
    }

    doc.open();
    doc.write(safeHtml);
    doc.close();

    // Supprimer tout vestige de toolbar statique hérité directement du DOM
    doc.querySelectorAll(
      ".screen-toolbar, aside.screen-toolbar, .document-header-bar, .header-bar, .exam-top-bar, .action-bar-top, .header-actions"
    ).forEach((el) => el.remove());

    if (doc.body) {
      doc.body.contentEditable = viewMode === "edit" ? "true" : "false";
      doc.designMode = viewMode === "edit" ? "on" : "off";

      if (hideAnswers) {
        doc.body.classList.add("study-mode-active", "mode-study");
      } else {
        doc.body.classList.remove("study-mode-active", "mode-study");
      }

      extractQuestionsFromDoc(doc);

      const handleInput = () => {
        setSaveStatus("unsaved");
        extractQuestionsFromDoc(doc);
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          saveCurrentDocument();
        }, 2000);
      };

      doc.body.addEventListener("input", handleInput);
      doc.body.addEventListener("keyup", handleInput);

      // Keyboard shortcuts inside iframe
      doc.addEventListener("keydown", (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          saveCurrentDocument();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
          e.preventDefault();
          handlePrint();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setActivePanel("ai");
          setTimeout(() => aiInputRef.current?.focus(), 100);
        }
      });
    }
  };

  // ==================== 5. CRÉATION & SAUVEGARDE DE NOUVEAU DOCUMENT ====================
  const createAndSaveNewDocument = async (filename: string, initialHtml: string) => {
    setIsLoadingDocument(true);
    setSelectedFile(filename);
    setDocumentContent(initialHtml);
    setSaveStatus("saving");

    // Mise à jour immédiate de la liste locale pour affichage instantané dans la sidebar
    setFiles((prev) => {
      const existing = prev.filter((f) => f.name !== filename);
      return [{ name: filename, id: filename, created_at: new Date().toISOString() }, ...existing];
    });

    // Injection immédiate et prioritaire dans l'iframe
    injectIntoIframe(initialHtml);

    try {
      const res = await fetch("/api/storage/content", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          filename,
          content: initialHtml,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString("fr-FR"));
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err) {
      console.error("Erreur de création de document sur Supabase:", err);
      setSaveStatus("unsaved");
    } finally {
      setIsLoadingDocument(false);
      // Double garantie d'injection synchrone dans le document de l'iframe
      setTimeout(() => {
        injectIntoIframe(initialHtml);
      }, 50);
    }
  };

  // ==================== 6. CHARGEMENT D'UN DOCUMENT ====================
  const selectDocument = async (filename: string) => {
    setIsLoadingDocument(true);
    setSelectedFile(filename);
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/storage/content?filename=${encodeURIComponent(filename)}`);
      const data = await res.json();
      if (data.content && data.content.trim().length > 0) {
        setDocumentContent(data.content);
        injectIntoIframe(data.content);
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString("fr-FR"));
      } else {
        // Si le fichier est vide sur Supabase Storage, initialiser avec DEFAULT_MEDICAL_HTML et le sauvegarder
        setDocumentContent(DEFAULT_MEDICAL_HTML);
        injectIntoIframe(DEFAULT_MEDICAL_HTML);
        await fetch("/api/storage/content", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ filename, content: DEFAULT_MEDICAL_HTML }),
        });
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString("fr-FR"));
      }
    } catch (e) {
      console.error("Erreur de lecture du document:", e);
      setSaveStatus("unsaved");
      setDocumentContent(DEFAULT_MEDICAL_HTML);
      injectIntoIframe(DEFAULT_MEDICAL_HTML);
    } finally {
      setIsLoadingDocument(false);
      setTimeout(() => {
        const iframe = iframeRef.current;
        const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (doc && (!doc.body || !doc.body.innerHTML || doc.body.innerHTML.trim() === "")) {
          injectIntoIframe(documentContent || DEFAULT_MEDICAL_HTML);
        }
      }, 50);
    }
  };

  // ==================== 7. CHARGEMENT DE LA LISTE DES FICHIERS ====================
  const loadFilesList = useCallback(async (preferFile?: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/storage/files");
      const data = await res.json();
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        setFiles(data.files);
        // Si un fichier cible est demandé ou si aucun n'est sélectionné, charger le fichier
        const target =
          (preferFile && data.files.some((f: StorageFile) => f.name === preferFile) && preferFile) ||
          (data.files.find((f: StorageFile) => f.name.endsWith(".html")) || data.files[0]).name;
        await selectDocument(target);
      } else {
        // SI AUCUN FICHIER N'EXISTE SUR SUPABASE STORAGE -> EN CRÉER UN AUTOMATIQUEMENT
        console.log("Aucune série sur Supabase Storage. Création automatique de la série initiale...");
        const initialFile = "Série_QCM_Cardiologie.html";
        await createAndSaveNewDocument(initialFile, DEFAULT_MEDICAL_HTML);
      }
    } catch (e) {
      console.error("Erreur de chargement des fichiers:", e);
      setDocumentContent(DEFAULT_MEDICAL_HTML);
      injectIntoIframe(DEFAULT_MEDICAL_HTML);
      setIsLoadingDocument(false);
    } finally {
      setLoadingFiles(false);
    }
  }, []); // Exécute uniquement au montage initial ou lors d'un rafraîchissement explicite !

  useEffect(() => {
    loadFilesList();
  }, [loadFilesList]);

  // Synchronise immédiatement le document avec l'iframe lors d'une création ou sélection
  useEffect(() => {
    if (documentContent && iframeRef.current) {
      injectIntoIframe(documentContent);
    }
  }, [documentContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc && doc.body) {
      doc.body.contentEditable = viewMode === "edit" ? "true" : "false";
      doc.designMode = viewMode === "edit" ? "on" : "off";
    }
  }, [viewMode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc && doc.body) {
      if (hideAnswers) {
        doc.body.classList.add("study-mode-active", "mode-study");
      } else {
        doc.body.classList.remove("study-mode-active", "mode-study");
      }
    }
  }, [hideAnswers]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentDocument();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActivePanel("ai");
        setTimeout(() => aiInputRef.current?.focus(), 100);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedFile]);

  // ==================== 5. SAUVEGARDE SUR SUPABASE STORAGE ====================
  const saveCurrentDocument = async () => {
    const currentName = selectedFile || "Nouvelle_Serie.html";
    const iframe = iframeRef.current;
    let fullHtml = documentContent;

    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.documentElement) {
        doc.querySelectorAll(".screen-toolbar, aside.screen-toolbar").forEach((el) => el.remove());
        fullHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      }
    }

    setSaveStatus("saving");

    try {
      const res = await fetch("/api/storage/content", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          filename: currentName,
          content: fullHtml,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString("fr-FR"));
        setDocumentContent(fullHtml);
      } else {
        setSaveStatus("unsaved");
      }
    } catch (e) {
      console.error("Échec de la sauvegarde:", e);
      setSaveStatus("unsaved");
    }
  };

  // ==================== 6. COMMANDES DE FORMATAGE (TOOLBAR) ====================
  const execRibbonCmd = (command: string, value: string | undefined = undefined) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.execCommand(command, false, value);
    setSaveStatus("unsaved");
  };

  const doInsertQuestion = (qNum: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const templateHtml = `
    <!-- QUESTION ${qNum} -->
    <div class="question-box" style="margin-bottom: 20px; padding: 14px 18px; border: 1.5px solid #38bdf8; border-left: 5px solid #0284c7; border-radius: 8px; background: #ffffff; page-break-inside: avoid; position: relative;">
        <div class="question-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
            <div style="display: flex; align-items: baseline; gap: 4px;">
                <span class="q-num" style="color: #0284c7; font-weight: 800; font-size: 10pt;">Question ${qNum} :</span>
                <span class="q-stem" style="font-weight: 700; color: #0f172a; font-size: 10pt;">Énoncé de la question médicale...</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="year-badge" style="font-size: 8.5pt; font-weight: 600; color: #0284c7; background: #f0f9ff; border: 1px solid #38bdf8; padding: 2px 10px; border-radius: 12px; white-space: nowrap;">(Dr Kahel, 2026)</span>
                <button type="button" class="btn-delete-q" title="Supprimer cette question" onclick="window.parent?.postMessage({type:'REQUEST_DELETE_QUESTION', num: '${qNum}'},'*');">✕</button>
            </div>
        </div>
        <ol class="options alpha" style="margin: 8px 0; padding-left: 20px; color: #1e293b; line-height: 1.5;">
            <li>Proposition A...</li>
            <li>Proposition B...</li>
            <li>Proposition C...</li>
            <li>Proposition D...</li>
            <li>Proposition E...</li>
        </ol>
        <div class="answer-section" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 8.5pt;">
            <div class="answer-line" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="answer-label" style="font-weight: 800; color: #0284c7; font-size: 8.5pt; letter-spacing: 0.5px;">RÉPONSE :</span>
                <span class="answer-badge" style="background: #059669; color: #ffffff; font-weight: 800; font-size: 9pt; padding: 2px 8px; border-radius: 4px; display: inline-block;">A</span>
            </div>
            <div class="justification-title" style="font-weight: 800; color: #0284c7; font-size: 8.5pt; margin-top: 6px; letter-spacing: 0.5px;">JUSTIFICATION :</div>
            <ul class="justifications" style="margin: 4px 0 0 0; padding-left: 16px; color: #334155; list-style-type: disc;">
                <li><strong class="text-correct" style="color: #059669; font-weight: 700;">A : Vrai</strong> — Justification clinique détaillée...</li>
                <li><strong class="text-incorrect" style="color: #dc2626; font-weight: 700;">B : Faux</strong> — Explication clinique...</li>
            </ul>
        </div>
    </div>
    `;

    // Strict boundary enforcement: NEVER insert inside another question box
    const sel = doc.getSelection();
    let anchorNode = sel?.anchorNode;
    let parentBox: Element | null = null;
    if (anchorNode) {
      const el = anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;
      parentBox = el?.closest(".question-box") || null;
    }

    if (parentBox && parentBox.parentNode) {
      parentBox.insertAdjacentHTML("afterend", templateHtml);
    } else {
      doc.body.insertAdjacentHTML("beforeend", templateHtml);
    }

    enforceQuestionBoundaries(doc);
    setSaveStatus("unsaved");
    extractQuestionsFromDoc(doc);
  };

  const insertQuestionTemplate = () => {
    // Si le document est vide, créer et initialiser avec la série complète
    if (!documentContent || documentContent.trim().length === 0) {
      const name = selectedFile || "Série_QCM_Initiale.html";
      createAndSaveNewDocument(name, DEFAULT_MEDICAL_HTML);
      return;
    }

    const nextNum = parsedQuestions.length + 1;
    setPromptModal({
      isOpen: true,
      title: "Ajouter une Question",
      description: "Indiquez le numéro de la question à insérer dans la série :",
      label: "Numéro de la question",
      defaultValue: `${nextNum}`,
      placeholder: `${nextNum}`,
      submitText: "Ajouter la question",
      cancelText: "Annuler",
      onSubmit: (val) => doInsertQuestion(val),
    });
  };

  const doInsertCourseTitle = (moduleName: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const bannerHtml = `
      <div class="course-header-banner" style="text-align: center; margin: 16px 0 20px 0;">
        <h2 style="margin: 0; font-size: 13pt; font-weight: 800; color: #0f172a; text-decoration: underline;">${moduleName}</h2>
      </div>
    `;

    // Strict boundary enforcement: NEVER insert inside a question box
    const sel = doc.getSelection();
    let anchorNode = sel?.anchorNode;
    let parentBox: Element | null = null;
    if (anchorNode) {
      const el = anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;
      parentBox = el?.closest(".question-box") || null;
    }

    if (parentBox && parentBox.parentNode) {
      parentBox.insertAdjacentHTML("beforebegin", bannerHtml);
    } else {
      doc.body.insertAdjacentHTML("beforeend", bannerHtml);
    }

    enforceQuestionBoundaries(doc);
    setSaveStatus("unsaved");
  };

  const insertCourseTitleBanner = () => {
    setPromptModal({
      isOpen: true,
      title: "Insérer un En-tête de Cours",
      description: "Indiquez le titre du cours ou du module médical à afficher :",
      label: "Nom du cours / module",
      defaultValue: "2- Fièvre",
      placeholder: "ex: 2- Fièvre",
      submitText: "Insérer",
      cancelText: "Annuler",
      onSubmit: (val) => doInsertCourseTitle(val),
    });
  };

  const renumberQuestions = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const qBoxes = doc.querySelectorAll(".question-box");
    if (qBoxes.length === 0) return;

    qBoxes.forEach((box, index) => {
      const num = index + 1;
      const qNumEl = box.querySelector(".q-num");
      if (qNumEl) {
        qNumEl.textContent = `Question ${num} :`;
      }
    });

    extractQuestionsFromDoc(doc);
    saveCurrentDocument();
  };

  const scrollToQuestion = (qNum: string | number) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const qBoxes = doc.querySelectorAll(".question-box");
    for (const box of Array.from(qBoxes)) {
      const numEl = box.querySelector(".q-num");
      if (numEl && numEl.textContent?.includes(`${qNum}`)) {
        (box as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
        (box as HTMLElement).style.outline = "2px solid #2DD4BF";
        setTimeout(() => {
          (box as HTMLElement).style.outline = "none";
        }, 1500);
        break;
      }
    }
  };

  // ==================== 7. ASSISTANT IA (GEMINI) ====================
  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isAiThinking) return;

    const userText = textToSend.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsAiThinking(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          prompt: userText,
          currentHtml: documentContent,
          history: chatMessages.slice(-6),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            action: data.action,
          },
        ]);

        if (data.action) {
          applyAiAction(data.action);
        }
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Erreur : ${data.error || "Impossible de contacter Gemini"}`,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Erreur réseau lors de la communication avec le copilote IA.",
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const applyAiAction = (action: AgentAction) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !action.content) return;

    if (action.action === "update_html") {
      injectIntoIframe(action.content);
      saveCurrentDocument();
    } else if (action.action === "replace_text" && action.target) {
      const current = doc.body.innerHTML;
      if (current.includes(action.target)) {
        doc.body.innerHTML = current.replace(action.target, action.content);
        extractQuestionsFromDoc(doc);
        saveCurrentDocument();
      }
    } else if (action.action === "insert_at_top") {
      doc.body.insertAdjacentHTML("afterbegin", action.content);
      extractQuestionsFromDoc(doc);
      saveCurrentDocument();
    } else if (action.action === "replace_question") {
      if (action.target) {
        const qBoxes = doc.querySelectorAll(".question-box");
        for (const box of Array.from(qBoxes)) {
          if (box.textContent?.includes(action.target)) {
            (box as HTMLElement).outerHTML = action.content;
            break;
          }
        }
      } else {
        doc.body.insertAdjacentHTML("beforeend", action.content);
      }
      extractQuestionsFromDoc(doc);
      saveCurrentDocument();
    }
  };

  // ==================== 8. EXPORTATION & IMPRESSION ====================
  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.print();
  };

  const handleDownloadHtml = () => {
    const iframe = iframeRef.current;
    const htmlToSave = iframe?.contentDocument?.documentElement.outerHTML || documentContent;
    const filename = selectedFile || "QCM_Studio_Document.html";

    const blob = new Blob([htmlToSave], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWord = () => {
    const iframe = iframeRef.current;
    const htmlToSave = iframe?.contentDocument?.documentElement.outerHTML || documentContent;
    const filename = (selectedFile || "QCM_Studio_Document").replace(/\.html$/, "") + ".doc";

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export Word</title></head><body>`;
    const footer = `</body></html>`;
    const sourceHtml = header + htmlToSave + footer;

    const blob = new Blob([sourceHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==================== 9. GESTION FICHIERS SUPABASE ====================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/storage/files", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await loadFilesList();
        selectDocument(file.name);
      }
    } catch (err) {
      console.error("Erreur d'upload :", err);
    }
  };

  const handleCreateNewFile = () => {
    setIsNewSeriesModalOpen(true);
  };

  const handleDeleteFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Supprimer la série",
      description: `Confirmer la suppression définitive de "${name}" sur Supabase Storage ? Cette action est irréversible.`,
      confirmText: "Supprimer définitivement",
      cancelText: "Annuler",
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/storage/files?filename=${encodeURIComponent(name)}`, {
            method: "DELETE",
          });

          if (res.ok) {
            await loadFilesList();
            if (selectedFile === name) {
              setSelectedFile("");
              setDocumentContent("");
            }
          }
        } catch (err) {
          console.error("Erreur de suppression :", err);
        }
      },
    });
  };

  // ==================== 10. PROTECTION ANTI-COPIE & CODE-BARRES ====================
  // Slim, essential watermark banner: no bulky certified banners or forbidden stamps
  const applyProtectionWatermark = (passedSvg?: string, finalCode?: string, overrideStudentName?: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !doc.body) return;

    const codeToUse = finalCode || studentCode || "714415235521";
    const nameToUse = overrideStudentName || studentName || "Dr. Destinataire";
    const svgToEmbed =
      passedSvg ||
      generateBarcodeSVG(codeToUse, { height: 32, fontSize: 9, unitWidth: 1.4 });

    let existingBanner = doc.querySelector(".protection-screen-banner");
    const bannerHtml = `
      <div class="protection-screen-banner" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1.5px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 6px; padding: 6px 12px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 8.5pt; color: #0f172a; flex-wrap: wrap;">
              <span style="font-weight: 700; color: #0284c7;">${nameToUse}</span>
              <span style="color: #cbd5e1;">•</span>
              <span style="font-family: monospace; font-size: 8pt; color: #475569;">Matricule: ${codeToUse}</span>
              <span style="color: #cbd5e1;">•</span>
              <span style="font-size: 7.5pt; color: #64748b;">${new Date().toLocaleDateString("fr-FR")}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; shrink-0;">
              ${svgToEmbed ? `<div style="background: #ffffff; padding: 2px; border-radius: 4px; border: 1px solid #e2e8f0; max-height: 36px; overflow: hidden; display: flex; align-items: center;">${svgToEmbed}</div>` : ""}
          </div>
      </div>
    `;

    if (existingBanner) {
      existingBanner.outerHTML = bannerHtml;
    } else {
      const container = doc.querySelector(".container") || doc.body;
      container.insertAdjacentHTML("afterbegin", bannerHtml);
    }

    if (overrideStudentName) setStudentName(overrideStudentName);
    if (finalCode) setStudentCode(finalCode);

    setIsProtected(true);
    setIsProtectionModalOpen(false);
    saveCurrentDocument();
  };


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg text-text select-none">
      {/* 1. TOP BAR (56px) */}
      <TopBar
        selectedFile={selectedFile}
        isProtected={isProtected}
        saveStatus={saveStatus}
        onSave={saveCurrentDocument}
        onPrint={handlePrint}
        onDownloadHtml={handleDownloadHtml}
        onDownloadPdf={handlePrint}
        onExportWord={handleExportWord}
        onExportImage={handlePrint}
        onOpenProtectionModal={() => setIsProtectionModalOpen(true)}
      />

      {/* 2. MAIN LAYOUT (IconRail + SidePanel + Workspace Canvas) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Icon Rail (72px) */}
        <IconRail
          activePanel={activePanel}
          onSelectPanel={(panel) => setActivePanel(panel)}
          questionsCount={parsedQuestions.length}
        />

        {/* Side Panel (360px default, resizable 320-480px) */}
        <SidePanel activePanel={activePanel} onClose={() => setActivePanel(null)}>
          {activePanel === "ai" && (
            <AgentChat
              messages={chatMessages}
              isThinking={isAiThinking}
              onSendMessage={handleSendPrompt}
              onApplyAction={applyAiAction}
              onClearHistory={() => setChatMessages([])}
              inputRef={aiInputRef}
            />
          )}

          {activePanel === "paste" && (
            <PasteConvert
              onInsertHtml={(html) => {
                const iframe = iframeRef.current;
                const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
                if (doc) {
                  doc.body.insertAdjacentHTML("beforeend", html);
                  enforceQuestionBoundaries(doc);
                  extractQuestionsFromDoc(doc);
                  saveCurrentDocument();
                }
              }}
              onSendToAi={(prompt) => {
                setActivePanel("ai");
                handleSendPrompt(prompt);
              }}
            />
          )}

          {activePanel === "questions" && (
            <QuestionsList
              questions={parsedQuestions}
              onScrollToQuestion={scrollToQuestion}
              onInsertQuestionTemplate={insertQuestionTemplate}
              onRenumberQuestions={renumberQuestions}
              onDeleteQuestion={deleteQuestion}
            />
          )}

          {activePanel === "codebars" && (
            <CodebarsPanel
              currentDocumentTitle={selectedFile || "Série QCM"}
              onApplyCodeToDocument={(svg, code, name) => {
                applyProtectionWatermark(svg, code, name);
              }}
            />
          )}

          {activePanel === "series" && (
            <SeriesPage
              files={files}
              selectedFile={selectedFile}
              loadingFiles={loadingFiles}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectDocument={selectDocument}
              onRefreshFiles={loadFilesList}
              onCreateNewFile={handleCreateNewFile}
              onFileUpload={handleFileUpload}
              onDeleteFile={handleDeleteFile}
              onDownloadFile={(f) => {
                selectDocument(f);
                setTimeout(handleDownloadHtml, 300);
              }}
              onInsertCourseTitle={insertCourseTitleBanner}
            />
          )}

          {activePanel === "settings" && (
            <SettingsPanel
              studentName={studentName}
              studentCode={studentCode}
              startPageNumber={startPageNumber}
              onStudentNameChange={setStudentName}
              onStudentCodeChange={setStudentCode}
              onStartPageNumberChange={setStartPageNumber}
              onOpenProtectionModal={() => setIsProtectionModalOpen(true)}
            />
          )}
        </SidePanel>

        {/* Center Workspace & Sticky Toolbar */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
          {/* Sticky Compact Grouped Toolbar */}
          {viewMode === "edit" && (
            <Toolbar
              onExecCommand={execRibbonCmd}
              onInsertQuestion={insertQuestionTemplate}
              onInsertCourseTitle={insertCourseTitleBanner}
              onRenumberQuestions={renumberQuestions}
            />
          )}

          {/* Central A4 Canvas */}
          <Canvas
            iframeRef={iframeRef}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            documentContent={documentContent}
            onDocumentContentChange={(val) => {
              setDocumentContent(val);
              injectIntoIframe(val);
              setSaveStatus("unsaved");
            }}
            onIframeLoad={() => {
              if (documentContent) {
                injectIntoIframe(documentContent);
              }
            }}
            zoom={zoom}
            onZoomChange={setZoom}
            isLoading={loadingFiles || isLoadingDocument}
            loadingMessage={
              loadingFiles
                ? "Connexion et synchronisation avec Supabase Cloud..."
                : `Chargement de la série "${selectedFile || "A4"}"...`
            }
            isEmpty={
              (!documentContent || documentContent.trim().length === 0) &&
              !loadingFiles &&
              !isLoadingDocument
            }
            onInsertFirstQuestion={() => {
              const name = selectedFile || "Série_QCM_Initiale.html";
              createAndSaveNewDocument(name, DEFAULT_MEDICAL_HTML);
            }}
            onCreateNewSeries={() => setIsNewSeriesModalOpen(true)}
            onOpenPastePanel={() => setActivePanel("paste")}
            currentPage={currentPage}
            totalPages={totalPages}
            startPageNumber={startPageNumber}
            onStartPageNumberChange={setStartPageNumber}
            onPageChange={setCurrentPage}
            onExecCommand={execRibbonCmd}
            onAskAiWithSelection={(text) => {
              setActivePanel("ai");
              handleSendPrompt(`À propos de ce passage : "${text}"\nPeux-tu vérifier ou améliorer sa formulation médicale ?`);
            }}
          />
        </div>
      </div>

      {/* 3. STATUS BAR (32px, Single Source of Truth for questions count & save status) */}
      <StatusBar
        questionsCount={parsedQuestions.length}
        currentPage={currentPage}
        totalPages={totalPages}
        startPageNumber={startPageNumber}
        hideAnswers={hideAnswers}
        onToggleHideAnswers={() => setHideAnswers(!hideAnswers)}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
      />

      {/* 4. MODALS */}
      <ProtectionModal
        isOpen={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        studentName={studentName}
        studentCode={studentCode}
        documentTitle={selectedFile || "DOCUMENT MÉDICAL"}
        onStudentNameChange={setStudentName}
        onStudentCodeChange={setStudentCode}
        onApplyProtection={applyProtectionWatermark}
      />

      <NewSeriesModal
        isOpen={isNewSeriesModalOpen}
        onClose={() => setIsNewSeriesModalOpen(false)}
        onCreate={(name) => createAndSaveNewDocument(name, DEFAULT_MEDICAL_HTML)}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant || "danger"}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={promptModal.onSubmit}
        title={promptModal.title}
        description={promptModal.description}
        label={promptModal.label}
        defaultValue={promptModal.defaultValue}
        placeholder={promptModal.placeholder}
        submitText={promptModal.submitText}
        cancelText={promptModal.cancelText}
      />
    </div>
  );
}
