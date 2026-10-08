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
  <title>Série de QCMs Médicaux</title>
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
    .question-box {
      margin-bottom: 20px;
      padding: 14px 18px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .q-stem {
      font-weight: 700;
      color: #0f172a;
    }
    .q-num {
      color: #0f766e;
      font-weight: 800;
    }
    .year-badge {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
    ol.options {
      margin: 8px 0;
      padding-left: 22px;
      color: #334155;
    }
    ol.options li {
      margin-bottom: 4px;
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
      gap: 6px;
      margin-bottom: 4px;
    }
    .answer-label {
      font-weight: 700;
      color: #0f766e;
    }
    .answer-badge {
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
      padding: 1px 8px;
      border-radius: 4px;
    }
    .justification-title {
      font-weight: 700;
      color: #475569;
      margin-top: 6px;
    }
    .justifications {
      margin: 4px 0 0 0;
      padding-left: 20px;
      color: #475569;
    }
    .justifications li {
      margin-bottom: 2px;
    }
    .text-correct {
      color: #16a34a;
      font-weight: 600;
    }
    .text-incorrect {
      color: #dc2626;
      font-weight: 600;
    }
    .course-header-banner {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 5px solid #0f766e;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .course-header-banner h1 {
      margin: 0 0 4px 0;
      font-size: 14pt;
      color: #0f172a;
    }
    .course-header-banner p {
      margin: 0;
      font-size: 9pt;
      color: #64748b;
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
  </style>
</head>
<body>
  <div class="course-header-banner">
    <h1>Module de Pédiatrie Médicale</h1>
    <p>Série d'annales officielles de Résidanat & Internat • QCMs commentés</p>
  </div>
  <div class="question-box">
    <div class="question-header">
      <span class="q-stem"><span class="q-num">Question 1 :</span> Parmi les signes suivants, lequel évoque en premier lieu une déshydratation aiguë sévère chez le nourrisson ?</span>
      <span class="year-badge">(2026, Alger B)</span>
    </div>
    <ol class="options alpha">
      <li>Pli cutané persistant</li>
      <li>Hypotonie des globes oculaires</li>
      <li>Perte de poids supérieure à 10%</li>
      <li>Sécheresse des muqueuses</li>
      <li>Fièvre isolée</li>
    </ol>
    <div class="answer-section">
      <div class="answer-line">
        <span class="answer-label">Réponse :</span>
        <span class="answer-badge">C*</span>
      </div>
      <div class="justification-title">Justification clinique :</div>
      <ul class="justifications">
        <li><strong class="text-correct">C : Vrai</strong> — La perte pondérale mesurée (> 10%) est le critère de référence quantifiant la sévérité absolue du choc hypovolémique.</li>
        <li><strong class="text-incorrect">E : Faux</strong> — La fièvre est un signe étiologique infectieux et non une preuve directe de déshydratation aiguë.</li>
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


  // ==================== 3. ANALYSE ET INDEXATION DES QUESTIONS ====================
  const extractQuestionsFromDoc = (doc: Document) => {
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
    injectIntoIframe(initialHtml);
    setSaveStatus("saving");

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
        // Rafraîchir la liste des fichiers
        const listRes = await fetch("/api/storage/files");
        const listData = await listRes.json();
        if (listData.files && Array.isArray(listData.files)) {
          setFiles(listData.files);
        }
      } else {
        setSaveStatus("unsaved");
      }
    } catch (err) {
      console.error("Erreur de création de document sur Supabase:", err);
      setSaveStatus("unsaved");
    } finally {
      setIsLoadingDocument(false);
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
    }
  };

  // ==================== 7. CHARGEMENT DE LA LISTE DES FICHIERS ====================
  const loadFilesList = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/storage/files");
      const data = await res.json();
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        setFiles(data.files);
        // Si aucun fichier sélectionné ou fichier non trouvé, prendre le premier fichier HTML
        const target =
          selectedFile && data.files.some((f: StorageFile) => f.name === selectedFile)
            ? selectedFile
            : (data.files.find((f: StorageFile) => f.name.endsWith(".html")) || data.files[0]).name;
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
  }, [selectedFile]);

  useEffect(() => {
    loadFilesList();
  }, [loadFilesList]);

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

  const insertQuestionTemplate = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Si le document est vide, créer et initialiser avec la série complète
    if (!documentContent || documentContent.trim().length === 0) {
      const name = selectedFile || "Série_QCM_Initiale.html";
      createAndSaveNewDocument(name, DEFAULT_MEDICAL_HTML);
      return;
    }

    const nextNum = parsedQuestions.length + 1;
    const qNum = prompt("Numéro de la question :", `${nextNum}`) || `${nextNum}`;

    const templateHtml = `
    <!-- QUESTION ${qNum} -->
    <div class="question-box" style="margin-bottom: 20px; padding: 14px 18px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <div class="question-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="q-stem" style="font-weight: 700; color: #0f172a;"><span class="q-num" style="color: #0f766e; font-weight: 800;">Question ${qNum} :</span> Énoncé de la question médicale...</span>
            <span class="year-badge" style="font-size: 8pt; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px;">(2026, session B)</span>
        </div>
        <ol class="options alpha" style="margin: 8px 0; padding-left: 22px; color: #334155;">
            <li>Proposition A...</li>
            <li>Proposition B...</li>
            <li>Proposition C...</li>
            <li>Proposition D...</li>
            <li>Proposition E...</li>
        </ol>
        <div class="answer-section" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 8.5pt;">
            <div class="answer-line" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="answer-label" style="font-weight: 700; color: #0f766e;">Réponse :</span> <span class="answer-badge" style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 8px; border-radius: 4px;">A*</span>
            </div>
            <div class="justification-title" style="font-weight: 700; color: #475569; margin-top: 6px;">Justification clinique :</div>
            <ul class="justifications" style="margin: 4px 0 0 0; padding-left: 20px; color: #475569;">
                <li><strong class="text-correct" style="color: #16a34a;">A : Vrai</strong> — Explication clinique détaillée...</li>
                <li><strong class="text-incorrect" style="color: #dc2626;">B : Faux</strong> — Explication...</li>
            </ul>
        </div>
    </div>
    `;

    doc.execCommand("insertHTML", false, templateHtml);
    setSaveStatus("unsaved");
    extractQuestionsFromDoc(doc);
  };

  const insertCourseTitleBanner = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const moduleName = prompt("Nom du module ou cours médical :", "Pédiatrie Médicale") || "Module Médical";
    const bannerHtml = `
      <div class="course-header-banner" style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #0f766e; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
        <h1 style="margin: 0 0 4px 0; font-size: 14pt; color: #0f172a; font-weight: 800;">${moduleName}</h1>
        <p style="margin: 0; font-size: 9pt; color: #64748b;">Série d'annales officielles de Résidanat & Internat • QCMs commentés</p>
      </div>
    `;

    doc.execCommand("insertHTML", false, bannerHtml);
    setSaveStatus("unsaved");
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

  const handleDeleteFile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Confirmer la suppression définitive de "${name}" sur Supabase Storage ?`)) return;

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
  };

  // ==================== 10. PROTECTION ANTI-COPIE & CODE-BARRES ====================
  const applyProtectionWatermark = (passedSvg?: string, finalCode?: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !doc.body) return;

    const codeToUse = finalCode || studentCode || "717271883927";
    const svgToEmbed =
      passedSvg ||
      generateBarcodeSVG(codeToUse, { height: 38, fontSize: 10, unitWidth: 1.5 });

    let existingBanner = doc.querySelector(".protection-screen-banner");
    const bannerHtml = `
      <div class="protection-screen-banner" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1.5px solid #cbd5e1; border-left: 5px solid #0f766e; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); gap: 12px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 8pt; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">DOCUMENT MÉDICAL CERTIFIÉ & SÉCURISÉ</span>
              <span style="font-size: 9.5pt; font-weight: 700; color: #0f172a;">Attribué nominativement à : ${studentName || "Dr. Destinataire Résident"}</span>
              <span style="font-size: 8pt; color: #64748b;">Matricule: ${codeToUse} • Date: ${new Date().toLocaleDateString("fr-FR")}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; shrink-0;">
              ${svgToEmbed ? `<div style="background: #ffffff; padding: 2px; border-radius: 4px; border: 1px solid #e2e8f0;">${svgToEmbed}</div>` : ""}
              <div style="font-size: 8pt; font-weight: 800; background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; white-space: nowrap;">
                  COPIE STRICTEMENT INTERDITE
              </div>
          </div>
      </div>
    `;

    if (existingBanner) {
      existingBanner.outerHTML = bannerHtml;
    } else {
      const container = doc.querySelector(".container") || doc.body;
      container.insertAdjacentHTML("afterbegin", bannerHtml);
    }

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
              onStudentNameChange={setStudentName}
              onStudentCodeChange={setStudentCode}
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
    </div>
  );
}
