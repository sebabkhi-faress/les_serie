import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data, error } = await supabase.storage.from("storage").list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const files = (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    return NextResponse.json(
      { files },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("name") as string | null;

    if (!file && !customName) {
      return NextResponse.json(
        { error: "Fichier requis" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    let filename = customName || file?.name || "document.html";
    if (!filename.endsWith(".html") && !filename.endsWith(".pdf")) {
      filename += ".html";
    }

    const fileBuffer = file
      ? Buffer.from(await file.arrayBuffer())
      : Buffer.from(
          `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Nouvelle Série Médicale</title>
</head>
<body>
  <h1>Nouvelle Série de QCM</h1>
</body>
</html>`,
          "utf-8"
        );
    const contentType = filename.endsWith(".pdf") ? "application/pdf" : "text/html; charset=utf-8";

    const { data, error } = await supabase.storage.from("storage").upload(filename, fileBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: true, file: data },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Nom de fichier requis" },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    const { data, error } = await supabase.storage.from("storage").remove([filename]);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de la suppression";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}
