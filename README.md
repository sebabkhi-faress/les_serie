# 🏥 LES SÉRIE — Antigravity Medical QCM Studio

Studio Web complet pour la gestion, mise en page automatique et protection anti-copie de séries de QCMs médicales d'annales (Résidanat & Internat en médecine).

---

## 🌟 Fonctionnalités Principales

- **Génération & Conversion IA :** Conversion automatique de texte brut de QCMs en structure HTML médicale prête pour l'impression A4 via l'API Google Gemini.
- **Protection Anti-Copie Nominative :**
  - Tatouage numérique par Code-barres unique **Code 128**.
  - Attribution personnalisée au nom de l'étudiant / médecin.
  - Registre de traçabilité local (`protection_registry.json`).
  - Système de mise à l'échelle automatique sur PDF existants pour garantir **0 % de chevauchement** sur le contenu médical.
  - Préservation intégrale du document original (génération dans un nouveau fichier séparé sans altérer l'original).
- **Rendu PDF Haute Définition :** Moteur d'exportation PDF instantané compatible Chromium / Chrome Headless.
- **Gestionnaire Multi-Fichiers :** Onglets de travail, import/export HTML, prévisualisation interactive A4 et mode étude.

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- Google Chrome ou Microsoft Edge (pour le rendu PDF headless)
- Une clé d'API Google Gemini (gratuite sur [Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/sebabkhi-faress/les_serie.git
cd les_serie

# Installer les dépendances
npm install
```

### Configuration

Créez un fichier `env.txt` (ou `.env`) à la racine du projet avec votre clé API Gemini :

```ini
GEMINI_API_KEY=votre_cle_api_ici
PORT=3000
```

### Lancement

```bash
npm start
```

Ouvrez ensuite votre navigateur sur **http://localhost:3000**.

---

## 📂 Structure du Projet

```text
├── files/                   # Documents et séries HTML (ex: CARDIO2.html)
├── generator/
│   ├── public/              # Interface Web (HTML, CSS, JS frontend)
│   ├── server.js            # Serveur Node.js natif et API REST
│   ├── htmlBuilder.js       # Moteur de génération HTML & CSS paged media
│   ├── pdfProtector.js      # Moteur vectoriel de protection et tatouage PDF
│   ├── barcodeGenerator.js  # Générateur de code-barres Code 128 SVG
│   └── protectionDb.js      # Base de données locale de traçabilité
├── package.json
└── README.md
```

---

## 📄 Licence

Ce projet est sous licence ISC.
