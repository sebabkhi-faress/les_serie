// Self-contained Code 128 Barcode Generator (Outputs clean scalable SVG)
// Supports Code 128 Set B and C (optimal for numbers like 717271883927)

const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
    "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 100-106 (106 is STOP)
];

const START_B = 104;
const START_C = 105;
const STOP = 106;

function generateBarcodeSVG(text, options = {}) {
    const {
        height = 42,
        showText = true,
        fontSize = 11,
        barColor = "#000000",
        unitWidth = 1.6
    } = options;

    const cleanText = String(text).trim();
    // Check if digits only and even length -> Use Code 128C for ultra clean barcode
    const isDigitsOnly = /^\d+$/.test(cleanText);

    let codes = [];
    if (isDigitsOnly && cleanText.length % 2 === 0) {
        codes.push(START_C);
        for (let i = 0; i < cleanText.length; i += 2) {
            codes.push(parseInt(cleanText.substr(i, 2), 10));
        }
    } else {
        codes.push(START_B);
        for (let i = 0; i < cleanText.length; i++) {
            codes.push(cleanText.charCodeAt(i) - 32);
        }
    }

    // Checksum
    let checksum = codes[0];
    for (let i = 1; i < codes.length; i++) {
        checksum += codes[i] * i;
    }
    checksum %= 103;
    codes.push(checksum);
    codes.push(STOP);

    // Convert codes to bar pattern string
    let patternString = "";
    codes.forEach(code => {
        patternString += CODE128_PATTERNS[code];
    });

    // Draw SVG bars
    const quietZone = 10;
    let currentX = quietZone;
    let rects = "";

    for (let i = 0; i < patternString.length; i++) {
        const width = parseInt(patternString[i], 10) * unitWidth;
        const isBar = (i % 2 === 0);
        if (isBar) {
            rects += `<rect x="${currentX.toFixed(1)}" y="2" width="${width.toFixed(1)}" height="${height}" fill="${barColor}" />`;
        }
        currentX += width;
    }

    const totalWidth = currentX + quietZone;
    const totalHeight = height + (showText ? fontSize + 7 : 4);

    let textElement = "";
    if (showText) {
        textElement = `<text x="${(totalWidth / 2).toFixed(1)}" y="${(height + fontSize + 3).toFixed(1)}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="${fontSize}" font-weight="700" fill="${barColor}" text-anchor="middle" letter-spacing="1.5">${cleanText}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}">
        <rect width="100%" height="100%" fill="transparent" />
        ${rects}
        ${textElement}
    </svg>`;
}

// Generate unique 12-digit code like 717271883927
function generateUniqueCode() {
    // 12-digit number: prefix with timestamp part + random digits
    const prefix = "71"; // Nice clean medical prefix matching user's image
    const middle = Math.floor(1000 + Math.random() * 9000);
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${middle}${suffix}`.slice(0, 12);
}

module.exports = {
    generateBarcodeSVG,
    generateUniqueCode
};
