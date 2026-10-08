import { NextRequest, NextResponse } from "next/server";

// Modèle unique pour garantir une cohérence maximale
const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `Tu es "Antigravity QCM Medical Agent", un expert en pédagogie médicale et en conception de séries de QCM d'annales (Résidanat & Internat en Médecine).

Tu as pour mission d'assister l'utilisateur dans l'édition, la vérification, la correction, la génération et la transcription de QCMs médicaux au format HTML.

Capacités Multimodales & Images :
Si l'utilisateur te transmet une image (capture d'écran de cours, sujet d'examen papier, photo de QCM, tableau clinique ou schéma) :
- Analyse minutieusement le contenu textuel et visuel de l'image.
- Extrais fidèlement les énoncés, les items 1..5, les propositions A..E, ainsi que les réponses correctes et justifications cliniques.
- Reproduis exactement le style visuel exigé pour les QCMs médicaux (boîte .question-box avec bordure cyan/bleue, badge d'auteur/année, badge réponse vert, justifications avec A: Faux / D: Vrai).
- Quand demandé, utilise l'image comme source de vérité pour répondre, vérifier ou remplacer une question.

Actions JSON Structurées :
Quand une modification HTML directe ou ciblée est requise, renvoie TOUJOURS un bloc d'action JSON :
\`\`\`json-action
{
  "action": "update_html" | "replace_question" | "insert_at_top" | "replace_text",
  "target": "...", // numéro de question (ex: "1" ou "q-1") pour replace_question, texte exact pour replace_text
  "content": "...", // fragment HTML complet ou document HTML
  "description": "..." // résumé en français de l'action (ex: "Transcription de la question depuis l'image", "Justification Q4 complétée")
}
\`\`\`

Règles strictes de délimitation (Boundaries) :
- Ne fusionne jamais deux questions dans la même boîte .question-box. Chaque question doit être autonome.
- Les titres de modules, sections, cours et les boîtes d'information (ex: "Il n'y a pas de QCS...") doivent impérativement rester en dehors des boîtes .question-box, dans leurs propres conteneurs séparés.
- Encode toutes tes sorties strictement en UTF-8 avec accents français impeccables (Pédiatrie, Énoncé, Fièvre, etc.).`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, image, currentHtml, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY non configurée dans .env" },
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const contents: Array<{
      role: string;
      parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    }> = [];

    // System instruction as first user/model exchange or systemInstruction if API supports it
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current context
    const userPromptWithContext = `CONTEXTE DOCUMENT ACTUEL (Extrait ou résumé si volumineux) :
${currentHtml ? currentHtml.slice(0, 15000) : "Aucun document ouvert"}

DEMANDE UTILISATEUR :
${prompt}`;

    const userParts: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }> = [];

    // Inject attached multimodal image if provided
    if (image && image.data) {
      const cleanData = image.data.includes("base64,")
        ? image.data.split("base64,")[1]
        : image.data;
      userParts.push({
        inlineData: {
          mimeType: image.mimeType || "image/png",
          data: cleanData,
        },
      });
    }

    userParts.push({ text: userPromptWithContext });

    contents.push({
      role: "user",
      parts: userParts,
    });

    const callModel = async (model: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
          },
        }),
      });
    };

    let replyText = "";
    let lastError: string | null = null;

    try {
      let res = await callModel(GEMINI_MODEL);

      if (res.ok) {
        const data = await res.json();
        replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const errText = await res.text();
        // Si l'API Google signale que le modèle gemini-2.5-flash est restreint (404),
        // bascule transparente vers gemini-flash-latest (stable, sans erreur 503 de saturation)
        if (res.status === 404 && errText.includes("no longer available")) {
          const fallbackRes = await callModel("gemini-flash-latest");
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            lastError = `${GEMINI_MODEL}: ${await fallbackRes.text()}`;
          }
        } else {
          lastError = `${GEMINI_MODEL}: ${errText}`;
        }
      }
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : String(e);
    }

    if (!replyText) {
      return NextResponse.json(
        { error: `Échec de l'appel Gemini : ${lastError}` },
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    // Check for json-action block
    let action = null;
    const actionMatch = replyText.match(/```json-action\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
      } catch {
        // ignore JSON parse error
      }
    }

    return NextResponse.json(
      {
        reply: replyText,
        action,
      },
      {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne Gemini";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
