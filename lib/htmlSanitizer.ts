/**
 * Utilitaire de nettoyage du HTML généré ou téléversé
 * Supprime les barres d'outils/contrôles d'écran interactives parasites
 * (ex: .screen-control-bar, .screen-toolbar, "Série conforme au modèle officiel", etc.)
 * afin que l'affichage studio reste 100% épuré avec la protection au sommet.
 */

export function stripGeneratedHeaderToolbar(html: string): string {
  if (!html || typeof html !== "string") return html;

  let cleaned = html;

  // 1. Supprimer les commentaires de contrôle
  cleaned = cleaned.replace(/<!--\s*BARRE DE CONTRÔLE[\s\S]*?-->/gi, "");
  cleaned = cleaned.replace(/<!--\s*BARRE D'OUTILS INTERACTIVE[\s\S]*?-->/gi, "");
  cleaned = cleaned.replace(/<!--\s*BARRE D'ACTIONS ÉCRAN[\s\S]*?-->/gi, "");

  // 2. Supprimer le conteneur .screen-control-bar (avec ou sans divs imbriquées)
  cleaned = cleaned.replace(
    /<div[^>]*class=["'][^"']*\bscreen-control-bar\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<div[^>]*class=["'][^"']*\bscreen-control-bar\b[^"']*["'][\s\S]*?<\/div>/gi,
    ""
  );

  // 3. Supprimer .screen-toolbar et aside.screen-toolbar
  cleaned = cleaned.replace(
    /<aside[^>]*class=["'][^"']*\bscreen-toolbar\b[^"']*["'][\s\S]*?<\/aside>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<div[^>]*class=["'][^"']*\bscreen-toolbar\b[^"']*["'][\s\S]*?<\/div>/gi,
    ""
  );

  // 4. Supprimer tout bloc contenant les badges et boutons spécifiques de cette barre
  cleaned = cleaned.replace(
    /<div[^>]*class=["'][^"']*\b(?:badge-info|action-buttons)\b[^"']*["'][\s\S]*?<\/div>/gi,
    ""
  );

  // 5. Supprimer le script toggleStudyMode s'il est présent
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?toggleStudyMode[\s\S]*?<\/script>/gi, "");

  return cleaned.trim();
}
