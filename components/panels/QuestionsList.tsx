"use client";

import React, { useState } from "react";
import {
  ListChecks,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
  Hash,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParsedQuestion } from "@/types/studio";

interface QuestionsListProps {
  questions: ParsedQuestion[];
  onScrollToQuestion: (num: string | number) => void;
  onInsertQuestionTemplate: () => void;
  onRenumberQuestions: () => void;
}

export function QuestionsList({
  questions,
  onScrollToQuestion,
  onInsertQuestionTemplate,
  onRenumberQuestions,
}: QuestionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(q.num).includes(searchQuery) ||
      (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Panel Header */}
      <div className="p-3 border-b border-border bg-surface-secondary/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <ListChecks className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                Questions du Document ({questions.length})
              </h3>
              <span className="text-[10px] text-muted">
                Index et navigation rapide
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={onInsertQuestionTemplate}
            className="h-7 text-xs font-semibold gap-1 px-2.5"
          >
            <Plus className="w-3 h-3" />
            <span>+ Question</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une question ou mot-clé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-3 py-2 border-b border-border bg-surface flex items-center justify-between text-xs">
        <span className="text-muted text-[11px]">
          {filtered.length} {filtered.length > 1 ? "résultats" : "résultat"}
        </span>
        <button
          onClick={onRenumberQuestions}
          className="text-primary hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Hash className="w-3 h-3" />
          <span>Renuméroter 1..N</span>
        </button>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted flex flex-col items-center gap-2">
            <HelpCircle className="w-8 h-8 text-muted/60" />
            <span>Aucune question trouvée dans ce document</span>
            <Button
              size="sm"
              variant="outline"
              onClick={onInsertQuestionTemplate}
              className="mt-2 text-xs"
            >
              Insérer la première question
            </Button>
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              onClick={() => onScrollToQuestion(q.num)}
              className="group p-2.5 rounded-xl border border-border/80 bg-surface hover:bg-surface-secondary/70 cursor-pointer transition-all hover:border-primary/40 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Q{q.num}
                  </span>
                  {q.year && (
                    <span className="text-[10px] text-muted font-medium">
                      {q.year}
                    </span>
                  )}
                </div>

                {q.answer && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
                    Rép: {q.answer}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                {q.title || "Énoncé de la question..."}
              </p>

              <div className="flex items-center justify-between text-[10px] text-muted pt-1">
                <span>{q.options.length} propositions</span>
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-medium">
                  Atteindre <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
