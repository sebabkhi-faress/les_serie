// Compiles structured QCM series data into complete, production-ready HTML matching serie1.html standards
const { generateBarcodeSVG, generateUniqueCode } = require('./barcodeGenerator');

function cleanCssString(str) {
    if (!str) return '';
    return String(str)
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/"/g, '\\"');
}

function buildCompleteHtml(seriesData) {
    const {
        title = "MODULE 01 : ONCO-HÉMATOLOGIE",
        subtitle = "QCM Corrigés & Justifiés",
        headerCategory = "",
        footerTag = "QCM D'ANNALES",
        startPage = 4,
        questions = [],
        protection = null
    } = seriesData;

    let questionsHtml = '';
    let currentChapter = '';

    questions.forEach((q, idx) => {
        // 1. Part Title (e.g. "I- Sémiologie:")
        if (q.type === 'part' || q.partTitle) {
            const partText = escapeHtml(q.partTitle || q.text || q.stem || '');
            questionsHtml += `\n    <div class="part-title"><u><strong>${partText}</strong></u></div>\n`;
            return;
        }

        // 2. Course Title (e.g. "1- Sémiologie générale" or "2- Fièvre")
        if (q.type === 'course' || q.courseTitle) {
            const courseText = escapeHtml(q.courseTitle || q.text || q.stem || '');
            questionsHtml += `\n    <div class="course-title"><u><strong>${courseText}</strong></u></div>\n`;
            if (!q.note && !q.hasTable) return;
        }

        // 3. Informational Table Note (e.g. course without available QCMs)
        if (q.type === 'note' || q.type === 'table' || q.type === 'notice' || q.isNote || q.hasTable) {
            const noteText = escapeHtml(q.text || q.note || q.stem || "Il n'y a pas de QCSs à ce cours dans les examens disponibles");
            questionsHtml += `\n    <div class="notice-table-container">
        <table class="notice-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Question</th>
                    <th style="width: 50%;">réponse</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="2">${noteText}</td>
                </tr>
            </tbody>
        </table>
    </div>\n`;
            return;
        }

        // 4. Section / Chapter header
        if (q.chapter && q.chapter !== currentChapter) {
            currentChapter = q.chapter;
            questionsHtml += `\n    <!-- SECTION: ${escapeHtml(currentChapter)} -->\n`;
            questionsHtml += `    <div class="section-title">${escapeHtml(currentChapter)}</div>\n`;
        }

        const qNum = q.number || (idx + 1);
        const qStem = escapeHtml(q.stem || '');
        const yearBadge = q.year ? `<span class="year-badge">${escapeHtml(q.year)}</span>` : '';

        // Image in question if specified
        let imageHtml = '';
        if (q.image || q.imageUrl) {
            const imgSrc = escapeHtml(q.image || q.imageUrl);
            const imgCap = q.imageCaption ? `<div class="q-image-caption">${escapeHtml(q.imageCaption)}</div>` : '';
            imageHtml = `\n    <div class="q-image-container"><img src="${imgSrc}" class="q-image" alt="Illustration" />${imgCap}</div>\n`;
        }

        // Custom numbered items if present (e.g. 1) Pneumonie... 2) Tuberculeuse...)
        let itemsHtml = '';
        if (Array.isArray(q.customItems) && q.customItems.length > 0) {
            itemsHtml = `\n    <div class="q-custom-items" style="margin: 3px 0 5px 6px; font-size: 9.3pt; color: #1e293b; line-height: 1.35;">\n`;
            q.customItems.forEach(it => {
                itemsHtml += `        <div>${escapeHtml(it)}</div>\n`;
            });
            itemsHtml += `    </div>\n`;
        }

        // Options: detect whether custom numbering (1), 2) etc.) or standard Alpha
        let optionsHtml = '';
        if (Array.isArray(q.options) && q.options.length > 0) {
            const isCustomNum = !q.customItems && q.options.some(opt => /^\s*\d+\s*[\/.)-]/i.test(opt) || /^\s*[ivxIVX]+\s*[\/.)-]/i.test(opt));
            if (isCustomNum) {
                optionsHtml = `\n    <ol class="options custom-num" style="list-style-type: none; margin: 3px 0 4px 6px; padding: 0;">\n`;
                q.options.forEach(opt => {
                    optionsHtml += `        <li style="margin-bottom: 2px;">${escapeHtml(opt)}</li>\n`;
                });
                optionsHtml += `    </ol>\n`;
            } else {
                optionsHtml = `\n    <ol class="options alpha">\n`;
                q.options.forEach(opt => {
                    let cleanOpt = opt.replace(/^[A-Ea-e]\s*[\/.)-]\s*/, '').trim();
                    optionsHtml += `        <li>${escapeHtml(cleanOpt)}</li>\n`;
                });
                optionsHtml += `    </ol>\n`;
            }
        }

        // Clinical Case text if present
        let caseHtml = '';
        if (q.clinicalCase) {
            caseHtml = `\n    <div class="data-box">${escapeHtml(q.clinicalCase)}</div>\n`;
        }

        // Answer and Justifications (optional)
        let answerHtml = '';
        const hasAnswer = typeof q.answer === 'string' && q.answer.trim().length > 0;
        const hasJustifs = (Array.isArray(q.justifications) && q.justifications.length > 0) || (typeof q.justification === 'string' && q.justification.trim().length > 0);

        if (hasAnswer || hasJustifs) {
            let justifsList = '';
            if (Array.isArray(q.justifications) && q.justifications.length > 0) {
                justifsList = `\n        <ul class="justifications">\n`;
                q.justifications.forEach(j => {
                    const itemLabel = escapeHtml(j.item || '');
                    const status = (j.status || '').toLowerCase().includes('vrai') ? 'Vrai' : 'Faux';
                    const statusClass = status === 'Vrai' ? 'text-correct' : 'text-incorrect';
                    const text = escapeHtml(j.text || '');
                    justifsList += `            <li><strong class="${statusClass}">${itemLabel} : ${status}</strong> — <span class="${statusClass}">${text}</span></li>\n`;
                });
                justifsList += `        </ul>\n`;
            } else if (typeof q.justification === 'string' && q.justification.trim()) {
                justifsList = `\n        <div class="justifications" style="margin-top:4px; font-size:9pt; color:#334155;">${escapeHtml(q.justification)}</div>\n`;
            }

            answerHtml = `    <div class="answer-section">
        <hr class="answer-divider">
        ${hasAnswer ? `<div class="answer-line"><span class="answer-label">Réponse :</span> <span class="answer-badge">${escapeHtml(q.answer)}</span></div>` : ''}
        ${justifsList ? `<div class="justification-title">Justification :</div>${justifsList}` : ''}
    </div>\n`;
        }

        questionsHtml += `\n    <!-- QUESTION ${qNum} -->
    <div class="question-box">
        <div class="question-header">
            <span class="q-stem"><span class="q-num">Question ${qNum} :</span> ${qStem}</span>
            ${yearBadge}
        </div>${caseHtml}${imageHtml}${itemsHtml}${optionsHtml}${answerHtml}    </div>\n`;
    });

    // Protection banner & repeating header setup
    const isProtected = protection && protection.enabled;
    let barcodeSvg = '';
    let studentName = '';
    let barcodeNumber = '';
    let emissionDate = '';

    if (isProtected) {
        studentName = escapeHtml(protection.studentName || 'Exemplaire Nominatif');
        barcodeNumber = escapeHtml(protection.barcode || '717271883927');
        emissionDate = escapeHtml(protection.date || new Date().toLocaleString('fr-FR'));
        barcodeSvg = protection.barcodeSvg || generateBarcodeSVG(barcodeNumber, {
            height: 28,
            fontSize: 9,
            unitWidth: 1.3
        });
    }

    const protectionScreenBadge = isProtected ? `
        <div class="protection-screen-banner">
            <div class="prot-banner-left">
                <span class="prot-badge">🛡️ EXEMPLAIRE SÉCURISÉ & TRAÇABLE</span>
                <span class="prot-user">Attribué à : <strong>${studentName}</strong></span>
                <span class="prot-date">Émis le : ${emissionDate}</span>
            </div>
            <div class="prot-banner-right">
                ${barcodeSvg}
            </div>
        </div>
    ` : '';

    const contentInsideWrapper = isProtected ? `
    <table class="doc-table-wrapper">
        <thead class="running-print-header">
            <tr>
                <td>
                    <div class="protection-header-content">
                        <div class="running-left">
                            <span class="prot-badge-mini">DOCUMENT SÉCURISÉ</span>
                            <span class="running-user">Attribué à : <strong>${studentName}</strong></span>
                            <span class="running-doc">• ${escapeHtml(title)}</span>
                        </div>
                        <div class="running-right">
                            ${barcodeSvg}
                        </div>
                    </div>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <main class="container">
                        ${protectionScreenBadge}
                        <header class="doc-header">
                            <h1>${escapeHtml(title)}</h1>
                            <h2>${escapeHtml(subtitle)}</h2>
                        </header>
                        ${questionsHtml}
                    </main>
                </td>
            </tr>
        </tbody>
    </table>
    ` : `
    <main class="container">
        <header class="doc-header">
            <h1>${escapeHtml(title)}</h1>
            <h2>${escapeHtml(subtitle)}</h2>
        </header>
        ${questionsHtml}
    </main>
    `;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} — ${escapeHtml(subtitle)}${isProtected ? ` [Protégé: ${studentName}]` : ''}</title>
    <style>
        /* ================= PAGE & IMPRESSION A4 OPTIMISÉE ================= */
        @page {
            size: A4 portrait;
            margin: ${isProtected ? '8mm 8mm 11mm 8mm' : '7mm 8mm 11mm 8mm'};
            counter-increment: page;
            @bottom-center {
                content: "Page " counter(page);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 8.5pt;
                font-weight: 600;
                color: #475569;
            }
        }

        @page:first {
            counter-increment: page ${startPage};
            @bottom-left {
                content: "${cleanCssString(title)} • ${cleanCssString(footerTag)}${isProtected ? ` [${barcodeNumber}]` : ''}";
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 7.5pt;
                font-weight: 600;
                color: #94a3b8;
                letter-spacing: 0.3px;
            }
            ${headerCategory ? `@bottom-right {
                content: "${cleanCssString(headerCategory)}";
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 7.5pt;
                font-weight: 600;
                color: #94a3b8;
            }` : ''}
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background-color: #f1f5f9;
            margin: 0;
            padding: 0;
            font-size: 9.6pt;
            line-height: 1.27;
            -webkit-font-smoothing: antialiased;
        }

        /* ================= BARRE D'OUTILS INTERACTIVE (ÉCRAN) ================= */
        .screen-toolbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #cbd5e1;
            padding: 8px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }

        .toolbar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .brand-icon {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
        }

        .brand-text {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
        }

        .toolbar-tags {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .pill {
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid transparent;
        }

        .pill-blue {
            background: #e0f2fe;
            color: #0369a1;
            border-color: #bae6fd;
        }

        .pill-green {
            background: #ecfdf5;
            color: #047857;
            border-color: #a7f3d0;
        }

        .pill-protected {
            background: #fef3c7;
            color: #b45309;
            border-color: #fde68a;
            font-weight: 700;
        }

        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn-action {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1px solid transparent;
        }

        .btn-toggle-mode {
            background: #f8fafc;
            color: #334155;
            border-color: #cbd5e1;
        }

        .btn-toggle-mode:hover {
            background: #e2e8f0;
        }

        .btn-print {
            background: linear-gradient(135deg, #0284c7, #0369a1);
            color: #ffffff;
            box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
        }

        .btn-print:hover {
            background: linear-gradient(135deg, #0369a1, #075985);
            box-shadow: 0 3px 8px rgba(2, 132, 199, 0.35);
        }

        /* ================= CONTENEUR DOCUMENT ================= */
        .doc-table-wrapper {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }

        .doc-table-wrapper > tbody > tr > td {
            padding: 0;
        }

        .container {
            width: 100%;
            max-width: 900px;
            margin: 16px auto 32px auto;
            background: #ffffff;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* ================= BANNIÈRE DE PROTECTION (ÉCRAN) ================= */
        .protection-screen-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-left: 4px solid #0284c7;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 12px;
        }

        .prot-banner-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .prot-badge {
            font-size: 8pt;
            font-weight: 800;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .prot-user {
            font-size: 9.5pt;
            color: #0f172a;
        }

        .prot-date {
            font-size: 8pt;
            color: #64748b;
        }

        .prot-banner-right svg {
            display: block;
        }

        /* ================= EN-TÊTE RÉPÉTÉ SUR TOUTES LES PAGES (IMPRESSION) ================= */
        .running-print-header {
            display: none;
        }

        /* ================= EN-TÊTE DU DOCUMENT ================= */
        header.doc-header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2.5px solid #0284c7;
            padding-bottom: 6px;
        }

        header.doc-header h1 {
            color: #0f172a;
            font-size: 13.5pt;
            margin: 0 0 2px 0;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        header.doc-header h2 {
            color: #0284c7;
            font-size: 10.5pt;
            margin: 0;
            font-weight: 700;
            letter-spacing: 0.4px;
            text-transform: uppercase;
        }

        /* ================= TITRES DE SECTION ================= */
        .section-title {
            color: #0f172a;
            background: #f1f5f9;
            font-size: 10.2pt;
            font-weight: 700;
            border-left: 4px solid #0284c7;
            padding: 4px 9px;
            margin: 10px 0 6px 0;
            border-radius: 0 4px 4px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
        }

        .part-title {
            font-size: 11.5pt;
            font-weight: 800;
            color: #000000;
            margin: 14px 0 10px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
        }

        .course-title {
            font-size: 10.5pt;
            font-weight: 700;
            font-style: italic;
            text-align: center;
            color: #000000;
            margin: 12px 0 10px 0;
            break-after: avoid !important;
            page-break-after: avoid !important;
        }

        /* ================= TABLEAU D'INFORMATION & REMARQUES ================= */
        .notice-table-container {
            display: flex;
            justify-content: center;
            margin: 8px 0 18px 0;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        .notice-table {
            width: 100%;
            max-width: 540px;
            border-collapse: collapse;
            border: 1.5px solid #000000;
            font-size: 9.5pt;
            background: #ffffff;
            margin: 0 auto;
        }

        .notice-table th {
            border: 1px solid #000000;
            padding: 5px 12px;
            font-weight: 700;
            text-align: center;
            color: #000000;
            background: #ffffff;
        }

        .notice-table td {
            border: 1px solid #000000;
            padding: 8px 14px;
            text-align: center;
            color: #000000;
            font-size: 9.3pt;
            line-height: 1.35;
        }

        /* ================= GESTION DES IMAGES DANS LE DOCUMENT ================= */
        .q-image-container {
            text-align: center;
            margin: 8px 0;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        .q-image {
            max-width: 100%;
            max-height: 280px;
            object-fit: contain;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            display: inline-block;
        }

        .q-image-caption {
            font-size: 8pt;
            color: #64748b;
            margin-top: 3px;
            font-style: italic;
        }

        /* ================= CARTE DE QUESTION (ANTI-COUPURE ABSOLUE) ================= */
        .question-box {
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #0284c7;
            border-radius: 5px;
            padding: 6px 9px;
            margin-bottom: 5.5px;
            background-color: #ffffff;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
            display: block;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-weight: 700;
            font-size: 9.7pt;
            margin-bottom: 3.5px;
            gap: 8px;
            color: #0f172a;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        .q-stem {
            flex: 1;
            line-height: 1.25;
        }

        .q-num {
            color: #0284c7;
            font-weight: 800;
            margin-right: 2px;
        }

        .year-badge {
            background-color: #f1f5f9;
            color: #0369a1;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 700;
            border: 1px solid #cbd5e1;
            white-space: nowrap;
            letter-spacing: 0.2px;
        }

        /* ================= LISTES D'OPTIONS ================= */
        ol.options {
            margin: 2px 0 4px 16px;
            padding: 0;
        }

        ol.options.alpha {
            list-style-type: upper-alpha;
        }

        ol.options li {
            margin-bottom: 1.5px;
            font-size: 9.2pt;
            color: #334155;
            line-height: 1.23;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        /* ================= ENCADRÉS DONNÉES ================= */
        .data-box {
            background-color: #f8fafc;
            border: 1px dashed #94a3b8;
            border-radius: 4px;
            padding: 4px 8px;
            margin: 3px 0 4px 0;
            font-size: 8.9pt;
            color: #0369a1;
            font-weight: 600;
            letter-spacing: 0.2px;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        /* ================= SECTION RÉPONSE & JUSTIFICATIONS ================= */
        .answer-divider {
            border: none;
            border-top: 1px dashed #cbd5e1;
            margin: 4px 0 3px 0;
        }

        .answer-section {
            transition: all 0.2s ease;
        }

        .answer-line {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9.1pt;
            font-weight: 700;
            margin-bottom: 2.5px;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        .answer-label {
            color: #475569;
            font-size: 8.4pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .answer-badge {
            background-color: #059669;
            color: #ffffff;
            font-size: 9pt;
            font-weight: 800;
            padding: 1px 7px;
            border-radius: 4px;
            display: inline-block;
            letter-spacing: 0.5px;
        }

        .justification-title {
            font-size: 8.4pt;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin: 2px 0 1px 0;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        ul.justifications {
            margin: 0;
            padding-left: 14px;
            font-size: 8.9pt;
            color: #475569;
            line-height: 1.25;
        }

        ul.justifications li {
            margin-bottom: 2px;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        .text-correct {
            color: #059669;
            font-weight: 700;
        }

        .text-incorrect {
            color: #dc2626;
            font-weight: 700;
        }

        /* ================= MODE ÉTUDE (MASQUER RÉPONSES) ================= */
        body.mode-study .answer-section {
            display: none;
        }

        /* ================= RÈGLES IMPRESSION STRICTES & CODE-BARRES SUR CHAQUE PAGE ================= */
        @media print {
            .screen-toolbar {
                display: none !important;
            }
            body {
                background-color: #ffffff !important;
                font-size: 9.2pt !important;
                line-height: 1.22 !important;
            }
            .container {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
            .protection-screen-banner {
                display: none !important;
            }

            /* Repeating Header on every printed page via table thead */
            .running-print-header {
                display: table-header-group !important;
            }
            .protection-header-content {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                border-bottom: 1.5px solid #0284c7 !important;
                padding-bottom: 1.5mm !important;
                margin-bottom: 2mm !important;
                font-size: 8pt !important;
            }
            .prot-badge-mini {
                background: #0284c7 !important;
                color: #ffffff !important;
                padding: 1px 4px !important;
                border-radius: 3px !important;
                font-size: 7pt !important;
                font-weight: 800 !important;
                letter-spacing: 0.3px !important;
                margin-right: 4px !important;
            }
            .running-left {
                color: #0f172a !important;
                font-size: 8pt !important;
            }
            .running-right svg {
                height: 24px !important;
            }

            .question-box {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
                display: block !important;
                margin-bottom: 4.5px !important;
                padding: 4.5px 7px !important;
            }
        }
    </style>
</head>
<body>

    <!-- BARRE D'OUTILS INTERACTIVE (ÉCRAN) -->
    <aside class="screen-toolbar" aria-label="Contrôles du document">
        <div class="toolbar-brand">
            <div class="brand-icon">✓</div>
            <div class="brand-text">${escapeHtml(title)}</div>
        </div>
        <div class="toolbar-tags">
            <span class="pill pill-blue">${escapeHtml(subtitle)}</span>
            <span class="pill pill-green">${questions.filter(q => !q.type || q.type === 'qcm' || q.number).length} Questions</span>
            ${isProtected ? `<span class="pill pill-protected">🛡️ Protégé : ${studentName}</span>` : ''}
        </div>
        <div class="toolbar-actions">
            <button class="btn-action btn-toggle-mode" onclick="document.body.classList.toggle('mode-study')">
                👁️ Mode Étude / Réponses
            </button>
            <button class="btn-action btn-print" onclick="window.print()">
                🖨️ Imprimer / PDF
            </button>
        </div>
    </aside>

    <!-- DOCUMENT PRINCIPAL -->
    ${contentInsideWrapper}

</body>
</html>`;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function applyProtectionToExistingHtml(html, protectionOptions = {}) {
    const {
        studentName = 'Exemplaire Nominatif',
        barcode = null,
        barcodeSvg = null,
        documentTitle = null,
        date = null
    } = protectionOptions;

    const safeBarcode = barcode || generateUniqueCode();
    const safeBarcodeSvg = barcodeSvg || generateBarcodeSVG(safeBarcode, {
        height: 28,
        fontSize: 9,
        unitWidth: 1.3
    });
    const safeStudent = escapeHtml(studentName);
    const safeDate = escapeHtml(date || (new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR')));

    // Extract title if not provided
    let safeTitle = escapeHtml(documentTitle || '');
    if (!safeTitle) {
        const titleMatch = html.match(/<header[^>]*class="[^"]*doc-header[^"]*"[^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i) || html.match(/<title>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
            safeTitle = escapeHtml(titleMatch[1].replace(/<[^>]+>/g, '').replace(/—.*$/, '').replace(/\[.*$/, '').trim());
        }
    }
    if (!safeTitle) safeTitle = "MODULE MÉDICAL";

    const protectionCSS = `
<style id="protectionInjectedStyles">
/* ================= PROTECTION SÉCURISÉE SANS TABLE (ZÉRO LAG) ================= */
.protection-screen-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-left: 4px solid #0284c7;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 12px auto;
    max-width: 900px;
    box-sizing: border-box;
}
.prot-banner-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.prot-badge {
    font-size: 8pt;
    font-weight: 800;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.prot-user {
    font-size: 9.5pt;
    color: #0f172a;
}
.prot-date {
    font-size: 8pt;
    color: #64748b;
}
.prot-banner-right svg {
    display: block;
}
.running-print-header-fixed {
    display: none;
}

@media print {
    @page {
        size: A4 portrait !important;
        margin-top: 24mm !important;
        margin-bottom: 12mm !important;
        margin-left: 10mm !important;
        margin-right: 10mm !important;
    }
    @page:first {
        margin-top: 24mm !important;
    }
    .protection-screen-banner {
        display: none !important;
    }
    .running-print-header-fixed {
        display: block !important;
        position: fixed !important;
        top: -18mm !important;
        left: 0 !important;
        right: 0 !important;
        height: 12mm !important;
        border-bottom: 1.5px solid #0284c7 !important;
        padding-bottom: 2mm !important;
        font-size: 8pt !important;
        background: #ffffff !important;
        z-index: 9999 !important;
    }
    .protection-header-content {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
    }
    .prot-badge-mini {
        background: #0284c7 !important;
        color: #ffffff !important;
        padding: 1px 4px !important;
        border-radius: 3px !important;
        font-size: 7pt !important;
        font-weight: 800 !important;
        letter-spacing: 0.3px !important;
        margin-right: 4px !important;
    }
    .running-left {
        color: #0f172a !important;
        font-size: 8pt !important;
    }
    .running-right svg {
        height: 24px !important;
    }
}
</style>
`;

    const printHeaderHtml = `
<div class="running-print-header-fixed">
    <div class="protection-header-content">
        <div class="running-left">
            <span class="prot-badge-mini">DOCUMENT SÉCURISÉ</span>
            <span class="running-user">Attribué à : <strong>${safeStudent}</strong></span>
            <span class="running-doc">• ${safeTitle}</span>
        </div>
        <div class="running-right">
            ${safeBarcodeSvg}
        </div>
    </div>
</div>`;

    const screenBannerHtml = `
<div class="protection-screen-banner">
    <div class="prot-banner-left">
        <span class="prot-badge">🛡️ EXEMPLAIRE SÉCURISÉ & TRAÇABLE</span>
        <span class="prot-user">Attribué à : <strong>${safeStudent}</strong></span>
        <span class="prot-date">Émis le : ${safeDate}</span>
    </div>
    <div class="prot-banner-right">
        ${safeBarcodeSvg}
    </div>
</div>`;

    let result = html;

    // 1. Clean previous protection artefacts if any
    result = result.replace(/<style id="protectionInjectedStyles">[\s\S]*?<\/style>/i, '');
    result = result.replace(/<table class="doc-table-wrapper">[\s\S]*?<tbody[^>]*>[\s\S]*?<tr>[\s\S]*?<td>/i, '');
    result = result.replace(/<\/td>[\s\S]*?<\/tr>[\s\S]*?<\/tbody>[\s\S]*?<\/table>/i, '');
    result = result.replace(/<div class="running-print-header-fixed">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i, '');
    result = result.replace(/<div class="protection-screen-banner">[\s\S]*?<\/div>\s*<\/div>/i, '');

    // 2. Inject CSS before </head>
    if (result.includes('</head>')) {
        result = result.replace('</head>', `${protectionCSS}\n</head>`);
    } else {
        result = protectionCSS + result;
    }

    // 3. Inject banner and print header at the top of container (ZERO table wrapping!)
    const containerOpenMatch = result.match(/(<(?:div|main)[^>]*class="[^"]*container[^"]*"[^>]*>)/i);
    if (containerOpenMatch) {
        result = result.replace(containerOpenMatch[0], `${containerOpenMatch[0]}\n${screenBannerHtml}\n${printHeaderHtml}\n`);
    } else {
        const bodyOpenMatch = result.match(/(<body[^>]*>)/i);
        if (bodyOpenMatch) {
            result = result.replace(bodyOpenMatch[0], `${bodyOpenMatch[0]}\n${screenBannerHtml}\n${printHeaderHtml}\n`);
        }
    }

    // 4. Update title tag
    if (result.includes('<title>')) {
        result = result.replace(/<title>(.*?)<\/title>/i, (m, old) => {
            const cleanOld = old.replace(/\s*\[Protégé.*?\]/, '');
            return `<title>${cleanOld} [Protégé: ${safeStudent}]</title>`;
        });
    }

    return {
        securedHtml: result,
        barcode: safeBarcode,
        barcodeSvg: safeBarcodeSvg,
        studentName: safeStudent,
        date: safeDate,
        documentTitle: safeTitle
    };
}

module.exports = {
    buildCompleteHtml,
    applyProtectionToExistingHtml,
    escapeHtml
};
