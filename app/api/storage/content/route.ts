import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Nom de fichier requis" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const { data, error } = await supabase.storage.from("storage").download(filename);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Fichier introuvable" },
        { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const content = await data.text();
    return NextResponse.json(
      { filename, content },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur de lecture";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, content } = body;

    if (!filename || typeof content !== "string") {
      return NextResponse.json(
        { error: "Filename et content requis" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const fileBuffer = Buffer.from(content, "utf-8");
    const { data, error } = await supabase.storage.from("storage").upload(filename, fileBuffer, {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: true, file: data, savedAt: new Date().toISOString() },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la sauvegarde";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
