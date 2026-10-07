// ====================================================================
// ANTIGRAVITY QCM AGENT STUDIO — CLIENT APPLICATION LOGIC
// (WITH AUTO-SAVE, LIGHT MODE, AI CREDITS & BARCODE PROTECTION SYSTEM)
// ====================================================================

const state = {
    title: "MODULE 01 : ONCO-HÉMATOLOGIE",
    subtitle: "QCM Corrigés & Justifiés",
    headerCategory: "",
    footerTag: "QCM D'ANNALES",
    startPage: 4,
    filename: "serie1.html",
    questions: [],
    conversationHistory: [],
    currentView: "apercu", // "apercu" | "code"
    theme: "light",
    protectionMode: "standard", // "standard" | "protected"
    activeBarcode: null,
    activeBarcodeSvg: null,
    registryRecords: [],
    openFiles: [],
    activeFileContent: null
};

// DOM References
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');
const pasteRawText = document.getElementById('pasteRawText');
const btnTransform = document.getElementById('btnTransform');
const previewIframe = document.getElementById('previewIframe');
const codeContainer = document.getElementById('codeContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const questionsList = document.getElementById('questionsList');
const tabQCount = document.getElementById('tabQCount');
const previewQCount = document.getElementById('previewQCount');
const previewPageIndicator = document.getElementById('previewPageIndicator');
const checkStudyMode = document.getElementById('checkStudyMode');
const aiStatusText = document.getElementById('aiStatusText');
const autoSaveText = document.getElementById('autoSaveText');
const btnThemeToggle = document.getElementById('btnThemeToggle');
const registryCountBadge = document.getElementById('registryCountBadge');

// Modals
const printModalOverlay = document.getElementById('printModalOverlay');
const registryModalOverlay = document.getElementById('registryModalOverlay');
const choiceStandard = document.getElementById('choiceStandard');
const choiceProtected = document.getElementById('choiceProtected');
const protectedFieldsContainer = document.getElementById('protectedFieldsContainer');
const protStudentName = document.getElementById('protStudentName');
const protBarcodeNumber = document.getElementById('protBarcodeNumber');
const protBarcodePreview = document.getElementById('protBarcodePreview');
const registryTableBody = document.getElementById('registryTableBody');
const registrySearchInput = document.getElementById('registrySearchInput');
const registryTotalCount = document.getElementById('registryTotalCount');

let autoSaveTimer = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    restoreSavedState();
    initTabs();
    initStatusCheck();
    initToolbarButtons();
    initViewModeButtons();
    initCreditsTracking();
    initProtectionSystem();
    initFileTabs();
    initPdfProtectionModal();
    initImageManager();
    loadChatHistory(state.filename || 'serie1.html');
});

// ---------------------------------------------------------
// THEME MANAGEMENT (DEFAULT: LIGHT MODE)
// ---------------------------------------------------------
function initTheme() {
    const savedTheme = localStorage.getItem('qcm_studio_theme') || 'light';
    setTheme(savedTheme);

    btnThemeToggle.addEventListener('click', () => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
    });
}

function setTheme(theme) {
    state.theme = theme;
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btnThemeToggle.textContent = '☀️';
        btnThemeToggle.title = 'Passer en Mode Clair';
    } else {
        document.documentElement.removeAttribute('data-theme');
        btnThemeToggle.textContent = '🌙';
        btnThemeToggle.title = 'Passer en Mode Sombre';
    }
    localStorage.setItem('qcm_studio_theme', theme);
}

// ---------------------------------------------------------
// RESTORE STATE & AUTOSAVE
// ---------------------------------------------------------
function restoreSavedState() {
    try {
        let activeFile = null;
        try {
            activeFile = localStorage.getItem('active_qcm_file');
        } catch (e) {}
        if (activeFile) {
            state.filename = activeFile;
        }

        const cached = localStorage.getItem('qcm_series_data');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
                state.title = parsed.title || state.title;
                state.subtitle = parsed.subtitle || state.subtitle;
                state.startPage = parsed.startPage || state.startPage;
                if (!activeFile && parsed.filename) {
                    state.filename = parsed.filename;
                }
                if (parsed.questions && parsed.questions.length > 0) {
                    state.questions = parsed.questions;
                }

                if (document.getElementById('metaTitle')) document.getElementById('metaTitle').value = state.title;
                if (document.getElementById('metaSubtitle')) document.getElementById('metaSubtitle').value = state.subtitle;
                if (document.getElementById('metaStartPage')) document.getElementById('metaStartPage').value = state.startPage;
                if (document.getElementById('metaFilename')) document.getElementById('metaFilename').value = state.filename;
            }
        }
    } catch (e) {
        console.warn("Could not restore local state", e);
    }
}

function triggerAutoSave() {
    // 1. Save to localStorage immediately
    try {
        if (state.filename) localStorage.setItem('active_qcm_file', state.filename);
        localStorage.setItem('qcm_series_data', JSON.stringify({
            title: state.title,
            subtitle: state.subtitle,
            startPage: state.startPage,
            filename: state.filename,
            questions: state.questions
        }));
    } catch (e) { }

    // 2. Debounced auto-save to disk (.html)
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveText.textContent = "Sauvegarde...";

    autoSaveTimer = setTimeout(async () => {
        try {
            let res;
            if (state.filename && state.activeFileContent) {
                res = await fetch('/api/files/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: state.filename,
                        content: state.activeFileContent
                    })
                });
            } else {
                res = await fetch('/api/save-series', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: state.filename,
                        seriesData: state
                    })
                });
            }
            const data = await res.json();
            if (data.ok) {
                autoSaveText.textContent = `Auto-sauvegardé (${data.savedAt || new Date().toLocaleTimeString('fr-FR')})`;
            } else {
                autoSaveText.textContent = "Erreur auto-save";
            }
        } catch (e) {
            autoSaveText.textContent = "Auto-save local";
        }
    }, 1200);
}

// ---------------------------------------------------------
// STATUS & CREDITS USAGE
// ---------------------------------------------------------
async function initStatusCheck() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (data.ok && data.hasKey) {
            aiStatusText.textContent = `Gemini Prêt (${data.keyPreview})`;
        } else {
            aiStatusText.textContent = "Clé Gemini absente";
            showToast("Clé Gemini non trouvée dans env.txt", "error");
        }
    } catch (e) {
        aiStatusText.textContent = "Mode Local";
    }
}

async function refreshUsageCredits() {
    try {
        const res = await fetch('/api/usage');
        const data = await res.json();
        if (!data.ok) return;

        const { stats, project, pricing } = data;

        document.getElementById('statTokens').textContent = (stats.totalTokens || 0).toLocaleString();
        document.getElementById('statTokensDetail').textContent = `Prompt: ${(stats.totalPromptTokens || 0).toLocaleString()} | Rép: ${(stats.totalCandidateTokens || 0).toLocaleString()}`;
        document.getElementById('statRequests').textContent = `${stats.successfulRequests || 0} / ${stats.totalRequests || 0}`;
        document.getElementById('statRequestsDetail').textContent = stats.failedRequests ? `${stats.failedRequests} échec(s)` : 'Taux de succès : 100%';
        document.getElementById('statCost').textContent = `< $${pricing.estimatedCostUsd || '0.001'}`;

        if (stats.callsHistory && stats.callsHistory.length > 0) {
            const lastCall = stats.callsHistory[0];
            document.getElementById('statModel').textContent = lastCall.model || 'gemini-3.5-flash-lite';
            document.getElementById('statLatency').textContent = `Dernière latence : ${(lastCall.durationMs / 1000).toFixed(2)}s`;
        }

        if (project) {
            document.getElementById('projName').textContent = project.projectName || 'LES SERIE';
            document.getElementById('projNumber').textContent = project.projectNumber || '433375360412';
            document.getElementById('projKey').textContent = project.keyPreview || 'AQ.Ab8...7O4A';
        }

        renderHistoryTable(stats.callsHistory || []);
    } catch (e) {
        console.warn("Usage fetch error", e);
    }
}

function renderHistoryTable(history) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-dim); padding:12px 0;">Aucun appel enregistré pour l'instant.</td></tr>`;
        return;
    }

    tbody.innerHTML = history.slice(0, 10).map(call => `
        <tr>
            <td>${call.timestamp}</td>
            <td style="font-family:'JetBrains Mono';">${call.model}</td>
            <td><strong>${call.totalTokens}</strong></td>
            <td>${(call.durationMs / 1000).toFixed(2)}s</td>
            <td><span style="color:${call.status === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight:700;">${call.status === 'success' ? '✓ OK' : '✗ Erreur'}</span></td>
        </tr>
    `).join('');
}

function initCreditsTracking() {
    refreshUsageCredits();

    document.getElementById('btnTestPing')?.addEventListener('click', async () => {
        showToast("Test de connexion en cours...", "info");
        try {
            const res = await fetch('/api/ping');
            const data = await res.json();
            if (data.ok) {
                showToast(`⚡ Connexion réussie ! Latence : ${data.durationMs}ms (${data.model})`, 'success');
                refreshUsageCredits();
            } else {
                showToast(`Erreur : ${data.error}`, 'error');
            }
        } catch (e) {
            showToast(`Erreur réseau : ${e.message}`, 'error');
        }
    });
}

// ---------------------------------------------------------
// PROTECTION SYSTEM & BARCODE REGISTRY
// ---------------------------------------------------------
function initProtectionSystem() {
    refreshRegistryList();

    // Open Print Modal
    document.getElementById('btnPrintPdf')?.addEventListener('click', openPrintModal);
    document.getElementById('btnClosePrintModal')?.addEventListener('click', closePrintModal);
    document.getElementById('btnCancelPrintModal')?.addEventListener('click', closePrintModal);

    // Direct Protect PDF button in header
    document.getElementById('btnProtectPdfHeader')?.addEventListener('click', () => {
        openPrintModal();
        selectProtectionMode('protected');
    });

    // Toolbar direct PDF download button
    document.getElementById('btnDownloadPdfToolbar')?.addEventListener('click', () => {
        const isProt = activeFileProtTag?.classList.contains('protected') || state.protectionMode === 'protected';
        if (isProt) {
            handleDownloadPdf(true);
        } else {
            handleDownloadPdf(false);
        }
    });

    // Modal direct PDF download button
    document.getElementById('btnDownloadPdfModal')?.addEventListener('click', () => {
        handleDownloadPdf(state.protectionMode === 'protected');
    });

    // Modal create protected HTML file only button
    document.getElementById('btnCreateProtectedHtmlOnly')?.addEventListener('click', handleCreateProtectedHtmlOnly);

    // Open Registry Modal
    document.getElementById('btnOpenRegistry')?.addEventListener('click', openRegistryModal);
    document.getElementById('btnCloseRegistryModal')?.addEventListener('click', closeRegistryModal);
    document.getElementById('btnCloseRegistryBottom')?.addEventListener('click', closeRegistryModal);

    // Regenerate barcode button
    document.getElementById('btnRegenBarcode')?.addEventListener('click', fetchNewBarcodeCode);

    // Confirm print in modal
    document.getElementById('btnConfirmPrint')?.addEventListener('click', handleConfirmPrint);

    // Search input inside registry modal
    registrySearchInput?.addEventListener('input', (e) => {
        filterRegistryTable(e.target.value.trim());
    });
}

async function handleDownloadPdf(isProtected = false) {
    let studentName = '';
    if (isProtected) {
        studentName = protStudentName?.value.trim() || '';
        if (!studentName) {
            // If already protected, try to use existing student name from tag or prompt
            const tagText = activeFileProtTag?.textContent || '';
            const match = tagText.match(/Protégé\s*\((.*?)\)/i);
            if (match) {
                studentName = match[1].trim();
            } else {
                openPrintModal();
                selectProtectionMode('protected');
                showToast("Veuillez renseigner le nom de l'étudiant / destinataire.", "error");
                protStudentName?.focus();
                return;
            }
        }
    }

    closePrintModal();
    setLoading(true);
    showToast(`Génération du PDF ${isProtected ? 'sécurisé' : ''} en cours...`, "info");

    try {
        const base = state.filename.replace(/\.html$/i, '');
        const targetPdfName = isProtected && state.activeBarcode 
            ? `${base}_PROTEGE_${state.activeBarcode.substring(0, 4)}.pdf` 
            : `${base}.pdf`;

        const res = await fetch('/api/render-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: targetPdfName,
                html: state.activeFileContent,
                studentName,
                documentTitle: state.title,
                customBarcode: isProtected ? state.activeBarcode : null
            })
        });

        const data = await res.json();
        setLoading(false);

        if (data.ok && data.downloadUrl) {
            try {
                // Fetch binary blob directly into browser memory for 100% reliable download
                const blobRes = await fetch(data.downloadUrl);
                if (!blobRes.ok) throw new Error(`Code HTTP ${blobRes.status}`);
                const blob = await blobRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                    a.remove();
                }, 10000);
            } catch (dlErr) {
                console.warn('Fallback direct download link:', dlErr);
                const a = document.createElement('a');
                a.href = data.downloadUrl;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => a.remove(), 1000);
            }

            // Keep normal version 100% intact - do NOT mutate state.activeFileContent!
            if (isProtected) {
                await refreshRegistryList();
                await loadFileTabs();
                if (data.protHtmlName) {
                    showToast(`🛡️ Version protégée créée : ${data.protHtmlName} (l'original reste intact)`, "info");
                    await switchToFileTab(data.protHtmlName, false);
                }
            }

            showToast(`✨ ${data.filename} (${formatBytes(data.size)}) téléchargé avec succès !`, "success");
        } else {
            showToast(`Erreur génération PDF : ${data.error || 'Erreur inconnue'}`, "error");
        }
    } catch (err) {
        setLoading(false);
        showToast(`Erreur réseau : ${err.message}`, "error");
    }
}

async function openPrintModal() {
    selectProtectionMode('standard');
    printModalOverlay.classList.add('active');
    // Pre-generate barcode in background
    await fetchNewBarcodeCode();
}

function closePrintModal() {
    printModalOverlay.classList.remove('active');
}

function selectProtectionMode(mode) {
    state.protectionMode = mode;
    const btnCreateHtml = document.getElementById('btnCreateProtectedHtmlOnly');
    if (mode === 'standard') {
        choiceStandard.classList.add('selected');
        choiceProtected.classList.remove('selected');
        protectedFieldsContainer.style.display = 'none';
        document.getElementById('btnConfirmPrint').textContent = "🖨️ Imprimer Version Standard";
        if (btnCreateHtml) btnCreateHtml.style.display = 'none';
    } else {
        choiceProtected.classList.add('selected');
        choiceStandard.classList.remove('selected');
        protectedFieldsContainer.style.display = 'flex';
        document.getElementById('btnConfirmPrint').textContent = "✨ Enregistrer & Imprimer Protégé";
        if (btnCreateHtml) btnCreateHtml.style.display = 'inline-flex';
        protStudentName.focus();
    }
}

async function handleCreateProtectedHtmlOnly() {
    const studentName = protStudentName?.value.trim();
    if (!studentName) {
        showToast("Veuillez renseigner le nom de l'étudiant / destinataire.", "error");
        protStudentName?.focus();
        return;
    }

    closePrintModal();
    setLoading(true);
    showToast(`Création de la version sécurisée pour ${studentName}...`, "info");

    try {
        const applyRes = await fetch('/api/protection/apply-to-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                html: state.activeFileContent,
                studentName,
                documentTitle: state.title,
                customBarcode: state.activeBarcode,
                createSeparateFile: true,
                baseFileName: state.filename
            })
        });

        const applyData = await applyRes.json();
        setLoading(false);

        if (applyData.ok && applyData.newFileName) {
            showToast(`🛡️ Nouvelle copie protégée créée : ${applyData.newFileName} (l'original ${state.filename} reste intact)`, "success");
            await refreshRegistryList();
            await loadFileTabs();
            // Automatically switch to the new protected file tab!
            await switchToFileTab(applyData.newFileName, true);
        } else {
            showToast(`Erreur : ${applyData.error || 'Erreur inconnue'}`, "error");
        }
    } catch (err) {
        setLoading(false);
        showToast(`Erreur réseau : ${err.message}`, "error");
    }
}

async function fetchNewBarcodeCode() {
    try {
        const res = await fetch('/api/protection/generate-code');
        const data = await res.json();
        if (data.ok) {
            state.activeBarcode = data.code;
            state.activeBarcodeSvg = data.svg;
            protBarcodeNumber.value = data.code;
            protBarcodePreview.innerHTML = data.svg;
        }
    } catch (e) {
        console.error("Barcode generation error", e);
    }
}

async function handleConfirmPrint() {
    closePrintModal();

    if (state.protectionMode === 'standard') {
        // Standard Print
        try {
            const frameWin = previewIframe.contentWindow;
            const doc = previewIframe.contentDocument || frameWin?.document;
            if (doc && doc.body) {
                const prevP = Math.max(0, state.startPage - 1);
                doc.body.style.counterReset = `page ${prevP}`;
                const dynStyle = doc.getElementById('dynamic-print-counter') || doc.createElement('style');
                dynStyle.id = 'dynamic-print-counter';
                dynStyle.textContent = `@page:first { counter-set: page ${state.startPage}; counter-reset: page ${prevP}; } body { counter-reset: page ${prevP}; }`;
                doc.head.appendChild(dynStyle);
            }
            frameWin.focus();
            frameWin.print();
        } catch (e) {
            window.print();
        }
        showToast("Impression Standard lancée.", "info");
        return;
    }

    // Protected Print Flow
    const studentName = protStudentName.value.trim();
    if (!studentName) {
        showToast("Veuillez renseigner le nom de l'étudiant / médecin destinataire.", "error");
        setTimeout(openPrintModal, 300);
        return;
    }

    setLoading(true);
    showToast(`Enregistrement du code-barres ${state.activeBarcode}...`, "info");

    try {
        // 1. Register in database
        const regRes = await fetch('/api/protection/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName,
                documentTitle: state.title,
                seriesSubtitle: state.subtitle,
                customBarcode: state.activeBarcode
            })
        });

        const regData = await regRes.json();
        setLoading(false);

        if (!regData.ok) {
            showToast(`Erreur d'enregistrement : ${regData.error}`, "error");
            return;
        }

        const record = regData.record;
        showToast(`🛡️ Exemplaire N° ${record.barcode} enregistré pour ${studentName} !`, "success");
        refreshRegistryList();

        let securedHtml = null;

        // If we have active loaded HTML (such as serie1.html or CARDIO2.html)
        if (state.activeFileContent) {
            const applyRes = await fetch('/api/protection/apply-to-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: state.activeFileContent,
                    studentName: record.studentName,
                    documentTitle: state.title,
                    customBarcode: record.barcode,
                    createSeparateFile: true,
                    baseFileName: state.filename
                })
            });
            const applyData = await applyRes.json();
            if (applyData.ok && applyData.securedHtml) {
                securedHtml = applyData.securedHtml;
                if (applyData.newFileName) {
                    showToast(`🛡️ Nouvelle version protégée créée : ${applyData.newFileName} (l'original reste intact)`, "info");
                    await loadFileTabs();
                    await switchToFileTab(applyData.newFileName, false);
                }
            }
        }

        // Fallback: compile structured state if no raw HTML
        if (!securedHtml) {
            const compiledRes = await fetch('/api/compile-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...state,
                    protection: {
                        enabled: true,
                        studentName: record.studentName,
                        barcode: record.barcode,
                        barcodeSvg: record.barcodeSvg,
                        date: record.date
                    }
                })
            });
            const compiledData = await compiledRes.json();
            if (compiledData.ok && compiledData.html) {
                securedHtml = compiledData.html;
            }
        }

        if (securedHtml) {
            // Print through an isolated iframe to leave the original active file completely intact & lag-free
            let printFrame = document.getElementById('isolatedPrintIframe');
            if (!printFrame) {
                printFrame = document.createElement('iframe');
                printFrame.id = 'isolatedPrintIframe';
                printFrame.style.position = 'fixed';
                printFrame.style.right = '0';
                printFrame.style.bottom = '0';
                printFrame.style.width = '10px';
                printFrame.style.height = '10px';
                printFrame.style.opacity = '0.01';
                printFrame.style.pointerEvents = 'none';
                printFrame.style.border = '0';
                document.body.appendChild(printFrame);
            }

            const pDoc = printFrame.contentWindow.document;
            pDoc.open();
            pDoc.write(securedHtml);
            pDoc.close();

            setTimeout(() => {
                try {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                } catch (e) {
                    window.print();
                }
            }, 600);
        }

    } catch (err) {
        setLoading(false);
        showToast(`Erreur réseau : ${err.message}`, "error");
    }
}

// Registry Modal Logic
async function openRegistryModal() {
    registryModalOverlay.classList.add('active');
    await refreshRegistryList();
}

function closeRegistryModal() {
    registryModalOverlay.classList.remove('active');
}

async function refreshRegistryList() {
    try {
        const res = await fetch('/api/protection/list');
        const data = await res.json();
        if (data.ok) {
            state.registryRecords = data.records || [];
            registryCountBadge.textContent = state.registryRecords.length;
            registryTotalCount.textContent = `${state.registryRecords.length} exemplaires enregistrés`;
            renderRegistryTable(state.registryRecords);
        }
    } catch (e) {
        console.error("Registry fetch error", e);
    }
}

function renderRegistryTable(records) {
    if (!registryTableBody) return;

    if (records.length === 0) {
        registryTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-dim); padding: 30px 0;">
                    Aucun exemplaire protégé enregistré dans la base de données.
                </td>
            </tr>
        `;
        return;
    }

    registryTableBody.innerHTML = records.map(r => `
        <tr>
            <td>
                <div class="registry-barcode-cell">
                    ${r.barcodeSvg}
                </div>
            </td>
            <td>
                <strong style="color:var(--text-main); font-size:13px;">${escapeHtml(r.studentName)}</strong>
                <div style="font-size:10.5px; color:var(--accent-emerald);">● Exemplaire Actif</div>
            </td>
            <td>
                <div style="font-weight:600; color:var(--text-main);">${escapeHtml(r.documentTitle)}</div>
                <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(r.seriesSubtitle)}</div>
            </td>
            <td style="font-size:11px; font-family:'JetBrains Mono'; color:var(--text-dim);">
                ${r.date}
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button class="btn btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="reprintProtectedRecord('${r.id}')" title="Ré-imprimer pour cet étudiant">
                        🖨️ Imprimer
                    </button>
                    <button class="btn btn-ghost" style="padding:3px 6px; font-size:11px;" onclick="copyBarcodeToClipboard('${r.barcode}')" title="Copier le code">
                        📋
                    </button>
                    <button class="btn btn-ghost" style="padding:3px 6px; font-size:11px; color:var(--accent-rose);" onclick="deleteProtectedRecord('${r.id}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterRegistryTable(query) {
    const q = query.toLowerCase();
    if (!q) {
        renderRegistryTable(state.registryRecords);
        return;
    }
    const filtered = state.registryRecords.filter(r =>
        r.barcode.includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.documentTitle.toLowerCase().includes(q)
    );
    renderRegistryTable(filtered);
}

window.copyBarcodeToClipboard = function (code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast(`Code ${code} copié dans le presse-papier !`, "info");
    });
};

window.deleteProtectedRecord = async function (id) {
    if (!confirm("Voulez-vous vraiment supprimer cet exemplaire du registre ?")) return;
    try {
        const res = await fetch('/api/protection/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.ok) {
            showToast("Exemplaire supprimé du registre.", "info");
            refreshRegistryList();
        }
    } catch (e) {
        showToast("Erreur lors de la suppression.", "error");
    }
};

window.reprintProtectedRecord = async function (id) {
    const record = state.registryRecords.find(r => r.id === id);
    if (!record) return;

    closeRegistryModal();
    setLoading(true);
    showToast(`Chargement de l'exemplaire de ${record.studentName}...`, "info");

    try {
        const compiledRes = await fetch('/api/compile-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...state,
                protection: {
                    enabled: true,
                    studentName: record.studentName,
                    barcode: record.barcode,
                    barcodeSvg: record.barcodeSvg,
                    date: record.date
                }
            })
        });

        const compiledData = await compiledRes.json();
        setLoading(false);

        if (compiledData.ok && compiledData.html) {
            previewIframe.srcdoc = compiledData.html;
            setTimeout(() => {
                try {
                    const frameWin = previewIframe.contentWindow;
                    frameWin.focus();
                    frameWin.print();
                } catch (e) {
                    window.print();
                }
            }, 600);
        }
    } catch (e) {
        setLoading(false);
        showToast("Erreur lors de la préparation de l'impression.", "error");
    }
};

// ---------------------------------------------------------
// TAB NAVIGATION
// ---------------------------------------------------------
function initTabs() {
    // Restore remembered sidebar tab across page refresh
    try {
        const savedSidebarTab = localStorage.getItem('active_sidebar_tab');
        if (savedSidebarTab) {
            const targetBtn = document.querySelector(`.tab-btn[data-tab="${savedSidebarTab}"]`);
            const targetPane = document.getElementById(savedSidebarTab);
            if (targetBtn && targetPane) {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                targetBtn.classList.add('active');
                targetPane.classList.add('active');
            }
        }
    } catch (e) {}

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');

            try {
                localStorage.setItem('active_sidebar_tab', targetId);
            } catch (e) {}

            if (targetId === 'tab-credits') {
                refreshUsageCredits();
            }
        });
    });
}

// ---------------------------------------------------------
// VIEW MODES (Aperçu vs Code)
// ---------------------------------------------------------
function initViewModeButtons() {
    const btnApercu = document.getElementById('btnViewApercu');
    const btnCode = document.getElementById('btnViewCode');
    const paper = document.getElementById('paperContainer');

    btnApercu.addEventListener('click', () => {
        state.currentView = "apercu";
        btnApercu.classList.add('active');
        btnCode.classList.remove('active');
        paper.style.display = 'block';
        codeContainer.style.display = 'none';
    });

    btnCode.addEventListener('click', () => {
        state.currentView = "code";
        btnCode.classList.add('active');
        btnApercu.classList.remove('active');
        paper.style.display = 'none';
        codeContainer.style.display = 'block';
        updateCodeView();
    });

    checkStudyMode.addEventListener('change', (e) => {
        try {
            const doc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            if (e.target.checked) {
                doc.body.classList.add('mode-study');
            } else {
                doc.body.classList.remove('mode-study');
            }
        } catch (err) { }
    });
}

// ---------------------------------------------------------
// TOOLBAR ACTIONS
// ---------------------------------------------------------
function initToolbarButtons() {
    btnSendChat.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Clear chat history button
    document.getElementById('btnClearChat')?.addEventListener('click', clearChatHistory);

    btnTransform.addEventListener('click', handleTransformRaw);
    document.getElementById('btnSaveDisk')?.addEventListener('click', handleSaveToDisk);
    document.getElementById('btnDownloadHtml')?.addEventListener('click', handleDownloadHtml);
    document.getElementById('btnLoadSerie1')?.addEventListener('click', handleLoadSerie1);

    document.getElementById('btnUpdateMeta')?.addEventListener('click', () => {
        state.title = document.getElementById('metaTitle').value.trim() || state.title;
        state.subtitle = document.getElementById('metaSubtitle').value.trim() || state.subtitle;
        state.startPage = parseInt(document.getElementById('metaStartPage').value) || 1;
        state.filename = document.getElementById('metaFilename').value.trim() || state.filename || "serie2.html";
        state.headerCategory = document.getElementById('metaCategory').value.trim() || state.headerCategory;

        if (state.activeFileContent) {
            // 1. Fix @page: first syntax typo if present
            state.activeFileContent = state.activeFileContent.replace(/@page:\s+first/gi, '@page:first');

            // 2. Update counter-set: page X
            if (/counter-set:\s*page\s*\d+/i.test(state.activeFileContent)) {
                state.activeFileContent = state.activeFileContent.replace(/counter-set:\s*page\s*\d+/gi, `counter-set: page ${state.startPage}`);
            } else if (/@page:first\s*\{/i.test(state.activeFileContent)) {
                state.activeFileContent = state.activeFileContent.replace(/(@page:first\s*\{)/i, `$1\n            counter-set: page ${state.startPage};`);
            }

            // 3. Update counter-reset: page (X - 1) on body
            const prevPage = Math.max(0, state.startPage - 1);
            if (/counter-reset:\s*page\s*\d+/i.test(state.activeFileContent)) {
                state.activeFileContent = state.activeFileContent.replace(/counter-reset:\s*page\s*\d+/gi, `counter-reset: page ${prevPage}`);
            } else if (/\bbody\s*\{/i.test(state.activeFileContent)) {
                state.activeFileContent = state.activeFileContent.replace(/(\bbody\s*\{)/i, `$1\n            counter-reset: page ${prevPage};`);
            }

            // 4. Update title / subtitle in activeFileContent
            state.activeFileContent = state.activeFileContent.replace(/<h1>[\s\S]*?<\/h1>/i, `<h1>${escapeHtml(state.title)}</h1>`);
            state.activeFileContent = state.activeFileContent.replace(/<h2>[\s\S]*?<\/h2>/i, `<h2>${escapeHtml(state.subtitle)}</h2>`);
        }

        if (previewPageIndicator) previewPageIndicator.textContent = `Démarre Page ${state.startPage}`;
        updatePreview();
        triggerAutoSave();
        showToast(`Paramètres mis à jour : Démarre à la Page ${state.startPage} (auto-sauvegardé) !`, "success");
    });
}

// ---------------------------------------------------------
// CHAT AGENT & PERSISTENT MEMORY LOGIC
// ---------------------------------------------------------
async function loadChatHistory(filename) {
    if (!filename) filename = state.filename || 'serie1.html';
    const label = document.getElementById('chatFileContextName');
    if (label) label.textContent = filename;

    chatHistory.innerHTML = '';

    let loadedHistory = [];
    try {
        const res = await fetch(`/api/chat/history?file=${encodeURIComponent(filename)}`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.history) && data.history.length > 0) {
            loadedHistory = data.history;
        }
    } catch (e) { }

    if (loadedHistory.length === 0) {
        try {
            const localHist = localStorage.getItem(`qcm_chat_${filename}`);
            if (localHist) loadedHistory = JSON.parse(localHist);
        } catch (e) { }
    }

    state.conversationHistory = Array.isArray(loadedHistory) ? loadedHistory : [];

    if (state.conversationHistory.length === 0) {
        const welcome = document.createElement('div');
        welcome.className = 'chat-msg agent';
        welcome.innerHTML = `
            <div class="avatar-icon">🤖</div>
            <div class="msg-body">
                <strong>Bonjour Docteur !</strong> Mémoire active pour <code>${escapeHtml(filename)}</code>.<br><br>
                Posez vos questions ou demandez des modifications. L'IA conserve l'historique de ce document et évite automatiquement les doublons si vous collez des questions déjà existantes !
            </div>
        `;
        chatHistory.appendChild(welcome);
    } else {
        state.conversationHistory.forEach(msg => {
            appendChatBubble(msg.role, msg.role === 'agent' ? formatMarkdown(msg.text) : escapeHtml(msg.text));
        });
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function saveChatHistory() {
    try {
        const key = `qcm_chat_${state.filename || 'serie1.html'}`;
        localStorage.setItem(key, JSON.stringify(state.conversationHistory));
    } catch (e) { }
}

async function clearChatHistory() {
    const filename = state.filename || 'serie1.html';
    if (!confirm(`Effacer l'historique de discussion pour ${filename} ?`)) return;

    state.conversationHistory = [];
    try {
        localStorage.removeItem(`qcm_chat_${filename}`);
        await fetch('/api/chat/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
    } catch (e) {}

    await loadChatHistory(filename);
    showToast(`Historique effacé pour ${filename}.`, 'info');
}

function showChatLoadingBubble(message = "L'IA analyse le document et formule sa réponse...") {
    removeChatLoadingBubble();
    const div = document.createElement('div');
    div.className = 'chat-msg agent chat-loading-bubble';
    div.id = 'chatAiLoadingBubble';
    div.innerHTML = `
        <div class="avatar-icon">🤖</div>
        <div class="msg-body">
            <div class="ai-loading-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
                <span class="ai-loading-text">${escapeHtml(message)}</span>
            </div>
        </div>
    `;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeChatLoadingBubble() {
    const existing = document.getElementById('chatAiLoadingBubble');
    if (existing) existing.remove();
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    appendChatBubble('user', escapeHtml(text));
    state.conversationHistory.push({ role: 'user', text });
    saveChatHistory();

    setLoading(true, "L'IA analyse votre document...");
    showChatLoadingBubble("L'IA consulte le document et prépare sa réponse...");

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                filename: state.filename,
                seriesData: {
                    title: state.title,
                    subtitle: state.subtitle,
                    questionsCount: state.questions.length,
                    questionsSummary: state.questions.map(q => `• Q${q.number}: ${String(q.stem || '').slice(0, 80)}`).join('\n'),
                    activeHtmlPreview: (state.activeFileContent || '').slice(0, 2500)
                },
                history: state.conversationHistory
            })
        });

        const data = await res.json();
        removeChatLoadingBubble();
        setLoading(false);

        if (!data.ok) {
            appendChatBubble('agent', `⚠️ Erreur : ${data.error || "Impossible d'obtenir une réponse de l'IA"}`);
            return;
        }

        const replyText = data.reply || '';
        state.conversationHistory.push({ role: 'agent', text: replyText });
        saveChatHistory();

        let cleanText = replyText;
        const actionMatch = replyText.match(/```json-action\s*([\s\S]*?)\s*```/);
        if (actionMatch) {
            try {
                const actionData = JSON.parse(actionMatch[1]);
                handleAgentAction(actionData);
                cleanText = replyText.replace(/```json-action[\s\S]*?```/, '').trim();
            } catch (err) {
                console.warn("Erreur parsing action JSON de l'agent", err);
            }
        }

        appendChatBubble('agent', formatMarkdown(cleanText));
        refreshUsageCredits();
        playDoneSound();

    } catch (err) {
        removeChatLoadingBubble();
        setLoading(false);
        appendChatBubble('agent', `⚠️ Erreur réseau : ${err.message}`);
    }
}

// ---------------------------------------------------------
// AUDIO CHIME & SPEECH SYNTHESIS ("TERMINÉ !")
// ---------------------------------------------------------
function playDoneSound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            // Tone 1: 587.33 Hz (D5) -> 880 Hz (A5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);
            gain1.gain.setValueAtTime(0.2, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.45);

            // Tone 2: 880 Hz (A5) -> 1174.66 Hz (D6) with bright chime
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(880.00, now + 0.1);
            osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);
            gain2.gain.setValueAtTime(0.18, now + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.6);
        }
    } catch (e) {
        console.warn("Audio chime error:", e);
    }

    // Voice announcement: "Terminé !"
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance("Terminé !");
            utter.lang = 'fr-FR';
            utter.rate = 1.05;
            utter.pitch = 1.1;
            utter.volume = 0.95;
            window.speechSynthesis.speak(utter);
        }
    } catch (e) {
        console.warn("Speech synthesis error:", e);
    }
}


function handleAgentAction(actionData) {
    if (!actionData) return;

    if (actionData.action === 'add_questions' && Array.isArray(actionData.questions)) {
        const { addedCount, updatedCount } = mergeQuestionsWithoutDuplicates(state.questions, actionData.questions);
        if (addedCount > 0) {
            showToast(`✨ ${addedCount} question(s) ajoutée(s) sans doublon !`, 'success');
        } else {
            showToast(`ℹ️ Question(s) déjà présente(s) (${updatedCount} actualisée(s), zéro doublon).`, 'info');
        }
        updatePreview();
        renderQuestionsList();
        triggerAutoSave();
    } else if (actionData.action === 'replace_questions' && Array.isArray(actionData.questions)) {
        state.questions = actionData.questions;
        showToast(`🔄 Série mise à jour (${state.questions.length} questions) !`, 'success');
        updatePreview();
        renderQuestionsList();
        triggerAutoSave();
    } else if (actionData.action === 'update_html') {
        const snippet = (actionData.htmlSnippet || '').trim();
        if (snippet) {
            appendHtmlToActiveDocument(snippet);
            showToast(actionData.message || "Document mis à jour !", 'success');
        } else {
            // Empty snippet: strictly prevent wipe or resets
            console.log("Empty htmlSnippet received from agent. Keeping existing document intact.");
            if (actionData.message) {
                showToast(actionData.message, 'info');
            }
            return;
        }
    }

    if (actionData.metadata) {
        if (actionData.metadata.title) state.title = actionData.metadata.title;
        if (actionData.metadata.subtitle) state.subtitle = actionData.metadata.subtitle;
        if (actionData.metadata.startPage) state.startPage = actionData.metadata.startPage;
    }
}

function handleSuggestion(text) {
    chatInput.value = text;
    sendChatMessage();
}

function appendChatBubble(role, contentHtml) {
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    const icon = role === 'agent' ? '🤖' : '👤';
    div.innerHTML = `
        <div class="avatar-icon">${icon}</div>
        <div class="msg-body">${contentHtml}</div>
    `;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ---------------------------------------------------------
// DEDUPLICATION & MERGE ENGINE (ZÉRO DOUBLON)
// ---------------------------------------------------------
function normalizeStem(stem) {
    return String(stem || '')
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/[^a-z0-9àâäéèêëîïôöùûüç]/gi, '')
        .trim();
}

function mergeQuestionsWithoutDuplicates(existingList, incomingList) {
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (!Array.isArray(incomingList)) return { addedCount: 0, updatedCount: 0, skippedCount: 0 };

    incomingList.forEach(newQ => {
        const newNum = String(newQ.number || '').trim();
        const newStemNorm = normalizeStem(newQ.stem);

        // Match existing question by number or significant stem overlap
        const existingIdx = existingList.findIndex(oldQ => {
            const oldNum = String(oldQ.number || '').trim();
            const oldStemNorm = normalizeStem(oldQ.stem);

            if (newNum && oldNum && newNum === oldNum) return true;
            if (newStemNorm && oldStemNorm) {
                if (newStemNorm === oldStemNorm) return true;
                if (newStemNorm.length >= 15 && oldStemNorm.length >= 15) {
                    if (newStemNorm.includes(oldStemNorm) || oldStemNorm.includes(newStemNorm)) return true;
                }
            }
            return false;
        });

        if (existingIdx !== -1) {
            // Already in document: update fields without creating duplicates!
            const oldQ = existingList[existingIdx];
            existingList[existingIdx] = {
                ...oldQ,
                ...newQ,
                number: oldQ.number || newQ.number
            };
            updatedCount++;
        } else {
            // New question: append
            existingList.push(newQ);
            addedCount++;
        }
    });

    return { addedCount, updatedCount, skippedCount };
}

// ---------------------------------------------------------
// PASTE & TRANSFORM
// ---------------------------------------------------------
async function handleTransformRaw() {
    const raw = pasteRawText.value.trim();
    if (!raw) {
        showToast("Veuillez d'abord coller du texte brut.", "error");
        return;
    }

    const defaultChapter = document.getElementById('pasteChapter').value.trim();
    const startNum = parseInt(document.getElementById('pasteStartNum').value) || (state.questions.length + 1);

    setLoading(true);
    showToast("Transformation des questions en cours...", "info");

    try {
        const res = await fetch('/api/transform', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rawText: raw,
                defaultChapter,
                startNumber: startNum
            })
        });

        const data = await res.json();
        setLoading(false);

        if (!data.ok) {
            showToast(`Erreur : ${data.error || 'Conversion échouée'}`, 'error');
            return;
        }

        const newQuestions = data.questions || [];
        const { addedCount, updatedCount } = mergeQuestionsWithoutDuplicates(state.questions, newQuestions);

        pasteRawText.value = '';
        if (addedCount > 0 && updatedCount > 0) {
            showToast(`🎉 ${addedCount} nouvelle(s) question(s) ajoutée(s), ${updatedCount} actualisée(s) (zéro doublon) !`, 'success');
        } else if (addedCount > 0) {
            showToast(`🎉 ${addedCount} question(s) transformée(s) et auto-sauvegardée(s) !`, 'success');
        } else {
            showToast(`ℹ️ Ces questions sont déjà dans la série (${updatedCount} actualisée(s), aucun doublon créé) !`, 'info');
        }

        updatePreview();
        renderQuestionsList();
        triggerAutoSave();
        refreshUsageCredits();

        document.querySelector('.tab-btn[data-tab="tab-questions"]').click();

    } catch (err) {
        setLoading(false);
        showToast(`Erreur réseau : ${err.message}`, 'error');
    }
}

// ---------------------------------------------------------
// QUESTIONS LIST
// ---------------------------------------------------------
function renderQuestionsList() {
    questionsList.innerHTML = '';
    tabQCount.textContent = state.questions.length;
    previewQCount.textContent = `${state.questions.length} Questions`;
    previewPageIndicator.textContent = `Démarre Page ${state.startPage}`;

    if (state.questions.length === 0) {
        questionsList.innerHTML = `
            <p style="font-size: 12px; color: var(--text-dim); text-align: center; padding: 20px 0;">
                Aucune question dans la série actuellement.<br>Collez du texte ou demandez à l'IA.
            </p>
        `;
        return;
    }

    state.questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'q-item-card';
        card.innerHTML = `
            <div class="q-item-header">
                <span class="q-item-title">Question ${q.number || (idx + 1)} ${q.year ? `(${q.year})` : ''}</span>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="q-item-badge">Rép: ${q.answer || 'A'}</span>
                    <button class="btn btn-ghost" style="padding:2px 6px; font-size:11px; color:var(--accent-rose);" onclick="deleteQuestion(${idx})">🗑️</button>
                </div>
            </div>
            <div class="q-item-stem">${escapeHtml(q.stem || 'Sans énoncé')}</div>
        `;
        questionsList.appendChild(card);
    });
}

async function deleteQuestion(idx) {
    if (!state.questions || !state.questions[idx]) return;
    const q = state.questions[idx];
    const qLabel = q.number ? `Question ${q.number}` : `Question ${idx + 1}`;

    if (!confirm(`Supprimer la question ${q.number || (idx + 1)} ?`)) return;

    setLoading(true);
    showToast(`Suppression de ${qLabel}...`, "info");

    try {
        // If activeFileContent isn't loaded in memory yet, fetch it from server
        if (!state.activeFileContent && state.filename) {
            try {
                const readRes = await fetch(`/api/files/read?file=${encodeURIComponent(state.filename)}`);
                const readData = await readRes.json();
                if (readData.ok && readData.content) {
                    state.activeFileContent = readData.content;
                }
            } catch (e) {}
        }

        // 1. If we have active HTML content (Hemato.html, CARDIO2.html, etc.)
        if (state.activeFileContent) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(state.activeFileContent, 'text/html');
            const boxes = Array.from(doc.querySelectorAll('.question-box'));

            let targetBox = null;

            // 1a. Match by exact question number + stem text (highest accuracy)
            if (q.number && q.stem) {
                const cleanStem = q.stem.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').toLowerCase().slice(0, 30);
                targetBox = boxes.find(b => {
                    const numEl = b.querySelector('.q-num');
                    let numMatch = false;
                    if (numEl) {
                        const m = numEl.textContent.match(/(\d+)/);
                        if (m && parseInt(m[1], 10) === parseInt(q.number, 10)) numMatch = true;
                    }
                    if (!numMatch) {
                        const stemEl = b.querySelector('.q-stem');
                        if (stemEl) {
                            const m = stemEl.textContent.match(/Question\s*(\d+)/i) || stemEl.textContent.match(/(\d+)\s*\)/);
                            if (m && parseInt(m[1], 10) === parseInt(q.number, 10)) numMatch = true;
                        }
                    }
                    if (numMatch && cleanStem.length > 5) {
                        const bText = b.textContent.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').toLowerCase();
                        if (bText.includes(cleanStem)) return true;
                    }
                    return false;
                });
            }

            // 1b. Match by Question Number alone
            if (!targetBox && q.number) {
                targetBox = boxes.find(b => {
                    const numEl = b.querySelector('.q-num');
                    if (numEl) {
                        const m = numEl.textContent.match(/(\d+)/);
                        if (m && parseInt(m[1], 10) === parseInt(q.number, 10)) return true;
                    }
                    const stemEl = b.querySelector('.q-stem');
                    if (stemEl) {
                        const m = stemEl.textContent.match(/Question\s*(\d+)/i) || stemEl.textContent.match(/(\d+)\s*\)/);
                        if (m && parseInt(m[1], 10) === parseInt(q.number, 10)) return true;
                    }
                    return false;
                });
            }

            // 1c. Match by Question Stem text
            if (!targetBox && q.stem) {
                const cleanStem = q.stem.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').toLowerCase().slice(0, 30);
                if (cleanStem.length > 5) {
                    targetBox = boxes.find(b => {
                        const bText = b.textContent.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '').toLowerCase();
                        return bText.includes(cleanStem);
                    });
                }
            }

            // 1d. Fallback: match by index
            if (!targetBox && boxes[idx]) {
                targetBox = boxes[idx];
            }

            if (targetBox) {
                // Remove preceding comments (e.g. <!-- QUESTION X -->) and trailing whitespace
                let prev = targetBox.previousSibling;
                while (prev && (
                    (prev.nodeType === Node.TEXT_NODE && !prev.textContent.trim()) ||
                    prev.nodeType === Node.COMMENT_NODE
                )) {
                    const toRemove = prev;
                    prev = prev.previousSibling;
                    toRemove.remove();
                }

                // Remove trailing whitespace text node
                let next = targetBox.nextSibling;
                if (next && next.nodeType === Node.TEXT_NODE && !next.textContent.trim()) {
                    next.remove();
                }

                // Remove the entire question-box from the DOM tree
                targetBox.remove();

                // Update count badges inside document header if present (e.g. .pill-green)
                const remainingBoxes = doc.querySelectorAll('.question-box');
                doc.querySelectorAll('.pill-green').forEach(pill => {
                    pill.textContent = `${remainingBoxes.length} Questions`;
                });

                // Re-serialize HTML cleanly with doctype
                state.activeFileContent = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            }
        }

        // 2. Remove from state.questions array
        state.questions.splice(idx, 1);

        // 3. Immediately refresh iframe preview and code view
        if (state.activeFileContent) {
            setIframeContent(state.activeFileContent);
            if (codeContainer) codeContainer.textContent = state.activeFileContent;
        } else {
            await updatePreview();
        }

        // 4. Update sidebar list and UI counters
        renderQuestionsList();
        const totalQ = state.questions.length;
        if (previewQCount) previewQCount.textContent = `${totalQ} Questions`;
        if (tabQCount) tabQCount.textContent = totalQ;

        // 5. Update local storage cache
        try {
            if (state.filename) localStorage.setItem('active_qcm_file', state.filename);
            localStorage.setItem('qcm_series_data', JSON.stringify({
                title: state.title,
                subtitle: state.subtitle,
                startPage: state.startPage,
                filename: state.filename,
                questions: state.questions
            }));
        } catch (e) { }

        // 6. Save directly and permanently to disk (.html)
        if (state.filename && state.activeFileContent) {
            const saveRes = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: state.filename,
                    content: state.activeFileContent
                })
            });
            const saveData = await saveRes.json();
            setLoading(false);
            if (saveData.ok) {
                if (autoSaveText) autoSaveText.textContent = `Sauvegardé (${saveData.savedAt || new Date().toLocaleTimeString('fr-FR')})`;
                showToast(`🗑️ ${qLabel} supprimée définitivement !`, "success");
            } else {
                showToast(`Supprimée localement (Erreur sauvegarde : ${saveData.error})`, "error");
            }
        } else {
            const saveRes = await fetch('/api/save-series', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: state.filename,
                    seriesData: state
                })
            });
            const saveData = await saveRes.json();
            setLoading(false);
            if (saveData.ok) {
                showToast(`🗑️ ${qLabel} supprimée et sauvegardée !`, "success");
            }
        }
    } catch (err) {
        setLoading(false);
        showToast(`Erreur lors de la suppression : ${err.message}`, "error");
    }
}
window.deleteQuestion = deleteQuestion;

// ---------------------------------------------------------
// PREVIEW & HTML COMPILE (WITH AUTO-EXPANDING SCROLL)
// ---------------------------------------------------------
function setIframeContent(html) {
    if (!previewIframe) return;
    previewIframe.srcdoc = html;

    const applyIframeTweaks = () => {
        try {
            const doc = previewIframe.contentDocument || previewIframe.contentWindow?.document;
            if (doc && doc.body) {
                // 1. Hide redundant .screen-toolbar inside preview iframe to eliminate duplicate buttons
                const toolbars = doc.querySelectorAll('.screen-toolbar');
                toolbars.forEach(tb => tb.style.setProperty('display', 'none', 'important'));

                // 2. Synchronize Mode Étude checkbox state with iframe body
                const studyCheckbox = document.getElementById('checkStudyMode');
                if (studyCheckbox && studyCheckbox.checked) {
                    doc.body.classList.add('mode-study');
                } else {
                    doc.body.classList.remove('mode-study');
                }

                // 3. Ensure start page counter is applied directly to body style
                if (state.startPage) {
                    const prevP = Math.max(0, state.startPage - 1);
                    doc.body.style.counterReset = `page ${prevP}`;
                }
            }
        } catch (e) { }
        resizePreviewIframe();
    };

    previewIframe.onload = applyIframeTweaks;

    setTimeout(applyIframeTweaks, 40);
    setTimeout(applyIframeTweaks, 150);
    setTimeout(applyIframeTweaks, 500);
}

function resizePreviewIframe() {
    try {
        const doc = previewIframe.contentDocument || previewIframe.contentWindow?.document;
        if (!doc || !doc.body) return;

        // Auto calculate true full document height
        const bodyH = doc.body.scrollHeight || 0;
        const docH = doc.documentElement.scrollHeight || 0;
        const offsetH = doc.body.offsetHeight || 0;
        const totalHeight = Math.max(bodyH, docH, offsetH, 800);

        previewIframe.style.height = (totalHeight + 35) + 'px';

        // Connect wheel listener inside iframe window to scroll parent smoothly
        if (previewIframe.contentWindow && !doc._wheelAttached) {
            doc._wheelAttached = true;
            previewIframe.contentWindow.addEventListener('wheel', (e) => {
                const previewContent = document.querySelector('.preview-content');
                if (previewContent) {
                    previewContent.scrollTop += e.deltaY;
                }
            }, { passive: true });
        }
    } catch (e) { }
}

window.addEventListener('resize', resizePreviewIframe);

async function updatePreview() {
    renderQuestionsList();
    if (state.activeFileContent) {
        setIframeContent(state.activeFileContent);
        if (state.currentView === 'code' && codeContainer) {
            codeContainer.textContent = state.activeFileContent;
        }
        return;
    }
    try {
        const res = await fetch('/api/compile-html', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        const data = await res.json();
        if (data.ok && data.html) {
            state.activeFileContent = data.html;
            setIframeContent(data.html);
            if (state.currentView === 'code') {
                codeContainer.textContent = data.html;
            }
        }
    } catch (e) {
        console.error("Preview render error:", e);
    }
}

function updateCodeView() {
    if (state.activeFileContent) {
        if (codeContainer) codeContainer.textContent = state.activeFileContent;
        return;
    }
    fetch('/api/compile-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
    })
        .then(r => r.json())
        .then(d => {
            if (d.ok) codeContainer.textContent = d.html;
        });
}

// ---------------------------------------------------------
// EXPORT & SAVE HANDLERS
// ---------------------------------------------------------
async function handleSaveToDisk() {
    setLoading(true);
    try {
        let res;
        if (state.filename && state.activeFileContent) {
            res = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: state.filename,
                    content: state.activeFileContent
                })
            });
        } else {
            res = await fetch('/api/save-series', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: state.filename,
                    seriesData: state
                })
            });
        }
        const data = await res.json();
        setLoading(false);
        if (data.ok) {
            autoSaveText.textContent = `Sauvegardé (${data.savedAt || new Date().toLocaleTimeString('fr-FR')})`;
            showToast(`💾 Fichier sauvegardé : ${data.filename}`, 'success');
        } else {
            showToast(`Erreur : ${data.error}`, 'error');
        }
    } catch (err) {
        setLoading(false);
        showToast(`Erreur réseau : ${err.message}`, 'error');
    }
}

async function handleDownloadHtml() {
    const res = await fetch('/api/compile-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
    });
    const data = await res.json();
    if (!data.ok) return;

    const blob = new Blob([data.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.filename.endsWith('.html') ? state.filename : `${state.filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Fichier HTML téléchargé !", "success");
}

async function handleLoadSerie1() {
    if (!confirm("Voulez-vous charger la Série 1 existante (Hématologie) dans la prévisualisation ?")) return;

    setLoading(true);
    try {
        const res = await fetch('/api/load-existing?file=serie1.html');
        const data = await res.json();
        setLoading(false);

        if (data.ok && data.html) {
            previewIframe.srcdoc = data.html;
            codeContainer.textContent = data.html;
            showToast("Série 1 chargée avec succès dans l'aperçu !", "success");
        } else {
            showToast(`Erreur : ${data.error}`, 'error');
        }
    } catch (err) {
        setLoading(false);
        showToast(`Erreur : ${err.message}`, 'error');
    }
}

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------
function setLoading(isLoading, message = "Traitement IA en cours...") {
    const indicator = document.getElementById('loadingIndicator');
    const indicatorText = document.getElementById('loadingIndicatorText');
    const topBar = document.getElementById('topProgressBar');

    if (indicator) {
        indicator.style.display = isLoading ? 'inline-flex' : 'none';
    }
    if (indicatorText && message) {
        indicatorText.textContent = message;
    }
    if (topBar) {
        topBar.style.display = isLoading ? 'block' : 'none';
    }

    if (btnTransform) {
        btnTransform.disabled = isLoading;
        if (isLoading) {
            btnTransform.innerHTML = '<span class="btn-spinner"></span> <span>Conversion en cours...</span>';
        } else {
            btnTransform.innerHTML = '<span>⚡ Transformer en QCMs Structurés</span>';
        }
    }

    if (btnSendChat) {
        btnSendChat.disabled = isLoading;
        if (isLoading) {
            btnSendChat.innerHTML = '<span class="btn-spinner"></span> ⏳ Traitement...';
        } else {
            btnSendChat.innerHTML = '🚀 Envoyer';
        }
    }
}

function showToast(text, type = 'info') {
    const box = document.getElementById('toastBox');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${text}</span>`;
    box.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(2,132,199,0.1);padding:1px 4px;border-radius:3px;">$1</code>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// =========================================================
// FILE TABS & MANAGEMENT SYSTEM (FILES/ FOLDER)
// =========================================================
let importState = {
    selectedFile: null,
    fileContent: null,
    fileName: null,
    barcodeCode: null,
    barcodeSvg: null
};

async function initFileTabs() {
    const fileTabsList = document.getElementById('fileTabsList');
    const btnNewFileTab = document.getElementById('btnNewFileTab');
    const btnImportHtmlTab = document.getElementById('btnImportHtmlTab');
    const btnQuickProtect = document.getElementById('btnQuickProtect');

    // New File Modal bindings
    btnNewFileTab?.addEventListener('click', openNewFileModal);
    document.getElementById('btnCloseNewFileModal')?.addEventListener('click', closeNewFileModal);
    document.getElementById('btnCancelNewFileModal')?.addEventListener('click', closeNewFileModal);
    document.getElementById('btnConfirmCreateFile')?.addEventListener('click', handleCreateNewFile);

    // Import Modal bindings
    btnImportHtmlTab?.addEventListener('click', openImportModal);
    document.getElementById('btnCloseImportModal')?.addEventListener('click', closeImportModal);
    document.getElementById('btnCancelImportModal')?.addEventListener('click', closeImportModal);
    document.getElementById('btnConfirmImport')?.addEventListener('click', handleConfirmImport);

    // Dropzone & File Input inside Import Modal
    const importDropZone = document.getElementById('importDropZone');
    const importFileInput = document.getElementById('importFileInput');
    importDropZone?.addEventListener('click', () => importFileInput?.click());
    importFileInput?.addEventListener('change', handleImportFileSelect);

    // Drag and drop on dropzone
    if (importDropZone) {
        importDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            importDropZone.classList.add('dragover');
        });
        importDropZone.addEventListener('dragleave', () => {
            importDropZone.classList.remove('dragover');
        });
        importDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            importDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processImportFile(e.dataTransfer.files[0]);
            }
        });
    }

    document.getElementById('btnResetSelectedFile')?.addEventListener('click', resetImportSelectedFile);
    document.getElementById('btnPickRootSerie1')?.addEventListener('click', pickRootSerie1ForImport);
    document.getElementById('checkImportProtect')?.addEventListener('change', toggleImportProtectionFields);

    // Quick protect current file button
    btnQuickProtect?.addEventListener('click', () => {
        openPrintModal();
        selectProtectionMode('protected');
    });

    // Horizontal mousewheel scrolling for tabs list
    if (fileTabsList) {
        fileTabsList.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                fileTabsList.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    // Initial load of files list
    await loadFileTabs();
}

// --- NEW FILE MODAL ---
function openNewFileModal() {
    const overlay = document.getElementById('newFileModalOverlay');
    const inputName = document.getElementById('newFileFilename');
    const count = (state.openFiles ? state.openFiles.length : 2) + 1;
    if (inputName) inputName.value = `serie${count}.html`;
    overlay?.classList.add('active');
    setTimeout(() => inputName?.focus(), 100);
}

function closeNewFileModal() {
    document.getElementById('newFileModalOverlay')?.classList.remove('active');
}

async function handleCreateNewFile() {
    const inputName = document.getElementById('newFileFilename');
    const inputTitle = document.getElementById('newFileTitle');
    const inputSub = document.getElementById('newFileSubtitle');

    let name = inputName?.value.trim() || '';
    if (!name) name = `serie_${Date.now()}.html`;
    if (!name.endsWith('.html')) name += '.html';

    const title = inputTitle?.value.trim() || 'NOUVELLE SÉRIE MÉDICALE';
    const subtitle = inputSub?.value.trim() || 'QCM Corrigés & Justifiés';

    closeNewFileModal();
    setLoading(true);

    try {
        const res = await fetch('/api/files/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: name, title, subtitle })
        });
        const data = await res.json();
        setLoading(false);

        if (data.ok) {
            showToast(`✨ ${name} créé dans files/ !`, 'success');
            await loadFileTabs();
            await switchToFileTab(data.filename, false);
        } else {
            showToast(`Erreur : ${data.error}`, 'error');
        }
    } catch (e) {
        setLoading(false);
        showToast(`Erreur réseau : ${e.message}`, 'error');
    }
}

// --- IMPORT MODAL ---
async function openImportModal() {
    const overlay = document.getElementById('importModalOverlay');
    overlay?.classList.add('active');

    // Pre-fetch a barcode code in case user selects protection
    await fetchImportBarcode();
    resetImportSelectedFile();
}

function closeImportModal() {
    document.getElementById('importModalOverlay')?.classList.remove('active');
}

async function fetchImportBarcode() {
    try {
        const res = await fetch('/api/protection/generate-code');
        const data = await res.json();
        if (data.ok) {
            importState.barcodeCode = data.code;
            importState.barcodeSvg = data.svg;
            const container = document.getElementById('importBarcodePreview');
            if (container) container.innerHTML = data.svg;
        }
    } catch (e) { }
}

function toggleImportProtectionFields(e) {
    const fields = document.getElementById('importProtectFields');
    if (!fields) return;
    fields.style.display = e.target.checked ? 'flex' : 'none';
}

function handleImportFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
        processImportFile(file);
    }
}

function processImportFile(file) {
    importState.selectedFile = file;
    importState.fileName = file.name;

    const reader = new FileReader();
    reader.onload = (event) => {
        importState.fileContent = event.target.result;
        showSelectedFileInfo(file.name, file.size);
    };
    reader.readAsText(file);
}

function showSelectedFileInfo(name, size) {
    const dropzone = document.getElementById('importDropZone');
    const info = document.getElementById('importFileInfo');
    const nameEl = document.getElementById('importSelectedFilename');
    const sizeEl = document.getElementById('importSelectedFileSize');

    if (dropzone) dropzone.style.display = 'none';
    if (info) info.style.display = 'flex';
    if (nameEl) nameEl.textContent = name;
    if (sizeEl) sizeEl.textContent = formatBytes(size);

    // Auto extract title if present in HTML
    if (importState.fileContent) {
        const match = importState.fileContent.match(/<header[^>]*class="[^"]*doc-header[^"]*"[^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i) || importState.fileContent.match(/<title>([\s\S]*?)<\/title>/i);
        if (match) {
            const cleanT = match[1].replace(/<[^>]+>/g, '').replace(/—.*$/, '').replace(/\[.*$/, '').trim();
            const titleInput = document.getElementById('importDocTitle');
            if (titleInput) titleInput.value = cleanT;
        }
    }
}

function resetImportSelectedFile() {
    importState.selectedFile = null;
    importState.fileContent = null;
    importState.fileName = null;

    const fileInput = document.getElementById('importFileInput');
    if (fileInput) fileInput.value = '';

    const dropzone = document.getElementById('importDropZone');
    const info = document.getElementById('importFileInfo');
    if (dropzone) dropzone.style.display = 'block';
    if (info) info.style.display = 'none';
}

async function pickRootSerie1ForImport() {
    setLoading(true);
    try {
        const res = await fetch('/api/files/read?file=serie1.html');
        const data = await res.json();
        setLoading(false);

        if (data.ok) {
            importState.fileName = 'serie1.html';
            importState.fileContent = data.content;
            showSelectedFileInfo('serie1.html', data.size);
            showToast("serie1.html chargé avec succès dans l'importeur !", "info");
        } else {
            showToast(`Impossible de charger serie1.html : ${data.error}`, "error");
        }
    } catch (e) {
        setLoading(false);
        showToast(`Erreur réseau : ${e.message}`, "error");
    }
}

async function handleConfirmImport() {
    if (!importState.fileContent || !importState.fileName) {
        showToast("Veuillez d'abord sélectionner un fichier HTML à importer.", "info");
        return;
    }

    let filename = importState.fileName.trim();
    if (!filename.endsWith('.html')) filename += '.html';

    const isProtectChecked = document.getElementById('checkImportProtect')?.checked;
    const studentName = document.getElementById('importStudentName')?.value.trim();
    const docTitle = document.getElementById('importDocTitle')?.value.trim() || 'MODULE MÉDICAL';

    if (isProtectChecked && !studentName) {
        showToast("Veuillez renseigner le nom de l'étudiant / destinataire.", "error");
        document.getElementById('importStudentName')?.focus();
        return;
    }

    closeImportModal();
    setLoading(true);

    try {
        if (isProtectChecked) {
            // Apply barcode protection and save directly
            const res = await fetch('/api/protection/apply-to-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: importState.fileContent,
                    studentName,
                    documentTitle: docTitle,
                    customBarcode: importState.barcodeCode,
                    saveAsFile: filename
                })
            });
            const data = await res.json();
            setLoading(false);

            if (data.ok) {
                showToast(`🛡️ ${filename} importé et protégé pour ${studentName} !`, 'success');
                await loadFileTabs();
                await switchToFileTab(filename, false);
            } else {
                showToast(`Erreur : ${data.error}`, 'error');
            }
        } else {
            // Standard import
            const res = await fetch('/api/files/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename,
                    content: importState.fileContent
                })
            });
            const data = await res.json();
            setLoading(false);

            if (data.ok) {
                showToast(`📥 ${filename} importé avec succès dans files/ !`, 'success');
                await loadFileTabs();
                await switchToFileTab(data.filename, false);
            } else {
                showToast(`Erreur : ${data.error}`, 'error');
            }
        }
    } catch (e) {
        setLoading(false);
        showToast(`Erreur réseau : ${e.message}`, 'error');
    }
}

// --- FILE TABS DISPLAY & SWITCHING ---
async function loadFileTabs() {
    try {
        const res = await fetch('/api/files/list');
        const data = await res.json();
        if (data.ok && Array.isArray(data.files)) {
            state.openFiles = data.files;

            // Restore remembered active tab from localStorage across page refresh
            let remembered = null;
            try {
                remembered = localStorage.getItem('active_qcm_file');
            } catch (e) {}

            if (remembered && state.openFiles.some(f => f.name === remembered)) {
                state.filename = remembered;
            } else if (!state.openFiles.some(f => f.name === state.filename)) {
                const preferred = state.openFiles.find(f => f.name === 'serie1.html') || state.openFiles[0];
                if (preferred) {
                    state.filename = preferred.name;
                }
            }
            renderFileTabs();

            if (state.filename) {
                await switchToFileTab(state.filename, false);
            }
        }
    } catch (e) {
        console.error("Error loading files list", e);
    }
}

function renderFileTabs() {
    const fileTabsList = document.getElementById('fileTabsList');
    if (!fileTabsList || !state.openFiles) return;

    fileTabsList.innerHTML = state.openFiles.map(f => {
        const isActive = f.name === state.filename;
        return `
            <div class="file-tab ${isActive ? 'active' : ''}" onclick="switchToFileTab('${f.name}')" title="${f.name} (${formatBytes(f.size)})">
                <span class="file-tab-icon">📄</span>
                <span class="file-tab-name">${f.name}</span>
                ${f.isProtected ? `<span class="file-tab-badge-prot" title="Document Sécurisé">🛡️</span>` : ''}
                <button class="file-tab-close" onclick="closeFileTab(event, '${f.name}')" title="Fermer cet onglet">&times;</button>
            </div>
        `;
    }).join('');
}

window.switchToFileTab = async function (filename, shouldNotify = true) {
    state.filename = filename;
    try {
        localStorage.setItem('active_qcm_file', filename);
    } catch (e) {}
    renderFileTabs();

    const activeFileNameText = document.getElementById('activeFileNameText');
    if (activeFileNameText) {
        activeFileNameText.textContent = filename;
    }

    // Load file-specific chat memory
    await loadChatHistory(filename);

    try {
        setLoading(true);
        const res = await fetch(`/api/files/read?file=${encodeURIComponent(filename)}`);
        const data = await res.json();
        setLoading(false);

        if (data.ok) {
            state.activeFileContent = data.content;
            setIframeContent(data.content);
            if (codeContainer) codeContainer.textContent = data.content;

            // Extract title if present
            const titleMatch = data.content.match(/<header[^>]*class="[^"]*doc-header[^"]*"[^>]*>[\s\S]*?<h1>([\s\S]*?)<\/h1>/i) || data.content.match(/<title>([\s\S]*?)<\/title>/i);
            if (titleMatch) {
                const cleanT = titleMatch[1].replace(/<[^>]+>/g, '').replace(/—.*$/, '').replace(/\[.*$/, '').trim();
                state.title = cleanT;
                const metaTitleInput = document.getElementById('metaTitle');
                if (metaTitleInput) metaTitleInput.value = cleanT;
            }

            // Extract subtitle if present
            const subMatch = data.content.match(/<header[^>]*class="[^"]*doc-header[^"]*"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>/i);
            if (subMatch) {
                const cleanSub = subMatch[1].replace(/<[^>]+>/g, '').trim();
                state.subtitle = cleanSub;
                const metaSubInput = document.getElementById('metaSubtitle');
                if (metaSubInput) metaSubInput.value = cleanSub;
            }

            // Extract startPage from counter-set / counter-reset in HTML
            const pageMatch = data.content.match(/counter-set:\s*page\s*(\d+)/i) ||
                              data.content.match(/counter-reset:\s*page\s*(\d+)/i);
            if (pageMatch) {
                let p = parseInt(pageMatch[1]);
                if (data.content.match(/counter-reset:\s*page\s*(\d+)/i) && !data.content.match(/counter-set:\s*page\s*(\d+)/i)) {
                    p += 1;
                }
                state.startPage = p;
                const metaStartPageInput = document.getElementById('metaStartPage');
                if (metaStartPageInput) metaStartPageInput.value = state.startPage;
            }
            if (previewPageIndicator) previewPageIndicator.textContent = `Démarre Page ${state.startPage}`;

            updateActiveFileProtBadge(data.isProtected, data.studentName || '');

            // Extract questions from HTML and update sidebar Tab 3 questions list
            const parsedQuestions = parseQuestionsFromHtml(data.content);
            state.questions = parsedQuestions;
            renderQuestionsList();

            // Update questions count in toolbar and sidebar tab
            const totalQ = parsedQuestions.length > 0 
                ? parsedQuestions.length 
                : (data.content.match(/class=["'][^"']*question-box[^"']*["']/gi) || []).length;
            if (previewQCount) previewQCount.textContent = `${totalQ} Questions`;
            if (tabQCount) tabQCount.textContent = totalQ;

            if (shouldNotify) {
                showToast(`Fichier ouvert : ${filename} (${formatBytes(data.size)})`, 'info');
            }
        } else {
            showToast(`Erreur d'ouverture : ${data.error}`, 'error');
        }
    } catch (e) {
        setLoading(false);
        showToast(`Erreur réseau : ${e.message}`, 'error');
    }
};

function parseQuestionsFromHtml(html) {
    if (!html) return [];
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const boxes = doc.querySelectorAll('.question-box');
        if (boxes && boxes.length > 0) {
            const questions = [];
            boxes.forEach((box, index) => {
                const numEl = box.querySelector('.q-num');
                const numMatch = numEl ? numEl.textContent.match(/(\d+)/) : null;
                const number = numMatch ? parseInt(numMatch[1]) : (index + 1);

                const yearEl = box.querySelector('.year-badge');
                const year = yearEl ? yearEl.textContent.trim() : '';

                const stemEl = box.querySelector('.q-stem');
                let stem = '';
                if (stemEl) {
                    const clone = stemEl.cloneNode(true);
                    const innerNum = clone.querySelector('.q-num');
                    if (innerNum) innerNum.remove();
                    stem = clone.textContent.replace(/\s+/g, ' ').trim();
                } else {
                    stem = `Question ${number}`;
                }

                const ansEl = box.querySelector('.answer-badge');
                const answer = ansEl ? ansEl.textContent.trim() : 'A';

                questions.push({
                    number,
                    year,
                    stem,
                    answer
                });
            });
            return questions;
        }
    } catch (e) {
        console.warn('DOMParser fallback in parseQuestionsFromHtml:', e);
    }

    // Robust fallback: split on question-box
    const parts = html.split(/<div[^>]*class="[^"]*question-box[^"]*"[^>]*>/i);
    parts.shift();
    const questions = [];
    parts.forEach((part, index) => {
        const numMatch = part.match(/class="q-num"[^>]*>(?:Question\s*)?(\d+)/i) || part.match(/Question\s*(\d+)/i);
        const number = numMatch ? parseInt(numMatch[1]) : (index + 1);

        const yearMatch = part.match(/class="year-badge"[^>]*>([^<]+)<\/span>/i);
        const year = yearMatch ? yearMatch[1].trim() : '';

        const stemMatch = part.match(/class="q-stem"[^>]*>([\s\S]*?)<\/div>/i) || part.match(/class="q-stem"[^>]*>([\s\S]*?)<\/span>/i);
        let stem = '';
        if (stemMatch) {
            stem = stemMatch[1].replace(/<span[^>]*class="q-num"[^>]*>[\s\S]*?<\/span>/i, '').replace(/<[^>]+>/g, '').trim();
        } else {
            stem = `Question ${number}`;
        }

        const ansMatch = part.match(/class="answer-badge"[^>]*>([^<]+)<\/span>/i);
        const answer = ansMatch ? ansMatch[1].trim() : 'A';

        questions.push({
            number,
            year,
            stem,
            answer
        });
    });
    return questions;
}

function updateActiveFileProtBadge(isProtected, studentName = '') {
    const activeFileProtTag = document.getElementById('activeFileProtTag');
    const btnQuickProtect = document.getElementById('btnQuickProtect');
    const btnDownloadPdfToolbar = document.getElementById('btnDownloadPdfToolbar');

    if (activeFileProtTag) {
        if (isProtected) {
            activeFileProtTag.textContent = studentName ? `🛡️ Protégé (${studentName})` : `🛡️ Protégé`;
            activeFileProtTag.classList.add('protected');
        } else {
            activeFileProtTag.textContent = `Non Protégé`;
            activeFileProtTag.classList.remove('protected');
        }
    }

    if (btnQuickProtect) {
        if (isProtected) {
            btnQuickProtect.textContent = "🛡️ Ré-assigner Protection";
            btnQuickProtect.title = "Modifier l'attribution ou ré-imprimer pour un autre étudiant";
        } else {
            btnQuickProtect.textContent = "🛡️ Protéger ce fichier";
            btnQuickProtect.title = "Appliquer la protection par code-barres à ce document";
        }
    }

    if (btnDownloadPdfToolbar) {
        if (isProtected) {
            btnDownloadPdfToolbar.textContent = "📥 Télécharger PDF Protégé";
        } else {
            btnDownloadPdfToolbar.textContent = "📄 Télécharger PDF";
        }
    }
}

window.closeFileTab = function (event, filename) {
    event.stopPropagation();
    if (state.openFiles.length <= 1) {
        showToast("Impossible de fermer le seul onglet ouvert.", "info");
        return;
    }
    state.openFiles = state.openFiles.filter(f => f.name !== filename);
    if (state.filename === filename) {
        state.filename = state.openFiles[0].name;
        switchToFileTab(state.filename, false);
    } else {
        renderFileTabs();
    }
};

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Global window exposure for inline event handlers or browser debugging
window.openNewFileModal = openNewFileModal;
window.closeNewFileModal = closeNewFileModal;
window.handleCreateNewFile = handleCreateNewFile;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.handleConfirmImport = handleConfirmImport;
window.pickRootSerie1ForImport = pickRootSerie1ForImport;
window.openImportPdfModal = openImportPdfModal;
window.closeImportPdfModal = closeImportPdfModal;
window.handleSubmitProtectPdf = handleSubmitProtectPdf;
window.resetPdfSelectedFile = resetPdfSelectedFile;

// ====================================================================
// PDF IMPORT & INSTANT VECTOR PROTECTION SYSTEM
// ====================================================================
let pdfImportState = {
    selectedFile: null,
    base64Data: null,
    fileName: null,
    fileSize: 0,
    barcodeCode: null,
    barcodeSvg: null
};

function initPdfProtectionModal() {
    const btnOpenImportPdfModal = document.getElementById('btnOpenImportPdfModal');
    const btnHeaderImportPdf = document.getElementById('btnHeaderImportPdf');
    const btnCloseImportPdfModal = document.getElementById('btnCloseImportPdfModal');
    const btnCancelImportPdfModal = document.getElementById('btnCancelImportPdfModal');
    const pdfDropZone = document.getElementById('pdfDropZone');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const btnResetSelectedPdf = document.getElementById('btnResetSelectedPdf');
    const btnRegenPdfBarcode = document.getElementById('btnRegenPdfBarcode');
    const btnSubmitProtectPdf = document.getElementById('btnSubmitProtectPdf');

    btnOpenImportPdfModal?.addEventListener('click', openImportPdfModal);
    btnHeaderImportPdf?.addEventListener('click', openImportPdfModal);
    btnCloseImportPdfModal?.addEventListener('click', closeImportPdfModal);
    btnCancelImportPdfModal?.addEventListener('click', closeImportPdfModal);

    // Dropzone click -> file dialog
    pdfDropZone?.addEventListener('click', () => pdfFileInput?.click());
    pdfFileInput?.addEventListener('change', handlePdfFileSelect);

    // Drag and drop events
    if (pdfDropZone) {
        pdfDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            pdfDropZone.classList.add('dragover');
        });
        pdfDropZone.addEventListener('dragleave', () => {
            pdfDropZone.classList.remove('dragover');
        });
        pdfDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            pdfDropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processPdfFile(e.dataTransfer.files[0]);
            }
        });
    }

    btnResetSelectedPdf?.addEventListener('click', resetPdfSelectedFile);
    btnRegenPdfBarcode?.addEventListener('click', fetchNewPdfBarcode);
    btnSubmitProtectPdf?.addEventListener('click', handleSubmitProtectPdf);
}

async function openImportPdfModal() {
    const overlay = document.getElementById('importPdfModalOverlay');
    if (!overlay) return;
    overlay.classList.add('active');

    // Reset progress and banner
    const progress = document.getElementById('pdfProtectProgress');
    const banner = document.getElementById('pdfSuccessBanner');
    if (progress) progress.style.display = 'none';
    if (banner) banner.style.display = 'none';

    // Fetch barcode code
    await fetchNewPdfBarcode();

    // Focus student name if file already chosen
    if (pdfImportState.base64Data) {
        document.getElementById('pdfProtectStudentName')?.focus();
    }
}

function closeImportPdfModal() {
    document.getElementById('importPdfModalOverlay')?.classList.remove('active');
}

async function fetchNewPdfBarcode() {
    try {
        const res = await fetch('/api/protection/generate-code');
        const data = await res.json();
        if (data.ok) {
            pdfImportState.barcodeCode = data.code;
            pdfImportState.barcodeSvg = data.svg;
            const container = document.getElementById('pdfBarcodePreview');
            if (container) container.innerHTML = data.svg;
        }
    } catch (e) {
        console.error("Error fetching barcode", e);
    }
}

function handlePdfFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
        processPdfFile(file);
    }
}

function processPdfFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        showToast("Veuillez sélectionner un fichier au format PDF (.pdf).", "error");
        return;
    }

    pdfImportState.selectedFile = file;
    pdfImportState.fileName = file.name;
    pdfImportState.fileSize = file.size;

    const dropzone = document.getElementById('pdfDropZone');
    const info = document.getElementById('pdfSelectedFileInfo');
    const nameEl = document.getElementById('pdfSelectedFilename');
    const sizeEl = document.getElementById('pdfSelectedFileSize');
    const titleInput = document.getElementById('pdfProtectDocTitle');

    if (dropzone) dropzone.style.display = 'none';
    if (info) info.style.display = 'flex';
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = `${formatBytes(file.size)}`;

    // Auto-fill title from filename if empty
    if (titleInput && (!titleInput.value || titleInput.value.trim() === '')) {
        const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_\-]+/g, ' ').toUpperCase();
        titleInput.value = cleanName;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
        pdfImportState.base64Data = event.target.result;
        showToast(`Document PDF "${file.name}" prêt à être protégé !`, "info");
    };
    reader.onerror = () => {
        showToast("Erreur lors de la lecture du fichier PDF.", "error");
    };
    reader.readAsDataURL(file);
}

function resetPdfSelectedFile() {
    pdfImportState.selectedFile = null;
    pdfImportState.base64Data = null;
    pdfImportState.fileName = null;
    pdfImportState.fileSize = 0;

    const fileInput = document.getElementById('pdfFileInput');
    if (fileInput) fileInput.value = '';

    const dropzone = document.getElementById('pdfDropZone');
    const info = document.getElementById('pdfSelectedFileInfo');
    const progress = document.getElementById('pdfProtectProgress');
    const banner = document.getElementById('pdfSuccessBanner');

    if (dropzone) dropzone.style.display = 'block';
    if (info) info.style.display = 'none';
    if (progress) progress.style.display = 'none';
    if (banner) banner.style.display = 'none';
}

async function handleSubmitProtectPdf() {
    if (!pdfImportState.base64Data || !pdfImportState.fileName) {
        showToast("Veuillez sélectionner un fichier PDF à protéger.", "error");
        document.getElementById('pdfFileInput')?.click();
        return;
    }

    const studentInput = document.getElementById('pdfProtectStudentName');
    const titleInput = document.getElementById('pdfProtectDocTitle');
    const studentName = studentInput?.value.trim();
    const docTitle = titleInput?.value.trim() || pdfImportState.fileName.replace(/\.pdf$/i, '').toUpperCase();

    if (!studentName) {
        showToast("Veuillez renseigner le nom de l'étudiant / médecin destinataire.", "error");
        studentInput?.focus();
        return;
    }

    const progress = document.getElementById('pdfProtectProgress');
    const progressText = document.getElementById('pdfProgressText');
    const banner = document.getElementById('pdfSuccessBanner');
    const btnSubmit = document.getElementById('btnSubmitProtectPdf');

    if (progress) progress.style.display = 'block';
    if (progressText) progressText.textContent = "Application du tatouage vectoriel sur toutes les pages...";
    if (banner) banner.style.display = 'none';
    if (btnSubmit) btnSubmit.disabled = true;

    setLoading(true);

    try {
        const res = await fetch('/api/pdf/protect-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdfBase64: pdfImportState.base64Data,
                filename: pdfImportState.fileName,
                studentName,
                documentTitle: docTitle,
                customBarcode: pdfImportState.barcodeCode
            })
        });

        const data = await res.json();
        setLoading(false);
        if (progress) progress.style.display = 'none';
        if (btnSubmit) btnSubmit.disabled = false;

        if (data.ok && data.downloadUrl) {
            // Trigger automatic download
            const a = document.createElement('a');
            a.href = data.downloadUrl;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Show success banner in modal
            if (banner) {
                banner.style.display = 'block';
                const details = document.getElementById('pdfSuccessDetails');
                const dlBtn = document.getElementById('btnDownloadProtectedPdfDirect');
                if (details) {
                    details.textContent = `${data.pageCount} page(s) tatouée(s) • Code: ${data.record.barcode} • Destinataire: ${data.record.studentName}`;
                }
                if (dlBtn) {
                    dlBtn.href = data.downloadUrl;
                    dlBtn.download = data.filename;
                }
            }

            showToast(`🎉 Succès : ${data.filename} (${data.pageCount} pages) téléchargé !`, 'success');
            await refreshRegistryList();
        } else {
            showToast(`Erreur : ${data.error || "Impossible de protéger le PDF"}`, 'error');
        }
    } catch (e) {
        setLoading(false);
        if (progress) progress.style.display = 'none';
        if (btnSubmit) btnSubmit.disabled = false;
        showToast(`Erreur réseau : ${e.message}`, 'error');
    }
}
    // ====================================================================
    // IMAGE MANAGEMENT & LOCAL ASSETS SYSTEM
    // ====================================================================
    let imageState = {
        selectedFile: null,
        base64Data: null,
        fileName: null,
        fileSize: 0,
        caption: '',
        uploadedImages: []
    };

    function initImageManager() {
        const btnOpenImageModal = document.getElementById('btnOpenImageModal');
        const btnCloseImageModal = document.getElementById('btnCloseImageModal');
        const btnCancelImageModal = document.getElementById('btnCancelImageModal');
        const imageDropZone = document.getElementById('imageDropZone');
        const imageFileInput = document.getElementById('imageFileInput');
        const btnResetSelectedImg = document.getElementById('btnResetSelectedImg');
        const btnRefreshImgGallery = document.getElementById('btnRefreshImgGallery');
        const btnCopyImageTag = document.getElementById('btnCopyImageTag');
        const btnInsertImageIntoDoc = document.getElementById('btnInsertImageIntoDoc');

        btnOpenImageModal?.addEventListener('click', openImageModal);
        btnCloseImageModal?.addEventListener('click', closeImageModal);
        btnCancelImageModal?.addEventListener('click', closeImageModal);

        imageDropZone?.addEventListener('click', () => imageFileInput?.click());
        imageFileInput?.addEventListener('change', handleImageFileSelect);

        if (imageDropZone) {
            imageDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                imageDropZone.classList.add('dragover');
            });
            imageDropZone.addEventListener('dragleave', () => {
                imageDropZone.classList.remove('dragover');
            });
            imageDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                imageDropZone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processImageFile(e.dataTransfer.files[0]);
                }
            });
        }

        // Global Paste (Ctrl+V) for instant image grabbing from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData && e.clipboardData.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        openImageModal();
                        processImageFile(file);
                        showToast("Image capturée depuis le presse-papier !", "info");
                        break;
                    }
                }
            }
        });

        btnResetSelectedImg?.addEventListener('click', resetSelectedImage);
        btnRefreshImgGallery?.addEventListener('click', loadImagesGallery);
        btnCopyImageTag?.addEventListener('click', copyCurrentImageTag);
        btnInsertImageIntoDoc?.addEventListener('click', handleInsertImageIntoDoc);
    }

    function openImageModal() {
        const overlay = document.getElementById('imageModalOverlay');
        overlay?.classList.add('active');
        loadImagesGallery();
    }

    function closeImageModal() {
        document.getElementById('imageModalOverlay')?.classList.remove('active');
    }

    function handleImageFileSelect(e) {
        const file = e.target.files && e.target.files[0];
        if (file) {
            processImageFile(file);
        }
    }

    function processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast("Le fichier sélectionné n'est pas une image valide.", "error");
            return;
        }

        imageState.selectedFile = file;
        imageState.fileName = file.name || `image_${Date.now()}.png`;
        imageState.fileSize = file.size;

        const reader = new FileReader();
        reader.onload = (event) => {
            imageState.base64Data = event.target.result;

            const dropzone = document.getElementById('imageDropZone');
            const previewCont = document.getElementById('imagePreviewContainer');
            const previewImg = document.getElementById('imagePreviewImg');
            const nameEl = document.getElementById('imagePreviewName');
            const sizeEl = document.getElementById('imagePreviewSize');

            if (dropzone) dropzone.style.display = 'none';
            if (previewCont) previewCont.style.display = 'flex';
            if (previewImg) previewImg.src = imageState.base64Data;
            if (nameEl) nameEl.textContent = imageState.fileName;
            if (sizeEl) sizeEl.textContent = formatBytes(file.size);
        };
        reader.readAsDataURL(file);
    }

    function resetSelectedImage() {
        imageState.selectedFile = null;
        imageState.base64Data = null;
        imageState.fileName = null;
        imageState.fileSize = 0;

        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) fileInput.value = '';

        const dropzone = document.getElementById('imageDropZone');
        const previewCont = document.getElementById('imagePreviewContainer');

        if (dropzone) dropzone.style.display = 'block';
        if (previewCont) previewCont.style.display = 'none';
    }

    async function loadImagesGallery() {
        const grid = document.getElementById('imageGalleryGrid');
        if (!grid) return;

        try {
            const res = await fetch('/api/images/list');
            const data = await res.json();
            if (data.ok && Array.isArray(data.images)) {
                imageState.uploadedImages = data.images;
                if (data.images.length === 0) {
                    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); font-size: 11.5px; padding: 12px 0;">Aucune image enregistrée pour l'instant.</div>`;
                    return;
                }

                grid.innerHTML = data.images.map(img => `
                <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: 4px; padding: 6px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <img src="${img.url}" alt="${escapeHtml(img.name)}" style="width: 100%; height: 60px; object-fit: contain; background: #ffffff; border-radius: 3px;" />
                    <div style="font-size: 10px; font-family: 'JetBrains Mono', monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; color: var(--text-muted);">${escapeHtml(img.name)}</div>
                    <button class="btn btn-secondary btn-sm" style="font-size: 10px; padding: 2px 6px; width: 100%;" onclick="insertGalleryImage('${img.name}')">
                        ➕ Insérer
                    </button>
                </div>
            `).join('');
            }
        } catch (e) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--accent-rose); font-size: 11px;">Erreur de chargement des images.</div>`;
        }
    }

    window.insertGalleryImage = async function (imgName) {
        const htmlTag = `\n        <!-- Image médicale : ${escapeHtml(imgName)} -->\n        <div class="q-image-container">\n            <img src="images/${escapeHtml(imgName)}" alt="${escapeHtml(imgName)}" class="q-image">\n        </div>\n`;
        await appendHtmlToActiveDocument(htmlTag);
        closeImageModal();
        showToast(`🖼️ Image "${imgName}" insérée dans ${state.filename} !`, 'success');
    };

    function copyCurrentImageTag() {
        let tag = '';
        const caption = document.getElementById('imageCaptionInput')?.value.trim();
        if (imageState.fileName) {
            tag = `<div class="q-image-container"><img src="images/${imageState.fileName}" alt="${caption || imageState.fileName}" class="q-image">${caption ? `<div class="q-image-caption">${caption}</div>` : ''}</div>`;
        } else {
            tag = `<div class="q-image-container"><img src="images/votre_image.png" alt="Illustration" class="q-image"></div>`;
        }

        navigator.clipboard.writeText(tag).then(() => {
            showToast("Balise HTML copiée dans le presse-papier !", "info");
        });
    }

    async function handleInsertImageIntoDoc() {
        if (!imageState.base64Data) {
            showToast("Veuillez sélectionner ou coller une image d'abord.", "info");
            document.getElementById('imageFileInput')?.click();
            return;
        }

        const caption = document.getElementById('imageCaptionInput')?.value.trim();
        setLoading(true);

        try {
            const res = await fetch('/api/images/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: imageState.base64Data,
                    filename: imageState.fileName,
                    caption
                })
            });

            const data = await res.json();
            setLoading(false);

            if (data.ok && data.htmlTag) {
                await appendHtmlToActiveDocument(data.htmlTag);
                resetSelectedImage();
                closeImageModal();
                showToast(`🖼️ ${data.filename} enregistrée et insérée dans ${state.filename} !`, 'success');
            } else {
                showToast(`Erreur : ${data.error || "Impossible d'enregistrer l'image"}`, 'error');
            }
        } catch (e) {
            setLoading(false);
            showToast(`Erreur réseau : ${e.message}`, 'error');
        }
    }

    async function appendHtmlToActiveDocument(htmlSnippet) {
        if (!htmlSnippet || !htmlSnippet.trim()) return;
        if (!state.activeFileContent) {
            await switchToFileTab(state.filename, false);
        }

        let content = state.activeFileContent || '';
        if (content.includes('</main>')) {
            content = content.replace('</main>', `    ${htmlSnippet}\n    </main>`);
        } else {
            content += htmlSnippet;
        }

        // Recalculate total questions in document and update green pill in HTML
        const qCount = (content.match(/class="question-box"/g) || []).length;
        if (qCount > 0) {
            content = content.replace(/<span class="pill pill-green">\d+\s*Questions?<\/span>/i, `<span class="pill pill-green">${qCount} Questions</span>`);
        }

        state.activeFileContent = content;
        setIframeContent(content);
        if (codeContainer) codeContainer.textContent = content;

        // Update toolbar indicators
        if (previewQCount) previewQCount.textContent = `${qCount} Questions`;
        if (tabQCount) tabQCount.textContent = qCount;

        // Refresh Tab 3 questions list in the sidebar
        const parsed = parseQuestionsFromHtml(content);
        if (parsed.length > 0) {
            state.questions = parsed;
            renderQuestionsList();
        }

        // Auto-scroll the preview container / iframe down to the newly appended section
        setTimeout(() => {
            try {
                const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow?.document;
                if (iframeDoc) {
                    const lastEl = iframeDoc.querySelector('.question-box:last-of-type') || iframeDoc.body.lastElementChild;
                    if (lastEl) {
                        lastEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                const previewContainer = document.querySelector('.preview-content') || document.querySelector('.preview-pane');
                if (previewContainer) {
                    previewContainer.scrollTo({ top: previewContainer.scrollHeight, behavior: 'smooth' });
                }
            } catch (e) {
                console.warn("Auto-scroll error", e);
            }
        }, 300);

        // Save immediately to disk
        try {
            await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: state.filename,
                    content
                })
            });
            if (autoSaveText) {
                autoSaveText.textContent = `Sauvegardé (${new Date().toLocaleTimeString('fr-FR')})`;
            }
        } catch (e) {
            console.error("Auto save after insert error", e);
        }

        // Refresh file tab size in top bar
        try {
            const fileTab = state.openFiles?.find(f => f.name === state.filename);
            if (fileTab) {
                fileTab.size = new Blob([content]).size;
                renderFileTabs();
            }
        } catch (e) {}

        // Audio notification + Speech
        playDoneSound();
    }

    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;
    window.copyCurrentImageTag = copyCurrentImageTag;
    window.handleInsertImageIntoDoc = handleInsertImageIntoDoc;
