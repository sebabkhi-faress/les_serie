const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Self-contained Code 128 patterns for drawing vector barcodes onto PDF
const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

function getCode128Pattern(text) {
    const cleanText = String(text).trim();
    const isDigitsOnly = /^\d+$/.test(cleanText);
    let codes = [];
    if (isDigitsOnly && cleanText.length % 2 === 0) {
        codes.push(105); // START C
        for (let i = 0; i < cleanText.length; i += 2) {
            codes.push(parseInt(cleanText.substr(i, 2), 10));
        }
    } else {
        codes.push(104); // START B
        for (let i = 0; i < cleanText.length; i++) {
            codes.push(cleanText.charCodeAt(i) - 32);
        }
    }
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
    checksum %= 103;
    codes.push(checksum);
    codes.push(106); // STOP

    let pattern = "";
    codes.forEach(c => pattern += CODE128_PATTERNS[c]);
    return pattern;
}

/**
 * Stamps a security header with Code 128 barcode & student attribution onto EVERY page of an existing PDF.
 */
async function protectExistingPdf(pdfBuffer, options = {}) {
    const {
        studentName = "Etudiant Confidentiel",
        barcode = "717271883927",
        documentTitle = "DOCUMENT MEDICAL SECURISE",
        date = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } = options;

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const newDoc = await PDFDocument.create();

    const fontBold = await newDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await newDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await newDoc.embedFont(StandardFonts.CourierBold);

    const pattern = getCode128Pattern(barcode);
    const pages = pdfDoc.getPages();

    // Reserved header zone height (pt) so original content is NEVER covered
    const bannerHeight = 22;
    const topMargin = 4;
    const totalTopReserved = bannerHeight + topMargin + 3; // 29pt headroom (subtle, minimal scale)

    for (let idx = 0; idx < pages.length; idx++) {
        const origPage = pages[idx];
        const { width, height } = origPage.getSize();

        // 1. Embed original page and scale down slightly to create 100% clean headroom
        const [embeddedPage] = await newDoc.embedPdf(pdfDoc, [idx]);
        const scale = (height - totalTopReserved) / height;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = 3;

        const newPage = newDoc.addPage([width, height]);

        // 2. Draw original page content safely below the reserved top zone
        newPage.drawPage(embeddedPage, {
            x: offsetX,
            y: offsetY,
            xScale: scale,
            yScale: scale
        });

        // 3. Draw Chameleon Header (ZERO background, ZERO border-box, completely integrated!)
        const bannerY = height - bannerHeight - topMargin;
        const marginX = 20;
        const bannerWidth = width - (marginX * 2);

        // Delicate hairline divider under the header
        newPage.drawLine({
            start: { x: marginX, y: bannerY },
            end: { x: marginX + bannerWidth, y: bannerY },
            thickness: 0.5,
            color: rgb(0.80, 0.84, 0.89)
        });

        // Chameleon Line 1: Academic / Module Header
        const cleanDocTitle = (documentTitle || "MODULE MEDICAL").replace(/[^\x20-\x7E]/g, '').toUpperCase();
        newPage.drawText(`FACULTE DE MEDECINE  •  ${cleanDocTitle}`.slice(0, 68), {
            x: marginX,
            y: bannerY + bannerHeight - 7,
            size: 7.2,
            font: fontBold,
            color: rgb(0.12, 0.18, 0.28)
        });

        // Chameleon Line 2: Natural administrative registration index
        const cleanStudent = studentName.replace(/[^\x20-\x7E]/g, '');
        const metaLine = `Exemplaire : ${cleanStudent}   •   Ref : ${barcode}   •   ${date}   •   Page ${idx + 1}/${pages.length}`;
        newPage.drawText(metaLine.slice(0, 85), {
            x: marginX,
            y: bannerY + bannerHeight - 16,
            size: 6.0,
            font: fontRegular,
            color: rgb(0.42, 0.48, 0.56)
        });

        // Barcode on Right (Official Archival Code)
        const unitWidth = 0.78;
        const barHeight = 12.5;
        const totalBarWidth = pattern.split('').reduce((acc, d) => acc + parseInt(d, 10) * unitWidth, 0);
        let barX = width - marginX - totalBarWidth;
        const barY = bannerY + 6;

        for (let i = 0; i < pattern.length; i++) {
            const w = parseInt(pattern[i], 10) * unitWidth;
            if (i % 2 === 0) {
                newPage.drawRectangle({
                    x: barX,
                    y: barY,
                    width: w,
                    height: barHeight,
                    color: rgb(0.08, 0.10, 0.14)
                });
            }
            barX += w;
        }

        // 12-digit number below barcode
        const numText = barcode;
        const numWidth = fontMono.widthOfTextAtSize(numText, 5.8);
        newPage.drawText(numText, {
            x: (width - marginX - totalBarWidth) + (totalBarWidth - numWidth) / 2,
            y: barY - 5.5,
            size: 5.8,
            font: fontMono,
            color: rgb(0.15, 0.20, 0.28)
        });
    }

    const modifiedBytes = await newDoc.save();
    return {
        pdfBuffer: Buffer.from(modifiedBytes),
        pageCount: pages.length
    };
}

module.exports = {
    protectExistingPdf
};
