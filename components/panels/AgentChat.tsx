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
  Image as ImageIcon,
  X,
  Paperclip,
  FileCode,
  ArrowUpToLine,
  Replace,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMessage, AgentAction, AttachedImage } from "@/types/studio";
import { cn } from "@/lib/utils";

export type { AttachedImage };

interface AgentChatProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSendMessage: (text: string, image?: AttachedImage) => void;
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
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Process incoming image file
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || "";
      const base64 = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
      setAttachedImage({
        dataUrl,
        mimeType: file.type || "image/png",
        base64,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste handler (Ctrl+V with image)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          return;
        }
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if ((!trimmed && !attachedImage) || isThinking) return;

    const textToSend = trimmed || (attachedImage ? "Analyse l'image médicale jointe et traite le contenu." : "");
    onSendMessage(textToSend, attachedImage || undefined);

    setInputText("");
    setAttachedImage(null);
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

  // Structured Action Chip clicked
  const handleActionChipClick = (actionName: string) => {
    const current = inputText.trim();
    let newText = "";
    if (current) {
      newText = `${current}\n(action: "${actionName}")`;
    } else {
      switch (actionName) {
        case "replace_question":
          newText = `Remplace la question avec l'action "replace_question" : `;
          break;
        case "update_html":
          newText = `Mets à jour l'ensemble du document avec l'action "update_html" : `;
          break;
        case "insert_at_top":
          newText = `Insère en haut du document avec l'action "insert_at_top" : `;
          break;
        case "replace_text":
          newText = `Corrige le texte médical avec l'action "replace_text" : `;
          break;
        default:
          newText = `Applique l'action "${actionName}" : `;
      }
    }
    setInputText(newText);
    setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 50);
  };

  // Smart prompt presets when image is attached
  const handleImagePromptPreset = (preset: "extract" | "style" | "answer") => {
    let promptText = "";
    if (preset === "extract") {
      promptText = `Extrais fidèlement la question médicale de l'image jointe au format .question-box avec l'action "replace_question"`;
    } else if (preset === "style") {
      promptText = `Reproduis fidèlement le style visuel et la mise en page de cette image dans le document HTML avec l'action "update_html"`;
    } else if (preset === "answer") {
      promptText = `Utilise cette image médicale comme source de vérité pour vérifier les propositions et justifier la réponse clinique.`;
    }
    setInputText(promptText);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Visible quick chips (max 3 visible, rest in '+' dropdown)
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
    <div
      className="flex flex-col h-full bg-surface select-none"
      onPaste={handlePaste}
    >
      {/* Hidden file input for images */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

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
              Gemini 2.5 Flash • Multimodal & QCMs
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

              {/* Message Bubble */}
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl p-3 whitespace-pre-wrap shadow-xs",
                  isUser
                    ? "bg-accent text-white rounded-br-xs"
                    : "bg-surface-2 text-text rounded-bl-xs"
                )}
              >
                {/* Render attached image inside user bubble */}
                {isUser && msg.image && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/25 max-w-[240px] shadow-sm">
                    <img
                      src={msg.image}
                      alt="Image envoyée"
                      className="w-full max-h-48 object-contain bg-black/20 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setPreviewModalImage(msg.image || null)}
                    />
                  </div>
                )}

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

      {/* Clickable Action Pills (update_html, replace_question, insert_at_top, replace_text) */}
      <div className="px-3 pt-2 pb-1.5 bg-surface border-t border-border flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <Code2 className="w-3 h-3 text-accent" />
            Actions JSON Structurées
          </span>
          {attachedImage && (
            <span className="text-[10px] text-accent font-semibold flex items-center gap-1 animate-pulse">
              <ImageIcon className="w-3 h-3" /> Image chargée
            </span>
          )}
        </div>

        {/* 4 Action Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => handleActionChipClick("replace_question")}
            className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/25 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
            title="Modifier ou remplacer une question ciblée"
          >
            <Wand2 className="w-3 h-3" />
            replace_question
          </button>
          <button
            type="button"
            onClick={() => handleActionChipClick("update_html")}
            className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold bg-accent/10 text-accent hover:bg-accent/20 border border-accent/25 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
            title="Remplacer l'ensemble du document HTML"
          >
            <FileCode className="w-3 h-3" />
            update_html
          </button>
          <button
            type="button"
            onClick={() => handleActionChipClick("insert_at_top")}
            className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold bg-success/10 text-success hover:bg-success/20 border border-success/25 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
            title="Insérer au tout début du document"
          >
            <ArrowUpToLine className="w-3 h-3" />
            insert_at_top
          </button>
          <button
            type="button"
            onClick={() => handleActionChipClick("replace_text")}
            className="px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold bg-warning/10 text-warning hover:bg-warning/20 border border-warning/25 shrink-0 transition-all flex items-center gap-1 cursor-pointer"
            title="Remplacer un fragment de texte ciblé"
          >
            <Replace className="w-3 h-3" />
            replace_text
          </button>
        </div>

        {/* Smart Presets when Image is Attached */}
        {attachedImage && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 animate-in fade-in slide-in-from-top-1">
            <button
              type="button"
              onClick={() => handleImagePromptPreset("extract")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent/90 shrink-0 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ImageIcon className="w-3 h-3" />
              Extraire le QCM
            </button>
            <button
              type="button"
              onClick={() => handleImagePromptPreset("style")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-2 text-text hover:bg-surface-2/80 border border-border shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-accent" />
              Copier le style
            </button>
            <button
              type="button"
              onClick={() => handleImagePromptPreset("answer")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-2 text-text hover:bg-surface-2/80 border border-border shrink-0 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3 text-success" />
              Utiliser comme réponse
            </button>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips (wrap onto 2 lines, max 3 visible, rest in '+' menu) */}
      <div className="px-3 py-1.5 bg-surface flex flex-wrap items-center gap-1.5 border-t border-border/50">
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
        {/* Attached Image Preview Card */}
        {attachedImage && (
          <div className="relative flex items-center gap-2.5 p-2 rounded-xl bg-surface-2 border border-accent/30 shadow-xs animate-in fade-in slide-in-from-bottom-2">
            <div
              className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-black/10 shrink-0 cursor-pointer"
              onClick={() => setPreviewModalImage(attachedImage.dataUrl || null)}
              title="Agrandir l'image"
            >
              <img
                src={attachedImage.dataUrl}
                alt="Aperçu joint"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <span className="font-semibold text-text truncate block">
                {attachedImage.name || "Image médicale jointe"}
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Image jointe • Analysable par Gemini
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="h-6 w-6 rounded-full bg-surface hover:bg-surface-2 text-muted hover:text-danger flex items-center justify-center transition-colors cursor-pointer"
              title="Retirer l'image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5">
          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "h-12 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer",
              attachedImage
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-surface-2 text-muted hover:text-text hover:bg-surface-2/80 border border-border"
            )}
            title="Joindre une image (ou coller Ctrl+V)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={1}
            placeholder={
              attachedImage
                ? "Décrivez ce que l'IA doit extraire de l'image (ou appuyez sur Entrée)…"
                : "Demandez une correction médicale, collez une image (Ctrl+V)…"
            }
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              e.target.style.height = "48px";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{ minHeight: "48px" }}
            className="flex-1 resize-none bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent leading-relaxed transition-all"
          />

          <Button
            onClick={handleSend}
            disabled={isThinking || (!inputText.trim() && !attachedImage)}
            variant="default"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl bg-accent text-white hover:bg-accent/90 cursor-pointer"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Keyboard hint below */}
        <div className="flex items-center justify-between text-[10px] text-muted/70 px-1">
          <span>Appuyez sur Entrée pour envoyer • Maj+Entrée pour un saut de ligne</span>
          <span>Coller une image (Ctrl+V)</span>
        </div>
      </div>

      {/* Fullscreen Preview Modal for clicked images */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-surface rounded-xl overflow-hidden border border-border shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-surface-2 text-text hover:bg-surface-2/80 flex items-center justify-center z-10 cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewModalImage}
              alt="Image plein écran"
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
