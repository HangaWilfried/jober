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

> La soumission automatique est limitée aux formulaires HTTPS standard Greenhouse/Lever. CAPTCHA, authentification, consentements, informations sensibles ou questions inconnues arrêtent le robot et rendent la main à l'utilisateur. Aucune autre plateforme n'est automatisée.

Les offres collectées et les CV sont stockés localement dans SQLite et `backend/uploads`. Si `GEMINI_API_KEY` est configurée, le texte du CV et des annonces est transmis à Google Gemini pour l'analyse et la préparation. Sans clé, une estimation locale prudente est utilisée et identifiée comme heuristique.

---

## Procédure pour tester la version actuelle

### 1. Installer et préparer la base

À faire une seule fois, ou après une mise à jour des dépendances :

```powershell
pnpm install
pnpm --filter jober-backend db:push
pnpm --filter jober-backend db:seed
```

Le seed fournit un **profil et des offres de démonstration**. Il ne supprime pas un profil déjà présent. Sur une nouvelle base, il est nécessaire pour créer le profil initial avant de pouvoir modifier le profil ou importer un CV. Ces données sont fictives : ne prenez pas les offres de démonstration pour des résultats de collecte.

### 2. Lancer le backend

Dans le premier terminal :

```powershell
pnpm --filter jober-backend exec playwright install chromium
pnpm --filter jober-backend dev
```

Le backend démarre sur `http://localhost:3001`. Il lance aussi une collecte au démarrage, puis toutes les six heures.

Pour utiliser Gemini, configurez la clé **dans ce terminal avant de démarrer le serveur** :

```powershell
$env:GEMINI_API_KEY = "votre-cle"
pnpm --filter jober-backend dev
```

Sans clé, l’analyse utilise le fallback local heuristique, identifié comme tel. Le backend ne charge pas automatiquement un fichier `.env` pour cette variable.

Vérifiez que l’API répond, dans un autre terminal :

```powershell
Invoke-RestMethod http://localhost:3001/health
```

La réponse doit indiquer `status: ok`.

### 3. Lancer le frontend

Dans le second terminal :

```powershell
pnpm --filter frontend dev
```

Ouvrez l’adresse affichée par Vite, normalement `http://localhost:5173`.

Dans l’application, vérifiez votre profil et vos préférences, puis importez un CV contenant du texte lisible. Les PDF scannés sans texte extractible ne sont pas pris en charge.

### 4. Tester la collecte et la préparation

Dans le tableau de bord, lancez une collecte. Vous pouvez aussi appeler directement l’API :

```powershell
Invoke-RestMethod -Method Post http://localhost:3001/api/v1/jobs/collect
```

La réponse inclut le nombre de nouvelles offres, de doublons, d’offres expirées ou incomplètes, ainsi que les sources en échec. Ensuite, vérifiez dans l’interface les offres collectées, leur analyse et la préparation d’une candidature.

Pour lancer les tests automatisés et les builds :

```powershell
pnpm --filter jober-backend test
pnpm --filter jober-backend build
pnpm --filter frontend build
```

### Précaution importante

**Ne déclenchez pas une tentative de soumission automatique sur une candidature réelle simplement pour tester le bouton** : sur un formulaire Greenhouse ou Lever compatible, cette action peut réellement envoyer la candidature. La confirmation manuelle, elle, sert uniquement à enregistrer que vous avez soumis vous-même le dossier.

Cette procédure vérifie le fonctionnement local, mais pas la disponibilité permanente des sites tiers ni la fiabilité du matching sur vos offres réelles. Les instructions officielles sont aussi dans le `README.md`.