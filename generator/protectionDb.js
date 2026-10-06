const fs = require('fs');
const path = require('path');
const { generateBarcodeSVG, generateUniqueCode } = require('./barcodeGenerator');

const DB_FILE = path.join(__dirname, 'protection_db.json');

// Initialize database file if not present
function initDb() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

function getRecords() {
    initDb();
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error("Error reading protection_db.json", e);
        return [];
    }
}

function saveRecords(records) {
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function createProtectedRecord({ studentName, documentTitle, seriesSubtitle = "", customBarcode = null }) {
    initDb();
    const records = getRecords();

    const barcode = customBarcode || generateUniqueCode();
    const barcodeSvg = generateBarcodeSVG(barcode, {
        height: 38,
        fontSize: 10,
        unitWidth: 1.5
    });

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }) + " " + now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const newRecord = {
        id: `PROT_${Date.now()}`,
        barcode,
        studentName: String(studentName || 'Destinataire Inconnu').trim(),
        documentTitle: String(documentTitle || 'MODULE MÉDICAL').trim(),
        seriesSubtitle: String(seriesSubtitle || '').trim(),
        date: dateFormatted,
        timestamp: now.getTime(),
        status: "Actif",
        barcodeSvg
    };

    records.unshift(newRecord);
    saveRecords(records);
    return newRecord;
}

function deleteRecord(id) {
    const records = getRecords();
    const filtered = records.filter(r => r.id !== id && r.barcode !== id);
    saveRecords(filtered);
    return { ok: true, remaining: filtered.length };
}

function findRecordByBarcode(barcode) {
    const records = getRecords();
    const clean = String(barcode).trim();
    return records.find(r => r.barcode === clean);
}

module.exports = {
    getRecords,
    createProtectedRecord,
    deleteRecord,
    findRecordByBarcode
};
