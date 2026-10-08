import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-flash-latest",
];

const SYSTEM_PROMPT = `Tu es "Antigravity QCM Medical Agent", un expert en pédagogie médicale et en conception de séries de QCM d'annales (Résidanat & Internat en Médecine).

Tu as pour mission d'assister l'utilisateur dans l'édition, la vérification, la correction et la génération de QCMs médicaux au format HTML.
Quand l'utilisateur te demande de modifier le document ou une question :
1. Donne une explication claire et concise de tes actions.
2. Si une modification HTML directe est demandée, tu peux renvoyer un bloc d'action JSON sous la forme :
\`\`\`json-action
{
  "action": "update_html" | "replace_question" | "insert_at_top" | "replace_text",
  "target": "...", // texte à remplacer ou numéro de question si applicable
  "content": "...", // nouveau fragment HTML ou document complet
  "description": "..." // résumé en français de l'action effectuée (ex: "Titre du cours mis à jour", "Justification Q4 enrichie")
}
\`\`\`
Reste rigoureux sur le plan médical (justifications, exactitude clinique, valeurs seuils, etc.). Encode toujours tes sorties strictement en UTF-8 avec accents corrects (ex: Pédiatrie, Énoncé, etc.).`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentHtml, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY non configurée dans .env.local" },
        {
          status: 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const contents = [];

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

    contents.push({
      role: "user",
      parts: [{ text: userPromptWithContext }],
    });

    let lastError = null;
    let replyText = "";

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
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

        if (res.ok) {
          const data = await res.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (replyText) break;
        } else {
          const errData = await res.text();
          lastError = `${model}: ${errData}`;
        }
      } catch (e: unknown) {
        lastError = e instanceof Error ? e.message : String(e);
      }
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
