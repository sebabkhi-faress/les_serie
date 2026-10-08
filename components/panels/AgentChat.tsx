"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
        return "Remplacement complet du document";
      case "replace_question":
        return "Modification de question ciblée";
      case "insert_at_top":
        return "Insertion en en-tête";
      case "replace_text":
        return "Remplacement de texte médical";
      default:
        return "Modification du document";
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
    <div className="mt-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-foreground block">
              {action.description || getActionLabel(action.action)}
            </span>
            {action.target && (
              <span className="text-[10px] text-muted block">
                Cible : {action.target}
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant={hasApplied ? "outline" : "default"}
          onClick={handleApply}
          className={cn(
            "h-7 text-xs font-semibold gap-1 px-2.5 transition-all",
            hasApplied && "text-success border-success/40 bg-success/10"
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>{hasApplied ? "Appliqué" : "Appliquer"}</span>
        </Button>
      </div>

      {/* Collapsible 'Voir le détail' */}
      <div className="mt-2 pt-2 border-t border-primary/20 flex flex-col">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="flex items-center justify-between text-[11px] font-medium text-primary hover:underline py-0.5"
        >
          <span className="flex items-center gap-1">
            <Code2 className="w-3 h-3" />
            <span>Voir le détail (JSON de modification)</span>
          </span>
          {isDetailsOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {isDetailsOpen && (
          <div className="mt-2 relative">
            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(action, null, 2)}
            </pre>
            <button
              onClick={handleCopyJson}
              className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
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
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickChips = [
    "Corrige la question 6",
    "Ajoute une justification clinique",
    "Vérifie la numérotation 1..N",
    "Passe en tableau d'annales",
  ];

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Top Header of Chat */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-surface-secondary/40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Copilote Médical IA</h3>
            <span className="text-[10px] text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Options de l&apos;agent</DropdownMenuLabel>
            <DropdownMenuItem onClick={onClearHistory} className="gap-2 text-danger">
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

              {/* Message Bubble */}
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl p-3 whitespace-pre-wrap transition-shadow shadow-xs",
                  isUser
                    ? "bg-accent text-white rounded-br-xs"
                    : "bg-surface-secondary text-foreground border border-border/80 rounded-bl-xs"
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

                    {/* Fallback if message has explicit action field from previous state */}
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
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs w-fit animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyse clinique et génération en cours...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 border-t border-border/60 bg-surface-secondary/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputText(chip);
              inputRef.current?.focus();
            }}
            className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface hover:bg-surface-hover text-muted hover:text-foreground border border-border/80 transition-all shrink-0 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Input Container */}
      <div className="p-3 border-t border-border bg-surface flex items-end gap-2">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={1}
          placeholder="Demandez une correction, une justification ou une reformulation... (Entrée pour envoyer, Ctrl+K pour focus)"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-surface-secondary border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent max-h-[120px] transition-colors leading-relaxed"
        />

        <Button
          onClick={handleSend}
          disabled={isThinking || !inputText.trim()}
          variant="accent"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          title="Envoyer le message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
