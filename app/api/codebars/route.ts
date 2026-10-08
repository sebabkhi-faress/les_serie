import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBarcodeSVG, generateUniqueCode, generateUnifiedBarcodeSVG, BarcodeFormat } from "@/lib/barcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Récupère la liste des codes-barres ou recherche par code / nom
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");
    const q = searchParams.get("q");

    let query = supabase
      .from("codebars")
      .select("*")
      .order("created_at", { ascending: false });

    if (barcode) {
      query = query.eq("barcode", barcode.trim());
    } else if (q) {
      query = query.or(
        `student_name.ilike.%${q}%,barcode.ilike.%${q}%,document_title.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "Avez-vous exécuté le script SQL 'supabase_codebars_schema.sql' dans l'éditeur SQL de Supabase ?",
          data: [],
        },
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: true, count: data?.length || 0, data: data || [] },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

// POST: Génère et enregistre un nouveau code-barres de protection dans Supabase PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentName = "Destinataire Inconnu",
      documentTitle = "DOCUMENT MÉDICAL",
      seriesSubtitle = "",
      customBarcode = null,
      barcodeFormat = "code128",
      customSvg = null,
    } = body;

    const barcodeCode = (customBarcode && String(customBarcode).trim()) || generateUniqueCode();
    const barcodeSvg =
      customSvg ||
      generateUnifiedBarcodeSVG(barcodeCode, barcodeFormat as BarcodeFormat, {
        height: 38,
        fontSize: 10,
        unitWidth: 1.5,
      });

    const record = {
      id: `PROT_${Date.now()}`,
      barcode: barcodeCode,
      student_name: String(studentName).trim(),
      document_title: String(documentTitle).trim(),
      series_subtitle: String(seriesSubtitle).trim(),
      barcode_svg: barcodeSvg,
      status: "Actif",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("codebars")
      .insert([record])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "Exécutez supabase_codebars_schema.sql dans Supabase SQL Editor.",
          recordFallback: record,
        },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

    return NextResponse.json(
      { success: true, record: data },
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
}

// DELETE: Supprime un enregistrement par son identifiant ou numéro de code-barres
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const barcode = searchParams.get("barcode");

    if (!id && !barcode) {
      return NextResponse.json(
        { success: false, error: "Identifiant ou code-barres requis" },
        { status: 400 }
      );
    }

    let deleteQuery = supabase.from("codebars").delete();
    if (id) {
      deleteQuery = deleteQuery.eq("id", id);
    } else if (barcode) {
      deleteQuery = deleteQuery.eq("barcode", barcode);
    }

    const { error } = await deleteQuery;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Code-barres supprimé" });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// PATCH: Met à jour le nom de l'étudiant, le matricule ou le titre d'un enregistrement existant dans Supabase
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, studentName, barcode, documentTitle, barcodeSvg } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Identifiant id requis pour la mise à jour" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (studentName !== undefined) updates.student_name = String(studentName).trim();
    if (barcode !== undefined) updates.barcode = String(barcode).trim();
    if (documentTitle !== undefined) updates.document_title = String(documentTitle).trim();
    if (barcodeSvg !== undefined) updates.barcode_svg = barcodeSvg;

    const { data, error } = await supabase
      .from("codebars")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

