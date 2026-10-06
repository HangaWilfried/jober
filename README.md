# Jober 🚀

> **Assistant intelligent d'automatisation de recherche d'emploi et de candidature avec principe Human-in-the-Loop.**

Ce projet est conçu comme un outil de productivité quotidien pour automatiser les tâches répétitives (recherche d'offres, analyse des prérequis, calcul du score de correspondance, adaptation du CV et lettre de motivation) tout en maintenant l'intervention humaine là où elle apporte une réelle valeur.

---

## 📁 Architecture du projet

Le dépôt est organisé en deux dossiers principaux :

- **[`docs/`](./docs/ARCHITECTURE.md)** : Documentation technique d'architecture et spécifications du contrat d'API REST.
- **`frontend/`** : Application web développée en **Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS**.
- **`backend/`** : API REST et moteurs d'automatisation développés en **Node.js + TypeScript + Fastify + Zod**.
- **[`GEMINI.md`](./GEMINI.md)** : Document de vision d'origine et principes directeurs du projet.

---

## 🧠 Principe fondamental : Match Score vs Application Readiness

- **Match Score (0 - 100%)** : Degré d'adéquation entre le profil et l'offre d'emploi.
- **Application Readiness (0 - 100%)** : Degré de complétude de la candidature (documents prêts, réponses renseignées, absence de questions subjectives ou de CAPTCHA).

Une candidature n'est automatisable que lorsque **Match Score >= 90%** ET **Readiness == 100%**. Dans tous les autres cas, l'application prépare la candidature et invite l'utilisateur à valider ou compléter l'action (*Human-in-the-loop*).

---

## 🛠️ Démarrage rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) ou `npm`

### Installation & Lancement

1. **Backend**
   ```bash
   cd backend
   pnpm install # ou npm install
   pnpm dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   pnpm install # ou npm install
   pnpm dev
   ```

