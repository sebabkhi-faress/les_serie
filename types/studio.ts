export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: {
    size?: number;
    mimetype?: string;
  };
}

export interface AttachedImage {
  dataUrl?: string;
  mimeType: string;
  base64: string;
  name?: string;
}

export interface AgentAction {
  action: "update_html" | "replace_question" | "insert_at_top" | "replace_text" | string;
  target?: string;
  content?: string;
  description?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp?: string;
  action?: AgentAction;
}

export interface ParsedQuestion {
  id: string;
  num: number | string;
  title: string;
  year?: string;
  options: string[];
  answer?: string;
  rawHtml?: string;
}

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export type ActivePanel = "ai" | "paste" | "questions" | "series" | "codebars" | "settings" | null;

export type EditorViewMode = "edit" | "preview" | "code";

export interface ProtectionConfig {
  studentName: string;
  studentCode: string;
  watermarkText?: string;
  enabled: boolean;
}

export interface CodebarRecord {
  id: string;
  barcode: string;
  student_name: string;
  document_title: string;
  series_subtitle?: string;
  barcode_svg?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}
