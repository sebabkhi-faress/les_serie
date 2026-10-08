import QRCode from "qrcode";

/**
 * Barcode & 2D QR Code Generation Engine for QCM Studio
 * 
 * WHY CODE 128 ORIGINALLY?
 * ----------------------------------------------------
 * 1. Medical Exam / Concours Standard:
 *    Code 128 is the global clinical & university standard for 1D printed exam sheets (A4).
 * 2. High Density (Subset C):
 *    Code 128-C compresses 12-digit numeric student IDs (e.g., 717271883927) into only 6 symbol
 *    pairs, keeping the watermark banner slim (~38px height) without eating into question space.
 * 3. Laser Scanner Reliability:
 *    Equipped with a Modulo 103 checksum, preventing optical read errors during concours scanning.
 * 
 * WHY EXPAND TO QR CODE & CODE 39?
 * ----------------------------------------------------
 * - QR Code (2D): Allows instant scanning via any student smartphone camera or tablet without
 *   requiring a dedicated 1D optical laser gun. Can embed verification URLs (e.g. Supabase verification).
 * - Code 39 (1D): The traditional alphanumeric standard for medical badges and matricule IDs.
 */

// =========================================================================
// 1. CODE 128 (1D - Standard Concours Médicaux)
// =========================================================================

const CODE128_PATTERNS: string[] = [
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

export interface BarcodeOptions {
  height?: number;
  showText?: boolean;
  fontSize?: number;
  barColor?: string;
  unitWidth?: number;
}

export function generateBarcodeSVG(text: string, options: BarcodeOptions = {}): string {
  const {
    height = 42,
    showText = true,
    fontSize = 11,
    barColor = "#000000",
    unitWidth = 1.6,
  } = options;

  const cleanText = String(text || "").trim();
  if (!cleanText) return "";

  const isDigitsOnly = /^\d+$/.test(cleanText);

  const codes: number[] = [];
  if (isDigitsOnly && cleanText.length % 2 === 0) {
    codes.push(START_C);
    for (let i = 0; i < cleanText.length; i += 2) {
      codes.push(parseInt(cleanText.substring(i, i + 2), 10));
    }
  } else {
    codes.push(START_B);
    for (let i = 0; i < cleanText.length; i++) {
      codes.push(cleanText.charCodeAt(i) - 32);
    }
  }

  // Checksum Modulo 103
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  checksum %= 103;
  codes.push(checksum);
  codes.push(STOP);

  let patternString = "";
  codes.forEach((code) => {
    patternString += CODE128_PATTERNS[code] || "";
  });

  const quietZone = 10;
  let currentX = quietZone;
  let rects = "";

  for (let i = 0; i < patternString.length; i++) {
    const width = parseInt(patternString[i], 10) * unitWidth;
    const isBar = i % 2 === 0;
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

// =========================================================================
// 2. QR CODE (2D - Scan Smartphone / Vérification Instantanée)
// =========================================================================

export interface QRCodeOptions {
  size?: number;
  color?: string;
  margin?: number;
  showText?: boolean;
}

export function generateQRCodeSVG(text: string, options: QRCodeOptions = {}): string {
  try {
    const { size = 76, color = "#000000", margin = 2 } = options;
    const cleanText = String(text || "").trim();
    if (!cleanText) return "";

    const qr = QRCode.create(cleanText, { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;
    const totalModules = moduleCount + margin * 2;
    const cellSize = (size / totalModules).toFixed(2);

    let rects = "";
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * (size / totalModules)).toFixed(2);
          const y = ((r + margin) * (size / totalModules)).toFixed(2);
          rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="100%" height="100%" fill="transparent" />
      ${rects}
    </svg>`;
  } catch (err) {
    console.error("Erreur de génération QR Code SVG:", err);
    return "";
  }
}

// =========================================================================
// 3. CODE 39 (1D - Matricules Alphanumériques Traditionnels)
// =========================================================================

const CODE39_PATTERNS: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100", "A": "100001001", "B": "001001001",
  "C": "101001000", "D": "000011001", "E": "100011000", "F": "001011000",
  "G": "000001101", "H": "100001100", "I": "001001100", "J": "000011100",
  "K": "100000011", "L": "001000011", "M": "101000010", "N": "000010011",
  "O": "100010010", "P": "001010010", "Q": "000000111", "R": "100000110",
  "S": "001000110", "T": "000010110", "U": "110000001", "V": "011000001",
  "W": "111000000", "X": "010010001", "Y": "110010000", "Z": "011010000",
  "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
  "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010"
};

export function generateCode39SVG(text: string, options: BarcodeOptions = {}): string {
  const {
    height = 40,
    showText = true,
    fontSize = 11,
    barColor = "#000000",
    unitWidth = 1.3,
  } = options;

  const raw = String(text || "").trim().toUpperCase();
  if (!raw) return "";

  // Code 39 starts and ends with asterisk delimiter
  const formatted = `*${raw.replace(/[^*A-Z0-9\-. $/+%]/g, "")}*`;

  const wideRatio = 2.4;
  const narrowWidth = unitWidth;
  const wideWidth = unitWidth * wideRatio;
  const charGap = narrowWidth;

  const quietZone = 10;
  let currentX = quietZone;
  let rects = "";

  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    const pattern = CODE39_PATTERNS[ch] || CODE39_PATTERNS["*"];

    for (let p = 0; p < 9; p++) {
      const isWide = pattern[p] === "1";
      const w = isWide ? wideWidth : narrowWidth;
      const isBar = p % 2 === 0;

      if (isBar) {
        rects += `<rect x="${currentX.toFixed(1)}" y="2" width="${w.toFixed(1)}" height="${height}" fill="${barColor}" />`;
      }
      currentX += w;
    }
    currentX += charGap;
  }

  const totalWidth = currentX + quietZone;
  const totalHeight = height + (showText ? fontSize + 7 : 4);

  let textElement = "";
  if (showText) {
    textElement = `<text x="${(totalWidth / 2).toFixed(1)}" y="${(height + fontSize + 3).toFixed(1)}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="${fontSize}" font-weight="700" fill="${barColor}" text-anchor="middle" letter-spacing="2">${raw}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}">
    <rect width="100%" height="100%" fill="transparent" />
    ${rects}
    ${textElement}
  </svg>`;
}

// =========================================================================
// 4. UNIFIED DISPATCHER
// =========================================================================

export type BarcodeFormat = "code128" | "qrcode" | "code39";

export function generateUnifiedBarcodeSVG(
  text: string,
  format: BarcodeFormat = "code128",
  options: BarcodeOptions & QRCodeOptions = {}
): string {
  switch (format) {
    case "qrcode":
      return generateQRCodeSVG(text, {
        size: options.height ? options.height * 1.8 : 74,
        color: options.barColor || "#000000",
      });
    case "code39":
      return generateCode39SVG(text, options);
    case "code128":
    default:
      return generateBarcodeSVG(text, options);
  }
}

// Generate unique 12-digit code like 717271883927
export function generateUniqueCode(): string {
  const prefix = "71";
  const middle = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${middle}${suffix}`.slice(0, 12);
}
