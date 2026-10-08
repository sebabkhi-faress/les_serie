"use client";

import React, { useState } from "react";
import {
  ClipboardPaste,
  Wand2,
  HelpCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasteConvertProps {
  onInsertHtml: (html: string) => void;
  onSendToAi: (prompt: string) => void;
}

export function PasteConvert({ onInsertHtml, onSendToAi }: PasteConvertProps) {
  const [rawText, setRawText] = useState("");
  const [examYear, setExamYear] = useState("2026, session B");

  const handleClientConvert = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    let htmlResult = "";
    let currentStem = "";
    let options: string[] = [];
    let answer = "";
    let justifications: string[] = [];
    let qNum = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const qMatch = line.match(/^(?:Q(?:uestion)?\s*(\d+)|\b(\d+)\s*[\.\:\-\)])\s*(.*)/i);
      if (qMatch) {
        if (currentStem) {
          htmlResult += generateQuestionHtml(qNum, currentStem, options, answer, justifications, examYear);
          qNum++;
          options = [];
          answer = "";
          justifications = [];
        }
        qNum = parseInt(qMatch[1] || qMatch[2] || `${qNum}`, 10);
        currentStem = qMatch[3] || line;
        continue;
      }

      const optMatch = line.match(/^([A-Ea-e])[\.\)\-\:]\s*(.*)/);
      if (optMatch) {
        options.push(optMatch[2]);
        continue;
      }

      const ansMatch = line.match(/^(?:R[eé]ponse[s]?|Corrig[eé])\s*[\:\=]\s*(.*)/i);
      if (ansMatch) {
        answer = ansMatch[1].trim();
        continue;
      }

      const justMatch = line.match(/^(?:Justification[s]?|Commentaire[s]?)\s*[\:\=]\s*(.*)/i);
      if (justMatch) {
        justifications.push(justMatch[1].trim());
        continue;
      }

      if (!currentStem) {
        currentStem = line;
      } else if (options.length > 0 && answer) {
        justifications.push(line);
      } else if (options.length === 0) {
        currentStem += " " + line;
      }
    }

    if (currentStem) {
      htmlResult += generateQuestionHtml(qNum, currentStem, options, answer, justifications, examYear);
    }

    if (htmlResult) {
      onInsertHtml(htmlResult);
      setRawText("");
    }
  };

  const generateQuestionHtml = (
    num: number,
    stem: string,
    opts: string[],
    ans: string,
    justs: string[],
    year: string
  ) => {
    return `
    <!-- QUESTION ${num} -->
    <div class="question-box" style="margin-bottom: 20px; padding: 14px 18px; border: 1.5px solid #38bdf8; border-left: 5px solid #0284c7; border-radius: 8px; background: #ffffff; page-break-inside: avoid; position: relative;">
      <div class="question-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <span class="q-num" style="color: #0284c7; font-weight: 800; font-size: 10pt;">Question ${num} :</span>
          <span class="q-stem" style="font-weight: 700; color: #0f172a; font-size: 10pt;">${stem}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="year-badge" style="font-size: 8.5pt; font-weight: 600; color: #0284c7; background: #f0f9ff; border: 1px solid #38bdf8; padding: 2px 10px; border-radius: 12px; white-space: nowrap;">(${year})</span>
          <button type="button" class="btn-delete-q" title="Supprimer cette question" onclick="window.parent?.postMessage({type:'REQUEST_DELETE_QUESTION', num: '${num}'},'*');">✕</button>
        </div>
      </div>
      <ol class="options alpha" style="margin: 8px 0; padding-left: 20px; color: #1e293b; line-height: 1.5;">
        ${opts.map((opt) => `<li>${opt}</li>`).join("\n        ")}
      </ol>
      <div class="answer-section" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 8.5pt;">
        <div class="answer-line" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span class="answer-label" style="font-weight: 800; color: #0284c7; font-size: 8.5pt; letter-spacing: 0.5px;">RÉPONSE :</span>
          <span class="answer-badge" style="background: #059669; color: #ffffff; font-weight: 800; font-size: 9pt; padding: 2px 8px; border-radius: 4px; display: inline-block;">${ans || "A"}</span>
        </div>
        ${
          justs.length > 0
            ? `<div class="justification-title" style="font-weight: 800; color: #0284c7; font-size: 8.5pt; margin-top: 6px; letter-spacing: 0.5px;">JUSTIFICATION :</div>
        <ul class="justifications" style="margin: 4px 0 0 0; padding-left: 16px; color: #334155; list-style-type: disc;">
          ${justs
            .map((j) => {
              const formatted = j
                .replace(/^([A-Ea-e]\s*:\s*Vrai)/i, '<strong class="text-correct" style="color: #059669; font-weight: 700;">$1</strong>')
                .replace(/^([A-Ea-e]\s*:\s*Faux)/i, '<strong class="text-incorrect" style="color: #dc2626; font-weight: 700;">$1</strong>');
              return `<li>${formatted}</li>`;
            })
            .join("\n          ")}
        </ul>`
            : ""
        }
      </div>
    </div>
    `;
  };

  const handleAiSmartConvert = () => {
    if (!rawText.trim()) return;
    const prompt = `Convertis le texte brut suivant en QCMs médicaux conformes au format HTML avec propositions (A..E), réponse et justifications cliniques détaillées :\n\n${rawText}`;
    onSendToAi(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-surface select-none">
      <div className="p-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <ClipboardPaste className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Coller & Convertir</h3>
            <span className="text-[10px] text-muted">
              Transformation de texte brut en QCMs
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">
            Texte source (annales, WhatsApp, scan) :
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
            placeholder={`Exemple :\nQuestion 1 : Concernant la maladie de Crohn :\nA. Elle touche tout le tube digestif\nB. Les lésions sont continues\nC. L'atteinte iléale est fréquente\nRéponse : A, C\nJustification : L'atteinte est transmurale et discontinue.`}
            className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary font-mono leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text mb-1">
            Mention de session / Année :
          </label>
          <input
            type="text"
            value={examYear}
            onChange={(e) => setExamYear(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={handleClientConvert}
            disabled={!rawText.trim()}
            variant="default"
            className="w-full justify-center gap-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Convertir & Insérer</span>
          </Button>

          <Button
            onClick={handleAiSmartConvert}
            disabled={!rawText.trim()}
            variant="accent"
            className="w-full justify-center gap-2 text-xs font-bold"
          >
            <Wand2 className="w-4 h-4" />
            <span>Conversion IA Médicale</span>
          </Button>
        </div>

        <div className="p-3 rounded-xl bg-surface-2 border border-border text-[11px] text-muted space-y-1">
          <div className="font-semibold text-text flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>Astuce</span>
          </div>
          <p>
            Vous pouvez coller plusieurs questions à la fois. Le système détecte automatiquement les propositions (A..E) et le corrigé.
          </p>
        </div>
      </div>
    </div>
  );
}
