const https = require('https');
const fs = require('fs');
const path = require('path');

// Global usage statistics tracker
const usageStats = {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCandidateTokens: 0,
    totalTokens: 0,
    successfulRequests: 0,
    failedRequests: 0,
    callsHistory: []
};

// Extract API Key and project metadata from env.txt or environment
function getProjectInfo() {
    let key = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    let projectName = "LES SERIE";
    let projectId = "projects/433375360412";
    let projectNumber = "433375360412";

    const envPath = path.resolve(__dirname, '..', 'env.txt');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split(/\r?\n/).map(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toLowerCase().includes('clé api') || line.toLowerCase().includes('cle api')) {
                if (lines[i + 1] && lines[i + 1].length > 15) {
                    key = lines[i + 1];
                }
            } else if (line.startsWith('AQ.') || line.startsWith('AIza')) {
                key = line;
            } else if (line.toLowerCase() === 'nom' && lines[i + 1]) {
                projectName = lines[i + 1];
            } else if (line.toLowerCase().includes('nom du projet') && lines[i + 1]) {
                projectId = lines[i + 1];
            } else if (line.toLowerCase().includes('numéro du projet') && lines[i + 1]) {
                projectNumber = lines[i + 1];
            }
        }
    }

    return {
        key,
        keyPreview: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '',
        projectName,
        projectId,
        projectNumber
    };
}

function getApiKey() {
    return getProjectInfo().key;
}

// Models hierarchy
const PREFERRED_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview'
];

const SYSTEM_INSTRUCTION = `Tu es "Antigravity QCM Medical Agent", un expert en pédagogie médicale et en conception de séries de QCM d'annales (Résidanat & Internat en Médecine).

RÈGLES CRITIQUES ET ABSOLUES :
1. RESPECT DE LA NUMÉROTATION ORIGINALE :
   - Ne JAMAIS inventer de double numérotation avec "ou", par exemple NE JAMAIS ÉCRIRE "Question 43 (ou 33)" ou "Question 55 (ou 45)".
   - Conserve strictement les numéros originaux fournis ou numérote proprement de façon séquentielle sans parenthèses parasites.
   - Ne JAMAIS ajouter de "(ou A)" ou "(ou 4)" dans les réponses.

2. STRUCTURE D'UN QCM MÉDICAL & SUPPORT DES QUESTIONS NON-STRICTES :
   Chaque question peut être :
   - Un QCM médical complet avec :
     - number: string ou number (ex: "1" ou "33")
     - stem: texte de la question (énoncé)
     - year: session/année si mentionnée (ex: "Dr Kahel,2024,2025" ou "2026, sec B")
     - options: tableau des propositions [ "1) Pneumonie", "2) Tuberculeuse", ... ] ou [ "Proposition A", ... ]
     - answer: lettre(s) correcte(s) (ex: "A", "1", "B, D" ou "" si inconnue)
     - justifications: tableau d'explications pour chaque item
     - clinicalCase: texte facultatif si rattaché à un cas clinique
     - image: chemin d'image facultatif (ex: "images/ecg1.png")
   - OU UNE QUESTION NON-STRICTE (ex: 2 ou 3 items numérotés "1) Pneumonie", "2) Tuberculeuse", sans forcer 5 items A,B,C,D,E si le document source n'en a que 2).

3. SUPPORT DES NOTES, TITRES DE COURS ET REMARQUES INFORMATIVES :
   Si le texte contient des cours sans questions dans les annales ou des remarques pédagogiques, tu DOIS générer des éléments de type note ou titre :
   - Pour un grand titre de partie : { "type": "part", "partTitle": "I- Sémiologie:" }
   - Pour un titre de cours : { "type": "course", "courseTitle": "1- Sémiologie générale" }
   - Pour un cours sans questions / remarque informative : { "type": "note", "text": "Il n'y a pas de QCSs à ce cours dans les examens disponibles" }

4. JUSTIFICATIONS MÉDICALES :
   - Si les justifications sont fournies dans le texte original, conserve-les avec précision.
   - Si elles sont absentes ou partielles, génère des justifications médicales concises, exactes et conformes aux référentiels médicaux.

5. FORMAT DE RÉPONSE :
   - Lorsque l'utilisateur demande de convertir ou ajouter des questions, réponds toujours en JSON valide ou avec le bloc \`\`\`json-action délimité.`;

async function callGemini(prompt, systemInstruction = SYSTEM_INSTRUCTION, jsonMode = false) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Clé API Gemini introuvable dans env.txt ni dans les variables d'environnement.");
    }

    let lastError = null;
    const startTime = Date.now();
    usageStats.totalRequests++;

    for (const model of PREFERRED_MODELS) {
        try {
            const result = await requestModel(model, apiKey, prompt, systemInstruction, jsonMode);
            const durationMs = Date.now() - startTime;
            
            // Record usage
            usageStats.successfulRequests++;
            const promptTokens = result.usage?.promptTokenCount || 0;
            const candidateTokens = result.usage?.candidatesTokenCount || 0;
            const totalTokens = result.usage?.totalTokenCount || (promptTokens + candidateTokens);

            usageStats.totalPromptTokens += promptTokens;
            usageStats.totalCandidateTokens += candidateTokens;
            usageStats.totalTokens += totalTokens;

            usageStats.callsHistory.unshift({
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString('fr-FR'),
                model,
                promptTokens,
                candidateTokens,
                totalTokens,
                durationMs,
                status: 'success'
            });

            if (usageStats.callsHistory.length > 50) {
                usageStats.callsHistory.pop();
            }

            return {
                model,
                text: result.text,
                usage: result.usage,
                durationMs
            };
        } catch (err) {
            lastError = err;
            console.warn(`Modèle ${model} indisponible (${err.message}), tentative avec le modèle suivant...`);
        }
    }

    usageStats.failedRequests++;
    usageStats.callsHistory.unshift({
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('fr-FR'),
        model: 'All models failed',
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
        status: 'error',
        error: lastError?.message || "Échec"
    });

    throw lastError || new Error("Tous les modèles Gemini ont échoué.");
}

function requestModel(model, apiKey, prompt, systemInstruction, jsonMode) {
    return new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            systemInstruction: {
                parts: [
                    { text: systemInstruction }
                ]
            },
            generationConfig: {
                temperature: 0.2
            }
        };

        if (jsonMode) {
            payload.generationConfig.responseMimeType = "application/json";
        }

        const data = JSON.stringify(payload);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 60000
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(body);
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        const usage = parsed?.usageMetadata || null;
                        resolve({ text, usage });
                    } catch (e) {
                        reject(new Error("Réponse JSON invalide reçue de l'API"));
                    }
                } else {
                    try {
                        const errJson = JSON.parse(body);
                        reject(new Error(`Code ${res.statusCode}: ${errJson?.error?.message || body}`));
                    } catch (e) {
                        reject(new Error(`Code ${res.statusCode}: ${body.slice(0, 150)}`));
                    }
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error("Délai d'attente dépassé (timeout 60s)"));
        });

        req.on('error', err => {
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

module.exports = {
    getApiKey,
    getProjectInfo,
    callGemini,
    usageStats,
    PREFERRED_MODELS,
    SYSTEM_INSTRUCTION
};
