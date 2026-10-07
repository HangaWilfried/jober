# Jober — Architecture & Spécifications du Contrat API (Frontend / Backend)

Ce document établit le contrat de collaboration technique entre **l'équipe Frontend** (Vue 3 + Pinia + Tailwind CSS) et **l'équipe Backend** (Node.js + TypeScript). Il concrétise les principes fondateurs définis dans le document de cadrage [GEMINI.md](../GEMINI.md).

---

## 1. Vision d'ensemble & Architecture Système

L'application repose sur une séparation nette entre l'interface utilisateur et le moteur d'automatisation.

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (Vue 3 + Pinia + Tailwind)"]
        UI_Dashboard["Tableau de bord & Flux d'offres"]
        UI_Review["Interface de Vérification (Human-in-the-loop)"]
        UI_Profile["Gestion Profil, CVs & Préférences"]
        Pinia_Store["Stores Pinia (Jobs, Applications, Profile)"]
    end

    subgraph Backend ["Backend (Node.js + TypeScript)"]
        API_Gateway["API REST (Fastify + Zod)"]
        Module_Collector["Collecteur HTTP (WTTJ, RSS, APIs)"]
        Module_Analysis["Moteur d'Analyse & Matching (Gemini LLM / Règles)"]
        Module_Prep["Générateur de Candidatures (CV adapté, LM, Q&A)"]
        Module_Automator["Automateur prudent Greenhouse / Lever (Playwright)"]
        DB[(Base de Données Locale - SQLite / Prisma)]
    end

    UI_Dashboard -->|HTTP REST| API_Gateway
    UI_Review -->|HTTP REST| API_Gateway
    UI_Profile -->|HTTP REST| API_Gateway
    Pinia_Store <--> UI_Dashboard
    Pinia_Store <--> UI_Review

    API_Gateway --> Module_Collector
    API_Gateway --> Module_Analysis
    API_Gateway --> Module_Prep
    API_Gateway --> Module_Automator
    API_Gateway --> DB
```

---

## 2. Clarification Technique : Node.js pour l'IA

- **Orchestration LLM moderne :** Pour appeler les modèles (Google Gemini, OpenAI, Claude ou Ollama localement), tout se fait via des APIs HTTP/REST ou les SDKs officiels Node.js (`@google/genai`, `@google/generative-ai`, SDK OpenAI). Node.js est taillé pour les I/O asynchrones et le streaming de réponses en temps réel.
- **Typage & Structured Outputs avec Zod :** Zod en TypeScript permet de forcer le LLM à retourner des schémas JSON stricts et validés à l'exécution (extraire les compétences, calculer les scores, identifier les points bloquants).
- **Automatisation Web & Playwright :** Playwright a été conçu par Microsoft en premier pour Node.js. L'automatisation des formulaires web et la détection des champs est fluide et performante dans l'écosystème Node.js/TypeScript.
- **État réel :** les collecteurs utilisent HTTP, RSS et APIs publiques sans Playwright. Playwright est réservé à l'automateur Greenhouse/Lever ; les autres sites ne sont pas soumis automatiquement.
- **Modularité :** Si une tâche nécessitait un traitement Python spécifique (ex: modèle local PyTorch), elle pourra tourner dans un conteneur dédié sans impacter l'architecture.

---

## 3. Modèle Conceptuel de Données

### 3.1. La règle d'or : Match Score vs Application Readiness

Conformément à [GEMINI.md](../GEMINI.md) :
- **`match_score` (0-100%)** : Adéquation entre le profil utilisateur et les exigences du poste.
- **`readiness_score` (0-100%)** : Niveau de préparation et de faisabilité de la candidature.
- **Règle d'automatisation :** Candidature envoyée automatiquement **uniquement si** `match_score >= 90%`, `readiness_score == 100%`, le CV et la lettre sont explicitement confirmés, et bloqueurs/réponses inconnues sont résolus. Tout score inférieur ou point bloquant arrête l'automatisation.
- **Garde actuelle :** l'automatisation active est limitée aux formulaires HTTPS standard Greenhouse/Lever. Une confirmation manuelle n'est possible que si readiness vaut 100, les bloqueurs sont résolus et les réponses préparées sont confirmées.
- **Calcul actuel de readiness :** CV source analysable (30), CV adapté explicitement confirmé (30), lettre explicitement confirmée (20), et aucun bloqueur ou réponse non confirmée (20). Un score de 100 indique un dossier préparé, pas que l'utilisateur l'a déjà soumis.

### 3.2. Schéma Relationnel

```mermaid
erDiagram
    USER_PROFILE ||--o{ PROFILE_RESUME : "possède"
    USER_PROFILE ||--o{ PROFILE_SKILL : "possède"
    JOB_OFFER ||--o| JOB_ANALYSIS : "est analysée par"
    JOB_OFFER ||--o| APPLICATION : "fait l'objet de"
    APPLICATION ||--o{ APPLICATION_BLOCKER : "rencontre"

    USER_PROFILE {
        string id PK
        string full_name
        string email
        string phone
        string current_title
        string location
        json search_preferences
    }

    JOB_OFFER {
        string id PK
        string source
        string external_id
        string url
        string title
        string company
        string location
        string remote_type
        text description_raw
        datetime published_at
        datetime expires_at
        string status
    }

    JOB_ANALYSIS {
        string id PK
        string job_id FK
        int match_score
        json required_skills
        json missing_skills
        int min_experience_years
        string analysis_method
        text match_summary
        datetime analyzed_at
    }

    APPLICATION {
        string id PK
        string job_id FK
        string status
        int readiness_score
        string selected_resume_id
        text customized_resume_content
        boolean customized_resume_confirmed
        text cover_letter
        boolean cover_letter_confirmed
        json prepared_answers
        datetime submitted_at
    }

    APPLICATION_BLOCKER {
        string id PK
        string application_id FK
        string type
        string question
        text user_resolution
        boolean resolved
    }
```

---

## 4. Cycle de Vie d'une Candidature (Machine à États)

```mermaid
stateDiagram-v2
    [*] --> New: Découverte de l'offre
    New --> Analyzed: Analyse LLM & Matching
    Analyzed --> Rejected: Match < 60% ou Expirée
    Analyzed --> Prepared: Match >= 60% (Génération CV/LM)
    
    Prepared --> ReadyToReview: Readiness < 100% ou Bloqueurs
    Prepared --> ReadyToReview: Match >= 90% ET Readiness == 100% (automatisation à implémenter)
    
    ReadyToReview --> ReadyToSubmit: Validé par l'utilisateur
    ReadyToReview --> Rejected: Rejeté par l'utilisateur
    
    ReadyToSubmit --> Submitted: Soumission manuelle ou assistée
    Submitted --> [*]
    Rejected --> [*]
```

---

## 5. Spécification Détaillée des APIs REST (Contrat d'Interface)

Base URL : `/api/v1`

### 5.1. Profil Utilisateur & Préférences

#### `GET /profile`
Récupère le profil courant, les compétences, les préférences de veille et les CV.
* **Réponse (200 OK) :**
```json
{
  "id": "usr_01",
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+33612345678",
  "headline": "Lead Frontend Engineer",
  "location": "Paris, France",
  "skills": ["Vue.js", "TypeScript", "Tailwind CSS", "Node.js", "GraphQL"],
  "searchPreferences": {
    "targetTitles": ["Frontend Lead", "Senior Vue Developer", "Fullstack Node/Vue"],
    "remote": "hybrid",
    "minSalary": 65000,
    "locations": ["Paris", "Télétravail"]
  },
  "resumes": [
    {
      "id": "res_default",
      "name": "CV_Lead_Frontend_2026.pdf",
      "isPrimary": true,
      "updatedAt": "2026-09-15T10:00:00Z"
    }
  ]
}
```

#### `PUT /profile`
Met à jour les informations personnelles, les compétences et les critères de recherche. Les critères incluent postes ciblés, localisation, télétravail, exclusions d'entreprises et salaire minimum en EUR annuel.

#### `POST /profile/resume/upload`
Accepte les PDF avec texte extractible ou les fichiers `.txt` UTF-8. Les PDF scannés nécessitent de l'OCR, qui n'est pas encore fourni.

#### `POST /profile/resume/:id/primary` et `DELETE /profile/resume/:id`
Permettent de choisir le CV principal ou de supprimer un CV.

---

### 5.2. Gestion des Offres d'Emploi (`/jobs`)

#### `GET /jobs`
Liste filtrée et paginée des offres collectées.
* **Query Parameters :**
  - `status` : `new | analyzed | shortlisted | rejected | archived | expired`
  - `minMatch` : nombre (ex: `70`)
  - `source` : string (ex: `wttj`, `linkedin`)
  - La pagination et le filtre par source ne sont pas encore implémentés.

* **Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "job_101",
      "title": "Senior Vue.js / Node.js Developer",
      "company": "TechSolutions",
      "location": "Paris (Full Remote possible)",
      "remoteType": "full",
      "url": "https://example.com/jobs/101",
      "source": "wttj",
      "publishedAt": "2026-10-05T14:30:00Z",
      "expiresAt": null,
      "status": "analyzed",
      "analysis": {
        "matchScore": 92,
        "summary": "Excellente adéquation : maîtrise avancée de Vue 3, TypeScript et Node.js demandée.",
        "requiredSkills": ["Vue.js", "TypeScript", "Node.js", "Docker"],
        "matchingSkills": ["Vue.js", "TypeScript", "Node.js"],
        "missingSkills": ["Docker"],
        "minExperienceYears": 5,
        "analysisMethod": "gemini"
      },
      "applicationId": "app_501"
    }
  ],
  "total": 1
}
```

#### `POST /jobs/collect`
Déclenche la collecte synchrone ; le même collecteur s'exécute au démarrage puis toutes les six heures.
Sources actuelles : Welcome to the Jungle (HTML public + JSON-LD), We Work Remotely (RSS) et RemoteOK (API).
Les offres incomplètes sont écartées, les dates d'expiration disponibles sont appliquées et les sources défaillantes sont listées dans le résultat.
* **Réponse (200 OK) :**
```json
{
  "message": "Collecte terminée...",
  "result": {
    "totalDiscovered": 10,
    "newOffersSaved": 2,
    "duplicatesSkipped": 6,
    "expiredOffers": 1,
    "incompleteOffers": 1,
    "filteredOut": 0,
    "highlyRelevantMatches": 1,
    "sources": ["Welcome to the Jungle", "RemoteOK"],
    "failedSources": ["We Work Remotely: HTTP 503"]
  }
}
```

#### `POST /jobs/:id/analyze`
Force la ré-analyse d'une offre via le moteur LLM.

---

### 5.3. Gestion & Préparation des Candidatures (`/applications`)

#### `GET /applications`
Liste des candidatures, filtrable par `status`.

#### `GET /applications/:id`
Détail complet d'une candidature pour l'écran de revue humaine.
* **Réponse (200 OK) :**
```json
{
  "id": "app_501",
  "jobId": "job_101",
  "status": "ready_for_review",
  "matchScore": 92,
  "readinessScore": 85,
  "preparedData": {
    "selectedResume": {
      "id": "res_default",
      "name": "CV_Lead_Frontend_2026.pdf"
    },
    "availableResumes": [],
    "customizedResumeContent": "Contenu texte du CV adapté, à vérifier par l'utilisateur.",
    "customizedResumeConfirmed": false,
    "customizedHighlights": [
      "Mise en avant de l'expérience de 4 ans sur Vue 3 Composition API",
      "Ajout de projets d'automatisation et Node.js"
    ],
    "coverLetter": "Madame, Monsieur,\n\nAyant développé une solide expertise en architecture Vue 3 et Node.js...",
    "coverLetterConfirmed": false,
    "preparedAnswers": [
      {
        "question": "Années d'expérience en Vue.js ?",
        "suggestedAnswer": "6 ans",
        "confidence": 1.0,
        "isConfirmed": true
      },
      {
        "question": "Disponibilité / Préavis ?",
        "suggestedAnswer": "Immédiate ou 1 mois négociable",
        "confidence": 0.9,
        "isConfirmed": false
      }
    ]
  },
  "blockers": [
    {
      "id": "blk_01",
      "type": "subjective_question",
      "question": "Pourquoi souhaitez-vous rejoindre TechSolutions en particulier ?",
      "resolved": false,
      "userResponse": null
    }
  ]
}
```

#### `PATCH /applications/:id`
Permet de modifier la lettre, le CV adapté, les points forts, les réponses ou le CV sélectionné.

#### `POST /applications/:id/select-resume`
Sélectionne un CV source analysable puis régénère le matching, le CV adapté, la lettre, les réponses et les points à vérifier à partir de ce CV.

#### `PATCH /applications/:id/prepared-answers/:answerIndex/confirm`
Confirme explicitement une réponse après modification/vérification.

#### `POST /applications/:id/regenerate-letter`
Régénère la lettre de motivation avec des consignes optionnelles.

#### `POST /applications/:id/suggest-blocker-answer`
Propose une réponse qui reste à vérifier et confirmer par l'utilisateur.

#### `POST /applications/:id/resolve-blocker`
Enregistre une réponse humaine non vide pour résoudre un point bloquant.

#### `POST /applications/:id/submit`
Tente l'automatisation pour les pages HTTPS standards Greenhouse/Lever uniquement, si `match_score >= 90%`, readiness vaut 100, le CV adapté est sauvegardé et les bloqueurs/réponses sont tous résolus/confirmés. CAPTCHA, authentification, consentement/déclaration légale, champ obligatoire inconnu ou absence de confirmation explicite du site arrêtent l'automatisation et renvoient `manual_required` avec le lien.

#### `POST /applications/:id/confirm-manual-submission`
Enregistre une déclaration d'envoi manuel après confirmation utilisateur, seulement si readiness vaut 100. Cet endpoint ne contacte aucun site externe.

---

## 6. Structure du Répertoire `jober`

```
jober/
├── GEMINI.md               # Document d'intentions et de cadrage
├── docs/
│   └── ARCHITECTURE.md     # Ce document de référence
├── frontend/               # Vue 3, Vite, Pinia, Tailwind CSS
└── backend/                # Node.js, TypeScript, Fastify, Zod, SQLite
```
