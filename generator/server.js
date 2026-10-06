const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { execFile } = require('child_process');
const { getApiKey, getProjectInfo, callGemini, usageStats, PREFERRED_MODELS, SYSTEM_INSTRUCTION } = require('./geminiAgent');
const { buildCompleteHtml, applyProtectionToExistingHtml } = require('./htmlBuilder');
const { protectExistingPdf } = require('./pdfProtector');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const FILES_DIR = path.join(WORKSPACE_DIR, 'files');

if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
}

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // --- API ROUTES ---
    if (pathname.startsWith('/api/')) {
        return handleApiRoutes(req, res, pathname, method, parsedUrl);
    }

    // --- IMAGES STATIC SERVING ---
    if (pathname.startsWith('/images/') || pathname.startsWith('/files/images/')) {
        const imgName = path.basename(pathname);
        let imgPath = path.join(FILES_DIR, 'images', imgName);
        if (!fs.existsSync(imgPath)) {
            imgPath = path.join(WORKSPACE_DIR, 'images', imgName);
        }
        if (fs.existsSync(imgPath) && fs.statSync(imgPath).isFile()) {
            const ext = path.extname(imgPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'image/png';
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400'
            });
            fs.createReadStream(imgPath).pipe(res);
            return;
        }
    }

    // --- STATIC FILES ---
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Normalize and check traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            if (!path.extname(filePath)) {
                filePath = path.join(PUBLIC_DIR, 'index.html');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                return res.end('File Not Found');
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Server Error');
            }
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        });
    });
});

async function handleApiRoutes(req, res, pathname, method, parsedUrl) {
    // 1. GET /api/status
    if (pathname === '/api/status' && method === 'GET') {
        const proj = getProjectInfo();
        return sendJson(res, 200, {
            ok: true,
            hasKey: !!proj.key,
            keyPreview: proj.keyPreview,
            project: proj,
            models: PREFERRED_MODELS,
            message: proj.key ? "Clé Gemini active et prête" : "Clé API introuvable dans env.txt"
        });
    }

    // 2. GET /api/usage (Credits & Token Usage)
    if (pathname === '/api/usage' && method === 'GET') {
        const proj = getProjectInfo();
        // Estimated cost (Gemini Flash Lite is approx $0.075 / 1M prompt tokens, $0.30 / 1M output tokens)
        const estCost = ((usageStats.totalPromptTokens * 0.000000075) + (usageStats.totalCandidateTokens * 0.0000003)).toFixed(5);
        return sendJson(res, 200, {
            ok: true,
            stats: usageStats,
            project: proj,
            pricing: {
                estimatedCostUsd: estCost,
                tier: "Standard / Free Tier Eligible",
                rateLimits: "15 RPM / 1M TPM"
            },
            models: PREFERRED_MODELS
        });
    }

    // 3. GET /api/ping (Latency & Connection test)
    if (pathname === '/api/ping' && method === 'GET') {
        try {
            const start = Date.now();
            const result = await callGemini("Réponds uniquement: PONG");
            const duration = Date.now() - start;
            return sendJson(res, 200, {
                ok: true,
                durationMs: duration,
                model: result.model,
                reply: result.text.trim()
            });
        } catch (err) {
            return sendJson(res, 500, {
                ok: false,
                error: err.message
            });
        }
    }

const { getRecords, createProtectedRecord, deleteRecord, findRecordByBarcode } = require('./protectionDb');
const { generateBarcodeSVG, generateUniqueCode } = require('./barcodeGenerator');

    // 4. GET /api/protection/list
    if (pathname === '/api/protection/list' && method === 'GET') {
        const records = getRecords();
        return sendJson(res, 200, { ok: true, count: records.length, records });
    }

    // 5. GET /api/protection/generate-code
    if (pathname === '/api/protection/generate-code' && method === 'GET') {
        const code = generateUniqueCode();
        const svg = generateBarcodeSVG(code, { height: 38, fontSize: 10, unitWidth: 1.5 });
        return sendJson(res, 200, { ok: true, code, svg });
    }

function checkHtmlIsProtected(content) {
    if (!content) return false;
    return content.includes('<thead class="running-print-header">') ||
           content.includes('class="protection-screen-banner"') ||
           content.includes('EXEMPLAIRE SÉCURISÉ &amp; TRAÇABLE') ||
           content.includes('EXEMPLAIRE SÉCURISÉ & TRAÇABLE') ||
           content.includes('EXEMPLAIRE SÉCURISÉ');
}

function extractProtectedStudentName(content) {
    if (!content) return '';
    const match = content.match(/Attribué\s*à\s*:\s*<strong>(.*?)<\/strong>/i) ||
                  content.match(/Attribué\s*à\s*:\s*([^\n<]+)/i);
    return match ? match[1].trim() : '';
}

    // 6. GET /api/files/list
    if (pathname === '/api/files/list' && method === 'GET') {
        const fileList = [];
        const seenNames = new Set();

        if (fs.existsSync(FILES_DIR)) {
            const files = fs.readdirSync(FILES_DIR);
            for (const f of files) {
                if (f.endsWith('.html')) {
                    const fullP = path.join(FILES_DIR, f);
                    try {
                        const stat = fs.statSync(fullP);
                        const contentSample = fs.readFileSync(fullP, 'utf-8');
                        const isProtected = checkHtmlIsProtected(contentSample);
                        const studentName = extractProtectedStudentName(contentSample);
                        fileList.push({
                            name: f,
                            relPath: `files/${f}`,
                            size: stat.size,
                            modified: stat.mtime.toLocaleDateString('fr-FR') + ' ' + stat.mtime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            isProtected,
                            studentName
                        });
                        seenNames.add(f);
                    } catch (e) {}
                }
            }
        }

        try {
            const rootFiles = fs.readdirSync(WORKSPACE_DIR);
            for (const f of rootFiles) {
                if (f.endsWith('.html') && !seenNames.has(f)) {
                    const fullP = path.join(WORKSPACE_DIR, f);
                    try {
                        const stat = fs.statSync(fullP);
                        const contentSample = fs.readFileSync(fullP, 'utf-8');
                        const isProtected = checkHtmlIsProtected(contentSample);
                        const studentName = extractProtectedStudentName(contentSample);
                        fileList.push({
                            name: f,
                            relPath: f,
                            size: stat.size,
                            modified: stat.mtime.toLocaleDateString('fr-FR') + ' ' + stat.mtime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            isProtected,
                            studentName
                        });
                        seenNames.add(f);
                    } catch (e) {}
                }
            }
        } catch (e) {}

        return sendJson(res, 200, { ok: true, files: fileList });
    }

    // 6b. GET /api/images/list
    if (pathname === '/api/images/list' && method === 'GET') {
        const imageList = [];
        const seenNames = new Set();
        const imgDirs = [path.join(FILES_DIR, 'images'), path.join(WORKSPACE_DIR, 'images')];
        imgDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                try {
                    const files = fs.readdirSync(dir);
                    for (const f of files) {
                        if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(path.extname(f).toLowerCase()) && !seenNames.has(f)) {
                            try {
                                const stat = fs.statSync(path.join(dir, f));
                                imageList.push({
                                    name: f,
                                    url: `/images/${f}`,
                                    size: stat.size,
                                    modified: stat.mtime.toLocaleDateString('fr-FR') + ' ' + stat.mtime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                });
                                seenNames.add(f);
                            } catch(e) {}
                        }
                    }
                } catch(e) {}
            }
        });
        return sendJson(res, 200, { ok: true, count: imageList.length, images: imageList });
    }

    // 6c. GET /api/chat/history
    if (pathname === '/api/chat/history' && method === 'GET') {
        const reqFile = path.basename(parsedUrl.query.file || 'serie1.html').replace(/\.html$/i, '');
        const histPath = path.join(FILES_DIR, `.chat_history_${reqFile}.json`);
        let history = [];
        if (fs.existsSync(histPath)) {
            try { history = JSON.parse(fs.readFileSync(histPath, 'utf-8')); } catch(e) {}
        }
        return sendJson(res, 200, { ok: true, filename: reqFile, history });
    }

    // 7. GET /api/files/read
    if (pathname === '/api/files/read' && method === 'GET') {
        const reqFile = path.basename(parsedUrl.query.file || 'serie1.html');
        let targetPath = path.join(FILES_DIR, reqFile);
        const rootPath = path.join(WORKSPACE_DIR, reqFile);

        if (fs.existsSync(rootPath) && fs.existsSync(targetPath)) {
            const rootStat = fs.statSync(rootPath);
            const filesStat = fs.statSync(targetPath);
            if (rootStat.mtimeMs > filesStat.mtimeMs) {
                targetPath = rootPath;
                try { fs.copyFileSync(rootPath, path.join(FILES_DIR, reqFile)); } catch (e) {}
            }
        } else if (!fs.existsSync(targetPath) && fs.existsSync(rootPath)) {
            targetPath = rootPath;
        }

        if (!fs.existsSync(targetPath)) {
            return sendJson(res, 404, { ok: false, error: `Fichier ${reqFile} introuvable.` });
        }
        const content = fs.readFileSync(targetPath, 'utf-8');
        const stat = fs.statSync(targetPath);
        const isProtected = checkHtmlIsProtected(content);
        const studentName = extractProtectedStudentName(content);
        return sendJson(res, 200, {
            ok: true,
            filename: reqFile,
            content,
            size: stat.size,
            isProtected,
            studentName
        });
    }

    // 8b. GET /api/download-pdf
    if (pathname === '/api/download-pdf' && (method === 'GET' || method === 'HEAD')) {
        const reqFile = path.basename(parsedUrl.query.file || '');
        let pdfPath = path.join(WORKSPACE_DIR, reqFile);
        if (!fs.existsSync(pdfPath)) {
            pdfPath = path.join(FILES_DIR, reqFile);
        }
        if (!fs.existsSync(pdfPath)) {
            // Case-insensitive fallback
            const dirs = [WORKSPACE_DIR, FILES_DIR];
            for (const d of dirs) {
                if (fs.existsSync(d)) {
                    try {
                        const files = fs.readdirSync(d);
                        const found = files.find(f => f.toLowerCase() === reqFile.toLowerCase());
                        if (found) {
                            pdfPath = path.join(d, found);
                            break;
                        }
                    } catch (e) {}
                }
            }
        }
        if (!fs.existsSync(pdfPath)) {
            return sendJson(res, 404, { ok: false, error: "Fichier PDF introuvable." });
        }
        const stat = fs.statSync(pdfPath);
        const baseName = path.basename(pdfPath);
        const cleanBaseName = baseName.replace(/["\r\n]/g, '');
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': stat.size,
            'Content-Disposition': `attachment; filename="${cleanBaseName}"; filename*=UTF-8''${encodeURIComponent(cleanBaseName)}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Accept-Ranges': 'bytes'
        });
        if (method === 'HEAD') return res.end();
        fs.createReadStream(pdfPath).pipe(res);
        return;
    }

    // 8. GET /api/load-existing (Backwards compatibility)
    if (pathname === '/api/load-existing' && method === 'GET') {
        const fileName = path.basename(parsedUrl.query.file || 'serie1.html');
        let targetPath = path.join(FILES_DIR, fileName);
        if (!fs.existsSync(targetPath)) targetPath = path.join(WORKSPACE_DIR, fileName);
        if (!fs.existsSync(targetPath)) {
            return sendJson(res, 404, { ok: false, error: "Fichier non trouvé" });
        }
        const html = fs.readFileSync(targetPath, 'utf-8');
        return sendJson(res, 200, { ok: true, filename: fileName, html });
    }

    // Body parsing for POST
    if (method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => bodyStr += chunk);
        req.on('end', async () => {
            let data = {};
            try {
                if (bodyStr) data = JSON.parse(bodyStr);
            } catch (e) {
                return sendJson(res, 400, { ok: false, error: "Format JSON invalide dans la requête." });
            }

            try {
                // 5. POST /api/chat (Agent avec mémoire persistante, contexte de document & anti-doublon)
                if (pathname === '/api/chat') {
                    const { message, filename = 'serie1.html', seriesData = {}, history = [] } = data;
                    if (!message) {
                        return sendJson(res, 400, { ok: false, error: "Message manquant." });
                    }

                    const safeFilename = path.basename(filename).replace(/\.html$/i, '');
                    const histPath = path.join(FILES_DIR, `.chat_history_${safeFilename}.json`);

                    // Merge and persist history
                    let fullHistory = Array.isArray(history) && history.length > 0 ? history : [];
                    if (fullHistory.length === 0 && fs.existsSync(histPath)) {
                        try { fullHistory = JSON.parse(fs.readFileSync(histPath, 'utf-8')); } catch(e) {}
                    }

                    // Read actual file content from disk to get ground truth
                    let realFileContent = '';
                    const filePathsToCheck = [
                        path.join(FILES_DIR, filename),
                        path.join(WORKSPACE_DIR, filename),
                        path.join(FILES_DIR, safeFilename + '.html'),
                        path.join(WORKSPACE_DIR, safeFilename + '.html')
                    ];
                    for (const fp of filePathsToCheck) {
                        if (fs.existsSync(fp)) {
                            try { realFileContent = fs.readFileSync(fp, 'utf-8'); break; } catch(e) {}
                        }
                    }

                    let existingQuestionNums = [];
                    let existingHeaders = [];
                    if (realFileContent) {
                        const qNumRegex = /class="q-num"[^>]*>(?:Question\s*)?(\d+)/gi;
                        let m;
                        while ((m = qNumRegex.exec(realFileContent)) !== null) {
                            existingQuestionNums.push(parseInt(m[1]));
                        }
                        if (existingQuestionNums.length === 0) {
                            const fallbackRegex = /Question\s*(\d+)/gi;
                            while ((m = fallbackRegex.exec(realFileContent)) !== null) {
                                existingQuestionNums.push(parseInt(m[1]));
                            }
                        }
                        existingQuestionNums = [...new Set(existingQuestionNums)].sort((a, b) => a - b);

                        const hRegex = /<(?:h1|h2|h3|div)[^>]*class="[^"]*(?:part-header|course-header|section-header|course-card|note-banner)[^"]*"[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|div)>/gi;
                        let hm;
                        while ((hm = hRegex.exec(realFileContent)) !== null) {
                            existingHeaders.push(hm[1].replace(/<[^>]+>/g, '').trim());
                        }
                    }

                    const prompt = `Voici l'état actuel vérifié du document sur le disque :
Fichier actif : ${filename}
Titre Principal : ${seriesData?.title || 'Non défini'}
Sous-titre : ${seriesData?.subtitle || ''}

NUMÉROS DE QUESTIONS RÉELLEMENT PRÉSENTES SUR LE DISQUE :
${existingQuestionNums.length > 0 ? existingQuestionNums.map(n => `Q${n}`).join(', ') : 'Aucune question détectée'} (Total : ${existingQuestionNums.length} questions)

Sections / cours détectés sur le disque :
${existingHeaders.length > 0 ? existingHeaders.join(' | ') : 'Non listé'}

Historique des échanges récents :
${fullHistory.slice(-10).map(h => `${h.role}: ${h.text}`).join('\n')}

L'utilisateur demande :
"${message}"

RÈGLES STRICTES DE GESTION DU DOCUMENT, DES TITRES ET DES QUESTIONS :
1. VÉRITÉ TERRAIN (LE DISQUE) :
   - Fais UNIQUEMENT foi à la liste des "NUMÉROS DE QUESTIONS RÉELLEMENT PRÉSENTES SUR LE DISQUE" ci-dessus.
   - Si l'utilisateur colle de nouvelles questions et que ces numéros ne figurent PAS dans la liste des questions présentes sur le disque, tu DOIS LES GÉNÉRER ET LES AJOUTER ! Ne prétends JAMAIS qu'elles sont déjà présentes.

2. CONSERVATION ABSOLUE DES TITRES DE COURS ET DE CHAPITRES (RÈGLE OBLIGATOIRE) :
   - Si le texte fourni par l'utilisateur commence par ou contient un titre de cours, de chapitre ou de partie (ex: "21- Syndrome bronchique", "I- Sémiologie:", "5- Signes physiques"), TU NE DOIS SOUS AUCUN PRÉTEXTE LE SUPPRIMER NI LE SAUTER !
   - Tu DOIS IMPÉRATIVEMENT l'insérer avant les questions correspondantes sous le format exact :
     <div class="course-title"><u><strong>21- Syndrome bronchique</strong></u></div>
     (ou <div class="part-title"><u><strong>I- Sémiologie:</strong></u></div> pour une partie).

3. FORMAT D'INSERTION OBLIGATOIRE ("update_html") :
   - Pour tout ajout de cours ou de questions, utilise EXCLUSIVEMENT l'action "update_html" avec "placement": "end_of_main".
   - Le "htmlSnippet" doit être complet et prêt à être inséré, structuré ainsi :
     \`\`\`json-action
     {
       "action": "update_html",
       "htmlSnippet": "\\n    <div class=\\"course-title\\"><u><strong>21- Syndrome bronchique</strong></u></div>\\n\\n    <!-- QUESTION 80 -->\\n    <div class=\\"question-box\\">\\n        <div class=\\"question-header\\">\\n            <span class=\\"q-stem\\"><span class=\\"q-num\\">Question 80 :</span> Devant un asthme bronchique : (RF)</span>\\n            <span class=\\"year-badge\\">(ratt2024)</span>\\n        </div>\\n        <ol class=\\"options alpha\\">\\n            <li>Option A...</li>\\n            <li>Option B...</li>\\n        </ol>\\n        <div class=\\"answer-section\\">\\n            <hr class=\\"answer-divider\\">\\n            <div class=\\"answer-line\\"><span class=\\"answer-label\\">Réponse :</span> <span class=\\"answer-badge\\">A</span></div>\\n            <div class=\\"justification-title\\">Justification :</div>\\n            <ul class=\\"justifications\\">\\n                <li><strong class=\\"text-incorrect\\">A : Faux</strong> — <span class=\\"text-incorrect\\">Explication...</span></li>\\n                <li><strong class=\\"text-correct\\">B : Vrai</strong> — <span class=\\"text-correct\\">Explication...</span></li>\\n            </ul>\\n        </div>\\n    </div>",
       "placement": "end_of_main",
       "message": "Ajout du cours '21- Syndrome bronchique' et de la Question 80 avec ses justifications complètes."
     }
     \`\`\`

4. ZÉRO ACTION VIDE :
   - N'émets JAMAIS une action "update_html" avec "htmlSnippet": "" !
   - Remplis TOUJOURS complètement les justifications (texte complet pour chaque proposition A, B, C, D, E), ne laisse JAMAIS de balises vides !
   - Conserve toujours le style professionnel, la rigueur médicale et la mise en page soignée.`;

                    const geminiRes = await callGemini(prompt);

                    // Update and save history
                    fullHistory.push({ role: 'user', text: message });
                    fullHistory.push({ role: 'agent', text: geminiRes.text });
                    if (fullHistory.length > 50) fullHistory = fullHistory.slice(-50);
                    try { fs.writeFileSync(histPath, JSON.stringify(fullHistory, null, 2), 'utf-8'); } catch(e) {}

                    return sendJson(res, 200, {
                        ok: true,
                        reply: geminiRes.text,
                        history: fullHistory,
                        model: geminiRes.model,
                        usage: geminiRes.usage,
                        durationMs: geminiRes.durationMs
                    });
                }

                // 5b. POST /api/chat/clear (Effacer l'historique de discussion)
                if (pathname === '/api/chat/clear') {
                    let { filename = 'serie1.html' } = data;
                    const safeFilename = path.basename(filename).replace(/\.html$/i, '');
                    const histPath = path.join(FILES_DIR, `.chat_history_${safeFilename}.json`);
                    if (fs.existsSync(histPath)) {
                        try { fs.unlinkSync(histPath); } catch(e) {}
                    }
                    return sendJson(res, 200, { ok: true, message: `Historique de ${filename} effacé.` });
                }

                // 5c. POST /api/chat/save-history
                if (pathname === '/api/chat/save-history') {
                    let { filename = 'serie1.html', history = [] } = data;
                    const safeFilename = path.basename(filename).replace(/\.html$/i, '');
                    const histPath = path.join(FILES_DIR, `.chat_history_${safeFilename}.json`);
                    try { fs.writeFileSync(histPath, JSON.stringify(history, null, 2), 'utf-8'); } catch(e) {}
                    return sendJson(res, 200, { ok: true });
                }

                // 6. POST /api/transform (Raw Text -> Structured QCM)
                if (pathname === '/api/transform') {
                    const { rawText, defaultChapter = '', startNumber = null } = data;
                    if (!rawText || !rawText.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Texte brut manquant." });
                    }

                    const prompt = `Convertis le texte brut suivant en une liste de questions QCM médicales structurées.

RÈGLES IMPÉRATIVES :
1. RESPECTE STRICTEMENT LA NUMÉROTATION ORIGINALE du texte (ou numérote à partir de ${startNumber || 1} si non numéroté).
2. NE METS AUCUN "ou" dans les numéros ou réponses ! JAMAIS de "Question 43 (ou 33)", écris simplement le bon numéro d'origine.
3. Extrais l'année/session si mentionnée entre parenthèses (ex: "2026, sec B" ou "2016").
4. Conserve chaque option (A, B, C, D, E ou 1, 2, 3, 4, 5).
5. Renseigne la bonne réponse (answer) et génère pour chaque item une justification médicale concise et rigoureuse (Vrai / Faux avec explication médicale).
${defaultChapter ? `6. Assigne le chapitre "${defaultChapter}" à chaque question.` : ''}

Réponds STRICTEMENT par un objet JSON avec cette structure :
{
  "questions": [
    {
      "number": 1,
      "chapter": "${defaultChapter || ''}",
      "stem": "Énoncé complet de la question...",
      "year": "2026, sec B",
      "options": [
        "Texte proposition A",
        "Texte proposition B",
        "Texte proposition C",
        "Texte proposition D",
        "Texte proposition E"
      ],
      "answer": "A",
      "justifications": [
        { "item": "A", "status": "Vrai", "text": "Explication claire..." },
        { "item": "B", "status": "Faux", "text": "Explication claire..." },
        { "item": "C", "status": "Faux", "text": "Explication claire..." },
        { "item": "D", "status": "Faux", "text": "Explication claire..." },
        { "item": "E", "status": "Faux", "text": "Explication claire..." }
      ]
    }
  ]
}

TEXTE BRUT À TRANSFORMER :
"""
${rawText}
"""`;

                    const geminiRes = await callGemini(prompt, SYSTEM_INSTRUCTION, true);
                    let parsedData = null;
                    try {
                        let cleanJson = geminiRes.text.trim();
                        if (cleanJson.startsWith('```json')) {
                            cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
                        } else if (cleanJson.startsWith('```')) {
                            cleanJson = cleanJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
                        }
                        parsedData = JSON.parse(cleanJson);
                    } catch (parseErr) {
                        return sendJson(res, 500, {
                            ok: false,
                            error: "L'IA a produit un format JSON incomplet. Réessayez avec un extrait plus court.",
                            raw: geminiRes.text
                        });
                    }

                    const questions = parsedData.questions || [];
                    return sendJson(res, 200, {
                        ok: true,
                        count: questions.length,
                        questions,
                        model: geminiRes.model,
                        usage: geminiRes.usage,
                        durationMs: geminiRes.durationMs
                    });
                }

                // 7. POST /api/compile-html
                if (pathname === '/api/compile-html') {
                    const html = buildCompleteHtml(data);
                    return sendJson(res, 200, { ok: true, html });
                }

                // 8. POST /api/save-series (Direct Save & Auto-save)
                if (pathname === '/api/save-series') {
                    let { filename = 'serie2.html', seriesData } = data;
                    if (!filename.endsWith('.html')) filename += '.html';
                    
                    const safeName = path.basename(filename);
                    const destPath = path.join(WORKSPACE_DIR, safeName);
                    const htmlContent = buildCompleteHtml(seriesData || data);

                    fs.writeFileSync(destPath, htmlContent, 'utf-8');
                    try { fs.writeFileSync(path.join(FILES_DIR, safeName), htmlContent, 'utf-8'); } catch(e) {}
                    const savedTime = new Date().toLocaleTimeString('fr-FR');
                    return sendJson(res, 200, {
                        ok: true,
                        filename: safeName,
                        path: destPath,
                        savedAt: savedTime,
                        size: Buffer.byteLength(htmlContent, 'utf-8'),
                        message: `Sauvegardé avec succès dans ${safeName}`
                    });
                }

                // 9. POST /api/render-pdf (Génération & Téléchargement PDF Protégé ou Standard)
                if (pathname === '/api/render-pdf') {
                    let { 
                        filename = 'SERIE_EXPORT.pdf', 
                        seriesData, 
                        html, 
                        studentName = '', 
                        documentTitle = '',
                        customBarcode = null
                    } = data;

                    let safeName = path.basename(filename);
                    if (!safeName.endsWith('.pdf')) safeName += '.pdf';

                    const destPdfPath = path.join(WORKSPACE_DIR, safeName);
                    const tempHtmlPath = path.join(__dirname, `temp_print_${Date.now()}.html`);

                    let finalHtml = html || (seriesData ? buildCompleteHtml(seriesData) : '');

                    // If studentName provided, apply protection
                    let record = null;
                    let protHtmlName = null;
                    if (studentName && studentName.trim()) {
                        record = createProtectedRecord({
                            studentName: studentName.trim(),
                            documentTitle: documentTitle || "MODULE MÉDICAL",
                            seriesSubtitle: "Exemplaire Nominatif Sécurisé",
                            customBarcode
                        });

                        const protResult = applyProtectionToExistingHtml(finalHtml, {
                            studentName: record.studentName,
                            barcode: record.barcode,
                            barcodeSvg: record.barcodeSvg,
                            documentTitle: record.documentTitle,
                            date: record.date
                        });
                        finalHtml = protResult.securedHtml;

                        // Save as a separate protected file so original stays 100% untouched
                        const rawBase = path.basename(filename).replace(/\.pdf$/i, '').replace(/\.html$/i, '');
                        protHtmlName = `${rawBase}_PROTEGE_${record.barcode.substring(0, 4)}.html`;
                        try {
                            fs.writeFileSync(path.join(FILES_DIR, protHtmlName), finalHtml, 'utf-8');
                            fs.writeFileSync(path.join(WORKSPACE_DIR, protHtmlName), finalHtml, 'utf-8');
                        } catch (e) {}
                    }

                    fs.writeFileSync(tempHtmlPath, finalHtml, 'utf-8');

                    // If destPdfPath exists, try unlinking to avoid stale file/lock
                    try { if (fs.existsSync(destPdfPath)) fs.unlinkSync(destPdfPath); } catch (e) {}

                    const os = require('os');
                    const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_pdf_'));
                    const browserCandidates = [
                        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
                    ];
                    const selectedBrowser = browserCandidates.find(p => fs.existsSync(p)) || 'chrome.exe';

                    const execArgs = [
                        '--headless=new',
                        '--disable-gpu',
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-software-rasterizer',
                        `--user-data-dir=${tempProfileDir}`,
                        '--no-pdf-header-footer',
                        `--print-to-pdf=${destPdfPath}`,
                        tempHtmlPath
                    ];

                    execFile(selectedBrowser, execArgs, { timeout: 60000, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
                        try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (e) {}
                        try { if (fs.existsSync(tempProfileDir)) fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (e) {}

                        if (!fs.existsSync(destPdfPath)) {
                            return sendJson(res, 500, {
                                ok: false,
                                error: error ? `Erreur génération PDF : ${error.message}` : "Le navigateur n'a pas pu créer le fichier PDF."
                            });
                        }

                        // Also sync PDF into FILES_DIR
                        try { fs.copyFileSync(destPdfPath, path.join(FILES_DIR, safeName)); } catch (e) {}

                        const stat = fs.statSync(destPdfPath);
                        return sendJson(res, 200, {
                            ok: true,
                            filename: safeName,
                            size: stat.size,
                            record,
                            securedHtml: finalHtml,
                            protHtmlName,
                            downloadUrl: `/api/download-pdf?file=${encodeURIComponent(safeName)}`,
                            message: `PDF ${record ? 'protégé' : 'standard'} généré avec succès (${safeName})`
                        });
                    });
                    return;
                }

                // 10. POST /api/protection/register
                if (pathname === '/api/protection/register') {
                    const { studentName, documentTitle, seriesSubtitle, customBarcode } = data;
                    if (!studentName || !studentName.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Nom du destinataire requis." });
                    }
                    const record = createProtectedRecord({
                        studentName,
                        documentTitle: documentTitle || "MODULE MÉDICAL",
                        seriesSubtitle: seriesSubtitle || "",
                        customBarcode
                    });
                    return sendJson(res, 200, { ok: true, record });
                }

                // 11. POST /api/protection/delete
                if (pathname === '/api/protection/delete') {
                    const { id } = data;
                    deleteRecord(id);
                    return sendJson(res, 200, { ok: true });
                }

                // 12. POST /api/files/create
                if (pathname === '/api/files/create') {
                    let { filename = 'nouvelle_serie.html', title = 'NOUVELLE SÉRIE MÉDICALE', subtitle = 'QCM Corrigés & Justifiés' } = data;
                    let safeName = path.basename(filename).trim();
                    if (!safeName.endsWith('.html')) safeName += '.html';
                    if (safeName === '.html') safeName = `serie_${Date.now()}.html`;

                    const targetPath = path.join(FILES_DIR, safeName);
                    const initialHtml = buildCompleteHtml({
                        title,
                        subtitle,
                        startPage: 1,
                        questions: [
                            {
                                number: 1,
                                stem: "Nouvelle question médicale : Cliquez sur Coller & Convertir ou demandez à l'IA...",
                                year: "2026",
                                options: [
                                    "Proposition A",
                                    "Proposition B",
                                    "Proposition C",
                                    "Proposition D",
                                    "Proposition E"
                                ],
                                answer: "A",
                                justifications: [
                                    { item: "A", status: "Vrai", text: "Justification médicale détaillée de la proposition A." },
                                    { item: "B", status: "Faux", text: "Explication de l'erreur pour la proposition B." }
                                ]
                            }
                        ]
                    });

                    fs.writeFileSync(targetPath, initialHtml, 'utf-8');
                    return sendJson(res, 200, {
                        ok: true,
                        filename: safeName,
                        content: initialHtml,
                        message: `Fichier ${safeName} créé dans files/`
                    });
                }

                // 13. POST /api/files/save
                if (pathname === '/api/files/save') {
                    let { filename = 'serie1.html', content = '' } = data;
                    let safeName = path.basename(filename).trim();
                    if (!safeName.endsWith('.html')) safeName += '.html';

                    const filesPath = path.join(FILES_DIR, safeName);
                    fs.writeFileSync(filesPath, content, 'utf-8');

                    // Sync to root if file exists in root
                    const rootPath = path.join(WORKSPACE_DIR, safeName);
                    if (fs.existsSync(rootPath)) {
                        fs.writeFileSync(rootPath, content, 'utf-8');
                    }

                    const savedTime = new Date().toLocaleTimeString('fr-FR');
                    return sendJson(res, 200, {
                        ok: true,
                        filename: safeName,
                        size: Buffer.byteLength(content, 'utf-8'),
                        savedAt: savedTime,
                        message: `Sauvegardé avec succès (${safeName})`
                    });
                }

                // 14. POST /api/files/import
                if (pathname === '/api/files/import') {
                    let { filename = 'document_importe.html', content = '' } = data;
                    let safeName = path.basename(filename).trim();
                    if (!safeName.endsWith('.html')) safeName += '.html';

                    if (!content || !content.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Contenu HTML vide." });
                    }

                    const targetPath = path.join(FILES_DIR, safeName);
                    fs.writeFileSync(targetPath, content, 'utf-8');

                    const isProtected = content.includes('running-print-header') || content.includes('doc-table-wrapper');
                    return sendJson(res, 200, {
                        ok: true,
                        filename: safeName,
                        size: Buffer.byteLength(content, 'utf-8'),
                        isProtected,
                        content,
                        message: `Document ${safeName} importé dans files/`
                    });
                }

                // 15. POST /api/protection/apply-to-html
                if (pathname === '/api/protection/apply-to-html') {
                    let { html = '', studentName = '', documentTitle = '', customBarcode = null, saveAsFile = null } = data;
                    if (!studentName || !studentName.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Nom du destinataire requis." });
                    }
                    if (!html || !html.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Contenu HTML manquant." });
                    }

                    // Register in DB
                    const record = createProtectedRecord({
                        studentName,
                        documentTitle: documentTitle || "MODULE MÉDICAL",
                        seriesSubtitle: "Exemplaire Nominatif Sécurisé",
                        customBarcode
                    });

                    // Apply protection to HTML
                    const result = applyProtectionToExistingHtml(html, {
                        studentName: record.studentName,
                        barcode: record.barcode,
                        barcodeSvg: record.barcodeSvg,
                        documentTitle: record.documentTitle,
                        date: record.date
                    });

                    // Support creating a separate protected file without overwriting original
                    let newFileName = null;
                    const { createSeparateFile = false, baseFileName = '' } = data;
                    if (saveAsFile || createSeparateFile) {
                        const rawBase = path.basename(saveAsFile || baseFileName || 'serie.html').replace(/\.html$/i, '');
                        newFileName = `${rawBase}_PROTEGE_${record.barcode.substring(0, 4)}.html`;
                        const savePathFiles = path.join(FILES_DIR, newFileName);
                        const savePathRoot = path.join(WORKSPACE_DIR, newFileName);
                        try {
                            fs.writeFileSync(savePathFiles, result.securedHtml, 'utf-8');
                            fs.writeFileSync(savePathRoot, result.securedHtml, 'utf-8');
                        } catch (e) {
                            console.error('Error saving separate protected file:', e.message);
                        }
                    }

                    return sendJson(res, 200, {
                        ok: true,
                        record,
                        securedHtml: result.securedHtml,
                        newFileName,
                        message: `Protection appliquée avec succès au document (Code: ${record.barcode})`
                    });
                }

                // 16. POST /api/pdf/protect-upload (Importer un PDF et lui appliquer la protection sur toutes les pages)
                if (pathname === '/api/pdf/protect-upload') {
                    let { 
                        pdfBase64, 
                        filename = 'document.pdf', 
                        studentName = '', 
                        documentTitle = '',
                        customBarcode = null
                    } = data;

                    if (!studentName || !studentName.trim()) {
                        return sendJson(res, 400, { ok: false, error: "Nom du destinataire / étudiant requis." });
                    }
                    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
                        return sendJson(res, 400, { ok: false, error: "Contenu PDF manquant (base64 requis)." });
                    }

                    let cleanBase64 = pdfBase64;
                    if (cleanBase64.includes('base64,')) {
                        cleanBase64 = cleanBase64.split('base64,')[1];
                    }
                    const inputBuffer = Buffer.from(cleanBase64, 'base64');

                    if (!inputBuffer || inputBuffer.length === 0) {
                        return sendJson(res, 400, { ok: false, error: "Fichier PDF vide ou corrompu." });
                    }

                    // Register in protection DB
                    const docTitle = documentTitle.trim() || path.basename(filename, path.extname(filename)).toUpperCase();
                    const record = createProtectedRecord({
                        studentName: studentName.trim(),
                        documentTitle: docTitle,
                        seriesSubtitle: "PDF Importé Sécurisé",
                        customBarcode
                    });

                    // Stamp vector security header on every page
                    const { pdfBuffer: protectedBuffer, pageCount } = await protectExistingPdf(inputBuffer, {
                        studentName: record.studentName,
                        barcode: record.barcode,
                        documentTitle: record.documentTitle,
                        date: record.date
                    });

                    // Construct safe output filename
                    let baseClean = path.basename(filename).replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
                    let outputName = `${baseClean}_PROTEGE_${record.barcode.slice(-4)}.pdf`;

                    const outPathWorkspace = path.join(WORKSPACE_DIR, outputName);
                    const outPathFiles = path.join(FILES_DIR, outputName);

                    fs.writeFileSync(outPathWorkspace, protectedBuffer);
                    try { fs.writeFileSync(outPathFiles, protectedBuffer); } catch(e) {}

                    return sendJson(res, 200, {
                        ok: true,
                        filename: outputName,
                        pageCount,
                        size: protectedBuffer.length,
                        record,
                        downloadUrl: `/api/download-pdf?file=${encodeURIComponent(outputName)}`,
                        message: `PDF protégé avec succès (${pageCount} page(s) tatouées, Code: ${record.barcode})`
                    });
                }

                // 17. POST /api/images/upload (Enregistrer une image médicale en fichier local)
                if (pathname === '/api/images/upload') {
                    let { imageBase64, filename = 'image.png', caption = '' } = data;
                    if (!imageBase64 || typeof imageBase64 !== 'string') {
                        return sendJson(res, 400, { ok: false, error: "Contenu image manquant (base64 requis)." });
                    }

                    let cleanBase64 = imageBase64;
                    if (cleanBase64.includes('base64,')) {
                        cleanBase64 = cleanBase64.split('base64,')[1];
                    }
                    const imgBuffer = Buffer.from(cleanBase64, 'base64');
                    if (!imgBuffer || imgBuffer.length === 0) {
                        return sendJson(res, 400, { ok: false, error: "Fichier image vide ou corrompu." });
                    }

                    let ext = path.extname(filename).toLowerCase();
                    if (!['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext)) ext = '.png';
                    let baseClean = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_\-]/g, '_');
                    if (!baseClean) baseClean = 'image';
                    const safeName = `${baseClean}_${Date.now()}${ext}`;

                    const target1 = path.join(FILES_DIR, 'images', safeName);
                    const target2 = path.join(WORKSPACE_DIR, 'images', safeName);

                    const dir1 = path.dirname(target1);
                    if (!fs.existsSync(dir1)) fs.mkdirSync(dir1, { recursive: true });
                    const dir2 = path.dirname(target2);
                    if (!fs.existsSync(dir2)) fs.mkdirSync(dir2, { recursive: true });

                    fs.writeFileSync(target1, imgBuffer);
                    try { fs.writeFileSync(target2, imgBuffer); } catch(e) {}

                    const cleanCaption = (caption || '').trim();
                    const htmlTag = `<div class="q-image-container"><img src="images/${safeName}" alt="${cleanCaption || safeName}" class="q-image">${cleanCaption ? `<div class="q-image-caption">${cleanCaption}</div>` : ''}</div>`;

                    return sendJson(res, 200, {
                        ok: true,
                        filename: safeName,
                        url: `/images/${safeName}`,
                        relPath: `images/${safeName}`,
                        size: imgBuffer.length,
                        caption: cleanCaption,
                        htmlTag,
                        message: `Image ${safeName} enregistrée avec succès dans images/`
                    });
                }

                sendJson(res, 404, { ok: false, error: "Endpoint inconnu." });
            } catch (err) {
                console.error("API Error:", err);
                sendJson(res, 500, { ok: false, error: err.message || "Erreur interne" });
            }
        });
        return;
    }

    sendJson(res, 404, { ok: false, error: "Route non trouvée." });
}

function sendJson(res, status, obj) {
    const json = JSON.stringify(obj);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(json)
    });
    res.end(json);
}

let currentPort = Number(PORT);

function startServer(portToTry) {
    currentPort = portToTry;
    server.listen(portToTry, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 Antigravity QCM Agent Studio lancé sur:`);
        console.log(`   👉 http://localhost:${portToTry}`);
        console.log(`   API Key: ${getApiKey() ? 'Chargée avec succès (env.txt)' : 'Non trouvée'}`);
        console.log(`======================================================\n`);
    });
}

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        const nextPort = currentPort + 1;
        console.log(`Port ${currentPort} déjà utilisé, essai du port ${nextPort}...`);
        setTimeout(() => startServer(nextPort), 100);
    } else {
        console.error('Server error:', e);
    }
});

startServer(currentPort);
