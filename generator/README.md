# 🩺 Antigravity QCM Studio IA

Studio Web avec **Agent IA intégré (Google Gemini)** pour la création, conversion automatique et mise en page professionnelle de séries de QCM d'annales de médecine (Résidanat & Internat).

---

## 🚀 Lancement Rapide

### Option 1 (Le plus simple)
Double-cliquez sur :
- **`start_studio.bat`** (à la racine) ou **`generator/start.bat`**
Le serveur se lance et votre navigateur ouvre automatiquement l'application sur **`http://localhost:3001`**.

### Option 2 (En ligne de commande)
```bash
cd generator
node server.js
```

---

## 🌟 Fonctionnalités Clés

1. **Agent IA Médical Interactif (Gemini)** :
   - Discutez naturellement avec l'IA pour générer de nouveaux QCMs, corriger des propositions ou enrichir des justifications médicales.
   - Utilise directement la clé API configurée dans [env.txt](file:///d:/new%20era%20club/website/protection_pdf/env.txt) avec basculement automatique sur les modèles les plus performants (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, etc.).

2. **⚡ Coller & Convertir (Paste & Transform)** :
   - Collez n'importe quel texte brut copié depuis un Word, PDF ou document d'annales.
   - En **1 clic**, l'IA extrait le numéro, l'énoncé, les items, la réponse, et formule des **justifications médicales détaillées** pour chaque item (Vrai / Faux).

3. **Règles Strictes de Numérotation (Zéro "ou")** :
   - L'IA respecte rigoureusement la numérotation d'origine ou une numérotation propre et continue.
   - **Aucune double numérotation artificielle** (aucun `Question 43 (ou 33)`).

4. **Prévisualisation en Direct Format A4** :
   - Visualisation temps réel du document complet avec le design system exact de `serie1.html`.
   - Cartes de questions protégées contre les coupures d'impression (`break-inside: avoid`).
   - Compteur de page dynamique personnalisable (démarrage à la page 4 par défaut).
   - Bascule instantanée entre **Aperçu Impression** et **Code Source HTML**.

5. **Mode Étude Interactif** :
   - Bouton pour masquer/afficher les réponses et justifications afin de tester ses connaissances avant impression.

6. **Export & Sauvegarde** :
   - **Sauvegarder** directement le fichier HTML dans le dossier de travail.
   - **Télécharger** le fichier `.html`.
   - **Imprimer / PDF** via la boîte de dialogue d'impression ou compilation headless Chrome sans coupure de questions.
