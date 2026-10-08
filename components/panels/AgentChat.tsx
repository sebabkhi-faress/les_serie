"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Plus,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMessage, AgentAction } from "@/types/studio";
import { cn } from "@/lib/utils";

interface AgentChatProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  onApplyAction: (action: AgentAction) => void;
  onClearHistory: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

// Action Result Card for parsed json-action blocks
export function ActionResultCard({
  action,
  onApply,
}: {
  action: AgentAction;
  onApply: () => void;
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const getActionLabel = (type: string) => {
    switch (type) {
      case "update_html":
        return "Remplacement du document";
      case "replace_question":
        return "Modification de question ciblée";
      case "insert_at_top":
        return "Insertion en en-tête";
      case "replace_text":
        return "Correction de texte médical";
      default:
        return "Modification proposée";
    }
  };

  const handleApply = () => {
    onApply();
    setHasApplied(true);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(action, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="mt-2 rounded-xl bg-surface-2 p-3 text-xs shadow-xs border border-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-text block">
              {action.description || getActionLabel(action.action)}
            </span>
            {action.target && (
              <span className="text-[10px] text-muted block truncate max-w-[180px]">
                Cible : {action.target}
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant={hasApplied ? "secondary" : "default"}
          onClick={handleApply}
          className={cn(
            "h-7 text-xs font-semibold gap-1 px-2.5 shrink-0",
            hasApplied && "text-success bg-success/15"
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{hasApplied ? "Appliqué" : "Appliquer"}</span>
        </Button>
      </div>

      {/* Collapsible 'Voir le détail' */}
      <div className="mt-2 pt-2 border-t border-border/60 flex flex-col">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="flex items-center justify-between text-[11px] font-medium text-primary hover:underline py-0.5 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            <Code2 className="w-3 h-3" />
            <span>Voir le détail (JSON d&apos;action)</span>
          </span>
          {isDetailsOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {isDetailsOpen && (
          <div className="mt-2 relative">
            <pre className="p-2.5 rounded-lg bg-surface text-text text-[10px] font-mono overflow-x-auto max-h-40 border border-border">
              {JSON.stringify(action, null, 2)}
            </pre>
            <button
              onClick={handleCopyJson}
              className="absolute top-2 right-2 p-1 rounded bg-surface-2 text-muted hover:text-text cursor-pointer"
              title="Copier le JSON"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to parse message text and separate json-action blocks
function parseMessageContent(rawText: string) {
  const jsonActionRegex = /```json-action\s*([\s\S]*?)\s*```/g;
  const parts: { type: "text" | "action"; text?: string; action?: AgentAction }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = jsonActionRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        text: rawText.substring(lastIndex, match.index),
      });
    }

    try {
      const parsedAction = JSON.parse(match[1]);
      parts.push({
        type: "action",
        action: parsedAction,
      });
    } catch {
      parts.push({
        type: "text",
        text: match[0],
      });
    }

    lastIndex = jsonActionRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    parts.push({
      type: "text",
      text: rawText.substring(lastIndex),
    });
  }

  return parts;
}

export function AgentChat({
  messages,
  isThinking,
  onSendMessage,
  onApplyAction,
  onClearHistory,
  inputRef: externalInputRef,
}: AgentChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText.trim());
    setInputText("");
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Visible quick chips (max 3 visible, rest in '+' dropdown, wrapping on 2 lines with flex-wrap)
  const visibleChips = [
    "Corrige la question 6",
    "Ajoute une justification clinique",
    "Vérifie la numérotation",
  ];
  const moreChips = [
    "Passe en tableau d'annales",
    "Génère un cas clinique A4",
    "Vérifie la rigueur médicale",
    "Rédige l'explication diagnostique",
  ];

  return (
    <div className="flex flex-col h-full bg-surface select-none">
      {/* Top Header of Chat */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-surface">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Copilote Médical IA</h3>
            <span className="text-[10px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Gemini 2.5 Flash • Spécialisé QCMs
            </span>
          </div>
        </div>

        {/* Kebab Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7">
              <MoreVertical className="w-3.5 h-3.5 text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface border border-border shadow-lg">
            <DropdownMenuItem onClick={onClearHistory} className="gap-2 text-danger cursor-pointer hover:bg-surface-2">
              <Trash2 className="w-3.5 h-3.5 text-danger" />
              <span>Effacer la discussion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const parsedParts = isUser ? [] : parseMessageContent(msg.content);

          return (
            <div
              key={index}
              className={cn(
                "flex flex-col text-xs leading-relaxed",
                isUser ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {isUser ? (
                  <span className="text-[10px] font-semibold text-muted">Vous</span>
                ) : (
                  <span className="text-[10px] font-semibold text-accent flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    Copilote Médical
                  </span>
                )}
              </div>

              {/* Message Bubble (Filled surfaces, NO white borders) */}
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl p-3 whitespace-pre-wrap shadow-xs",
                  isUser
                    ? "bg-accent text-white rounded-br-xs"
                    : "bg-surface-2 text-text rounded-bl-xs"
                )}
              >
                {isUser ? (
                  msg.content
                ) : (
                  <>
                    {parsedParts.map((part, pIdx) => {
                      if (part.type === "text" && part.text) {
                        return <span key={pIdx}>{part.text}</span>;
                      } else if (part.type === "action" && part.action) {
                        return (
                          <ActionResultCard
                            key={pIdx}
                            action={part.action}
                            onApply={() => onApplyAction(part.action!)}
                          />
                        );
                      }
                      return null;
                    })}

                    {msg.action && parsedParts.filter((p) => p.type === "action").length === 0 && (
                      <ActionResultCard
                        action={msg.action}
                        onApply={() => onApplyAction(msg.action!)}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-2 text-accent text-xs w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyse clinique en cours...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips: Wrap onto 2 lines (flex-wrap), max 3 visible, rest in '+' menu */}
      <div className="px-3 py-2 border-t border-border bg-surface flex flex-wrap items-center gap-1.5">
        {visibleChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(chip);
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-2 text-muted hover:text-text hover:bg-surface-2/80 transition-colors cursor-pointer"
          >
            {chip}
          </button>
        ))}

        {/* '+' dropdown menu with more chips */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-6 w-6 rounded-lg bg-surface-2 text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors"
              title="Plus de suggestions"
              aria-label="Plus de suggestions"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-surface border border-border shadow-xl">
            {moreChips.map((chip, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={() => {
                  setInputText(chip);
                  inputRef.current?.focus();
                }}
                className="text-xs cursor-pointer hover:bg-surface-2"
              >
                {chip}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chat Input Container */}
      <div className="p-3 border-t border-border bg-surface flex flex-col gap-1.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={1}
            placeholder="Demandez une correction médicale…"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "48px";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            style={{ minHeight: "48px" }}
            className="flex-1 resize-none bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed transition-all"
          />

          <Button
            onClick={handleSend}
            disabled={isThinking || !inputText.trim()}
            variant="default"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-accent text-white hover:bg-accent/90"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Keyboard hint below */}
        <span className="text-[10px] text-muted/70 px-1">
          Appuyez sur Entrée pour envoyer • Maj+Entrée pour un saut de ligne
        </span>
      </div>
    </div>
  );
}
