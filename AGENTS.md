# Projet : AI Job Hunter

## 1. Contexte et problème à résoudre

Je souhaite développer une application web personnelle destinée à automatiser et simplifier au maximum ma recherche d'emploi.

Aujourd'hui, ma recherche d'emploi présente systématiquement plusieurs problèmes :

1. Je dois adapter manuellement mon CV à presque chaque offre d'emploi.
2. Je trouve régulièrement des offres dont la date limite de candidature est déjà dépassée.
3. Je dois rédiger une lettre de motivation différente pour chaque candidature.
4. Je passe énormément de temps à parcourir LinkedIn, Indeed et d'autres plateformes afin de trouver les offres correspondant réellement à mon profil.
5. Les moteurs de recherche des plateformes existantes ne permettent pas toujours de déterminer si une offre correspond réellement à mon expérience, mes compétences et mes objectifs.
6. Une partie importante de mon temps est consacrée à des tâches répétitives qui pourraient être automatisées par l'IA.

L'objectif est donc de construire une application capable de devenir mon **assistant personnel de recherche d'emploi**.

L'application doit me permettre de définir mon profil professionnel une seule fois, puis d'utiliser l'IA pour rechercher, analyser, filtrer et préparer automatiquement mes candidatures.

---

# 2. Objectif principal

L'application doit répondre à cette question :

> "Parmi toutes les offres disponibles, lesquelles correspondent réellement à mon profil et lesquelles méritent que je candidate ?"

Pour chaque offre pertinente, l'application doit idéalement pouvoir :

* déterminer si l'offre est encore active ;
* analyser l'offre ;
* comparer l'offre à mon profil ;
* identifier les compétences correspondant à mon profil ;
* identifier les compétences manquantes ;
* déterminer les exigences importantes ;
* adapter mon CV à l'offre ;
* générer une lettre de motivation personnalisée ;
* expliquer pourquoi l'offre est pertinente ;
* présenter clairement les informations importantes ;
* me permettre de décider rapidement si je souhaite candidater.

L'application doit réduire autant que possible le temps passé entre :

**"Je cherche un emploi"**

et

**"J'ai identifié les offres auxquelles je veux candidater."**

---

# 3. Principe général de fonctionnement

L'application doit fonctionner autour de plusieurs étapes.

### Étape 1 — Mon profil

Je renseigne mon profil professionnel :

* informations personnelles ;
* localisation ;
* titre professionnel ;
* années d'expérience ;
* expériences professionnelles ;
* compétences ;
* technologies ;
* langues ;
* diplômes ;
* certifications ;
* préférences professionnelles ;
* type de contrat recherché ;
* localisation souhaitée ;
* télétravail / hybride / présentiel ;
* salaire souhaité ;
* secteurs souhaités ;
* entreprises éventuellement ciblées ;
* CV principal ;
* éventuellement plusieurs versions de CV.

Le profil doit être stocké afin de ne pas devoir le renseigner à chaque recherche.

---

# 4. CV

L'application doit permettre de gérer plusieurs CV.

Exemples :

* CV Frontend Developer ;
* CV React Developer ;
* CV Vue.js Developer ;
* CV Senior Frontend Engineer ;
* CV Full Stack Developer.

Le CV principal doit servir de **source de vérité**.

Lorsqu'une offre est analysée, l'IA doit pouvoir créer une version adaptée sans inventer d'expérience ou de compétences.

### Règle importante

L'IA ne doit jamais :

* inventer une expérience professionnelle ;
* inventer une entreprise ;
* inventer un diplôme ;
* inventer une certification ;
* inventer une technologie utilisée professionnellement ;
* modifier frauduleusement mon parcours.

Elle peut uniquement :

* reformuler ;
* réorganiser ;
* mettre en avant certaines expériences ;
* adapter les mots-clés ;
* modifier la présentation ;
* améliorer la formulation ;
* sélectionner les expériences les plus pertinentes.

---

# 5. Recherche d'offres

L'application doit permettre de rechercher automatiquement des offres sur plusieurs sources.

Les sources peuvent inclure, lorsque techniquement et légalement possible :

* LinkedIn ;
* Indeed ;
* Welcome to the Jungle ;
* Glassdoor ;
* Job boards spécialisés ;
* sites carrières des entreprises ;
* autres plateformes pertinentes.

### Important

Ne pas contourner les mécanismes de sécurité des plateformes.

Ne pas utiliser de techniques destinées à contourner :

* CAPTCHA ;
* authentification ;
* restrictions d'accès ;
* mécanismes anti-bot ;
* limitations imposées par les plateformes.

Privilégier :

* APIs officielles lorsqu'elles existent ;
* flux RSS ;
* données publiques ;
* intégrations autorisées ;
* sources accessibles légalement.

L'architecture doit permettre d'ajouter facilement de nouvelles sources.

Exemple conceptuel :

```text
JobSource
 ├── LinkedInSource
 ├── IndeedSource
 ├── CompanyCareerSource
 └── CustomJobBoardSource
```

---

# 6. Détection des offres expirées

Une fonctionnalité importante est la détection des offres obsolètes.

Une offre doit pouvoir être classifiée comme :

* ACTIVE
* EXPIRING_SOON
* EXPIRED
* UNKNOWN

L'application doit rechercher autant que possible :

* date de publication ;
* date limite ;
* disponibilité actuelle de l'offre ;
* page supprimée ;
* statut de l'annonce.

Une offre expirée ne doit pas polluer les résultats principaux.

Les offres dont le statut ne peut pas être déterminé doivent être clairement identifiées comme telles.

---

# 7. Matching entre mon profil et une offre

C'est l'une des fonctionnalités centrales de l'application.

Pour chaque offre, l'IA doit analyser :

### Compétences techniques

Exemple :

```text
React       → Match
TypeScript  → Match
Vue.js      → Match
Angular     → Partial match
Java        → Missing
```

### Expérience

Comparer :

* années d'expérience demandées ;
* années d'expérience du candidat ;
* niveau de séniorité ;
* responsabilités ;
* domaine métier.

### Langues

Comparer :

* langues demandées ;
* niveau demandé ;
* niveau du candidat.

### Contraintes

Comparer :

* localisation ;
* remote ;
* type de contrat ;
* disponibilité ;
* salaire si disponible.

---

# 8. Score de pertinence

Chaque offre doit disposer d'un score de pertinence compréhensible.

Exemple :

```text
Match : 87 %

Compétences       92 %
Expérience        95 %
Localisation      100 %
Langues           70 %
Séniorité         90 %
```

Ce score ne doit jamais être présenté comme une vérité absolue.

Il doit être accompagné d'une explication :

```text
Pourquoi cette offre correspond :

+ React
+ TypeScript
+ 5 ans d'expérience
+ Remote
+ Senior position

Points faibles :

- Anglais B2 demandé
- Expérience Kubernetes souhaitée
```

L'utilisateur doit pouvoir comprendre **pourquoi** une offre a été considérée comme pertinente.

---

# 9. Priorisation des offres

Les offres doivent être triées intelligemment.

Exemple :

### Très pertinente

Correspond fortement au profil.

### Pertinente

Quelques écarts mais candidature intéressante.

### À considérer

Plusieurs écarts mais potentiel intéressant.

### Peu pertinente

Trop d'écarts avec le profil.

### Expirée

Ne plus présenter dans les résultats principaux.

---

# 10. Recherche personnalisée

Je dois pouvoir définir une recherche.

Exemple :

```text
Frontend Developer
React
Vue.js
TypeScript
Remote
Europe
Senior
CDI
```

L'application doit ensuite rechercher régulièrement de nouvelles offres.

Je dois pouvoir enregistrer plusieurs recherches.

Exemple :

```text
React Senior Remote
Vue.js Europe
Frontend Engineer Canada
Full Stack TypeScript
```

Chaque recherche peut avoir ses propres critères.

---

# 11. Déduplication

La même offre peut apparaître sur plusieurs plateformes.

L'application doit être capable de détecter les doublons.

Exemple :

```text
LinkedIn
Indeed
Company Website
```

peuvent tous pointer vers la même offre.

L'application doit essayer de regrouper ces offres en une seule entrée.

---

# 12. Lettre de motivation

À partir de :

* mon profil ;
* mon CV ;
* l'offre ;
* l'entreprise ;

l'IA doit pouvoir générer une lettre de motivation personnalisée.

La lettre doit :

* être spécifique à l'offre ;
* être naturelle ;
* éviter les phrases génériques ;
* mettre en avant les expériences pertinentes ;
* ne pas inventer d'informations ;
* rester professionnelle ;
* être facilement éditable.

Prévoir plusieurs actions :

```text
Generate
Regenerate
Shorten
Make more formal
Make more natural
Edit
Copy
Export
```

---

# 13. Analyse d'une offre

Chaque offre doit disposer d'une page de détail.

Elle doit afficher clairement :

### Informations principales

* titre ;
* entreprise ;
* localisation ;
* remote ;
* type de contrat ;
* date de publication ;
* date limite ;
* source ;
* lien vers l'offre.

### Analyse IA

* score de matching ;
* points forts ;
* points faibles ;
* compétences demandées ;
* compétences correspondantes ;
* compétences manquantes ;
* niveau de séniorité ;
* estimation de pertinence.

### Actions

```text
Adapter mon CV
Générer une lettre
Ajouter aux favoris
Marquer comme candidaté
Ignorer
Ouvrir l'offre originale
```

---

# 14. Suivi des candidatures

L'application doit également permettre de suivre les candidatures.

Statuts possibles :

```text
FOUND
TO_REVIEW
SHORTLISTED
APPLIED
INTERVIEW
OFFER
REJECTED
WITHDRAWN
```

Prévoir une vue de type Kanban ou pipeline.

Exemple :

```text
À examiner → Sélectionnées → Candidatures → Entretiens → Offres
```

---

# 15. Dashboard

Le dashboard doit être extrêmement simple.

Afficher par exemple :

```text
Nouvelles offres pertinentes       24
Offres à examiner                  8
Candidatures                       12
Entretiens                          3
Offres reçues                       1
```

Mais éviter le dashboard "corporate" rempli de graphiques inutiles.

L'objectif est l'efficacité.

---

# 16. Notifications

Prévoir des notifications lorsqu'une nouvelle offre très pertinente est trouvée.

Exemple :

```text
Nouvelle offre correspondant à 94 % à votre profil

Senior Frontend Engineer
Company XYZ
Remote
Match : 94 %
```

Prévoir également des notifications pour :

* offres arrivant bientôt à expiration ;
* changement de statut d'une candidature ;
* entretien à venir ;
* nouvelles offres correspondant fortement aux critères.

---

# 17. Design UI/UX

Le design est extrêmement important.

L'application peut être techniquement simple mais son interface doit être **moderne, propre, cohérente et agréable**.

Je ne veux pas d'un dashboard générique généré automatiquement par une IA.

Éviter :

* interfaces surchargées ;
* couleurs excessives ;
* gradients inutiles ;
* cartes partout ;
* ombres excessives ;
* boutons énormes ;
* animations décoratives sans utilité ;
* typography incohérente.

Privilégier :

* beaucoup d'espace ;
* excellente hiérarchie visuelle ;
* typographie moderne ;
* contrastes accessibles ;
* composants cohérents ;
* interactions prévisibles ;
* responsive design ;
* excellent comportement mobile.

---

# 18. Design system

Créer un véritable petit design system.

Définir de manière cohérente :

* couleurs ;
* typographie ;
* spacing ;
* radius ;
* shadows ;
* borders ;
* transitions ;
* tailles de boutons ;
* inputs ;
* selects ;
* badges ;
* cards ;
* dialogs ;
* dropdowns ;
* tooltips ;
* tabs ;
* tables ;
* skeletons ;
* empty states ;
* error states.

Ne jamais créer plusieurs variantes visuelles du même composant sans raison.

---

# 19. Animations

Les animations doivent être modernes mais discrètes.

Utiliser les animations uniquement lorsqu'elles améliorent :

* la compréhension ;
* la navigation ;
* le feedback utilisateur ;
* la perception de fluidité.

Exemples :

* apparition d'une modal ;
* changement d'état d'un bouton ;
* loading ;
* transition entre les pages ;
* apparition d'une nouvelle offre ;
* changement de statut d'une candidature.

Éviter les animations longues ou distrayantes.

Respecter `prefers-reduced-motion`.

---

# 20. Feedback utilisateur

Tous les états doivent être gérés correctement :

```text
Loading
Success
Error
Empty
Disabled
Pending
```

Utiliser des toast notifications uniquement lorsque cela apporte une vraie valeur.

Ne pas afficher de toast pour chaque petite interaction.

Les erreurs doivent être compréhensibles.

Éviter :

```text
Something went wrong
```

Préférer :

```text
Impossible de récupérer les nouvelles offres.
Réessayez dans quelques instants.
```

---

# 21. Formulaires

Les formulaires doivent être modernes et très bien pensés.

Respecter :

* validation immédiate lorsque pertinente ;
* messages d'erreur proches des champs ;
* états loading ;
* disabled states ;
* labels explicites ;
* keyboard navigation ;
* accessibilité ;
* autofill ;
* feedback après soumission.

Ne jamais utiliser uniquement la couleur pour signaler une erreur.

---

# 22. Responsive design

L'application doit être réellement responsive.

Elle doit fonctionner correctement sur :

* mobile ;
* tablette ;
* laptop ;
* desktop large.

Ne pas simplement réduire la taille des éléments sur mobile.

L'interface doit être pensée pour chaque breakpoint.

---

# 23. Choix technologiques

Utiliser une stack moderne, stable et adaptée au développement assisté par IA.

### Frontend

Utiliser :

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* React Hook Form
* Zod
* Tailwind CSS
* shadcn/ui
* Lucide Icons

Le frontend doit être développé avec une architecture claire et modulaire.

### Backend

Utiliser :

* Node.js
* TypeScript
* NestJS

Le backend doit être structuré proprement afin de pouvoir évoluer.

### API

Privilégier une approche **contract-first**.

Définir les contrats API avec OpenAPI.

Utiliser un générateur approprié pour générer les types et/ou clients côté frontend.

Ne pas dupliquer manuellement les types API entre frontend et backend.

### Base de données

Utiliser :

* PostgreSQL

avec un ORM moderne compatible TypeScript.

### Infrastructure

Prévoir :

* Docker ;
* Docker Compose ;
* variables d'environnement ;
* environnement development ;
* environnement production.

---

# 24. Architecture

Utiliser une architecture modulaire.

Ne pas créer un énorme dossier `components` contenant toute l'application.

Organiser le code par domaine lorsque cela est pertinent.

Exemple :

```text
src/
  features/
    jobs/
    applications/
    profile/
    resumes/
    searches/
    ai/
  components/
    ui/
  lib/
  hooks/
  routes/
  types/
```

Le backend doit suivre une séparation claire des responsabilités.

Exemple :

```text
modules/
  jobs/
  applications/
  users/
  resumes/
  ai/
  search/
```

Chaque module doit avoir des responsabilités clairement définies.

---

# 25. Clean Code

Le code doit respecter strictement les principes de Clean Code.

Priorités :

* simplicité ;
* lisibilité ;
* faible couplage ;
* forte cohésion ;
* fonctions courtes ;
* composants courts ;
* noms explicites ;
* responsabilités uniques ;
* logique facilement testable.

Éviter :

* fonctions gigantesques ;
* composants gigantesques ;
* fichiers de plusieurs centaines de lignes lorsque cela peut être évité ;
* logique métier dans les composants UI ;
* duplication ;
* abstractions inutiles ;
* `any` ;
* hacks ;
* code mort ;
* variables mal nommées.

---

# 26. Composants frontend

Règle importante :

**Un fichier de composant doit avoir une responsabilité claire.**

Si une page contient plusieurs composants complexes, les séparer dans différents fichiers.

Ne pas faire :

```tsx
function JobPage() {
  function JobHeader() {}
  function JobMatchScore() {}
  function JobSkills() {}
  function JobActions() {}

  return (...)
}
```

Préférer :

```text
JobPage.tsx
JobHeader.tsx
JobMatchScore.tsx
JobSkills.tsx
JobActions.tsx
```

Un composant doit être facilement lisible et facilement testable.

Si un composant devient trop long ou contient plusieurs responsabilités, le découper.

---

# 27. Règles React

Respecter les recommandations modernes de React.

Éviter :

* `useEffect` lorsqu'il n'est pas nécessaire ;
* état local inutile ;
* duplication d'état ;
* prop drilling excessif ;
* composants monolithiques ;
* logique métier directement dans le JSX.

Privilégier :

* composants spécialisés ;
* hooks personnalisés lorsque réellement nécessaires ;
* TanStack Query pour les données serveur ;
* état local uniquement pour l'état UI local ;
* validation avec Zod ;
* React Hook Form pour les formulaires.

Ne pas utiliser une librairie ou une abstraction simplement parce qu'elle existe.

Chaque dépendance doit avoir une justification.

---

# 28. Gestion des données serveur

Utiliser TanStack Query pour :

* récupération des offres ;
* recherche ;
* profil ;
* candidatures ;
* CV ;
* analyses IA.

Gérer correctement :

* loading ;
* error ;
* stale data ;
* caching ;
* invalidation ;
* optimistic updates lorsque pertinent.

Éviter de stocker des données serveur dans un state global inutilement.

---

# 29. TypeScript

Utiliser TypeScript strictement.

Activer :

```json
{
  "strict": true
}
```

Éviter `any`.

Préférer :

* types explicites ;
* discriminated unions ;
* type inference ;
* interfaces ou types cohérents ;
* schemas Zod lorsque la donnée vient de l'extérieur.

Toutes les données externes doivent être considérées comme potentiellement invalides.

---

# 30. Tests

Mettre en place :

### Unit tests

Vitest.

### Component tests

Testing Library.

### End-to-end

Playwright.

Tester en priorité :

* matching d'une offre ;
* détection des offres expirées ;
* création d'un CV adapté ;
* génération d'une lettre ;
* création d'une candidature ;
* changement de statut ;
* recherche ;
* filtres ;
* formulaires critiques.

Les tests doivent tester le comportement réel plutôt que l'implémentation interne.

---

# 31. Linting et formatting

Configurer obligatoirement :

* ESLint ;
* Prettier ;
* TypeScript strict ;
* éventuellement lint-staged ;
* Husky si pertinent.

Les commandes suivantes doivent fonctionner :

```bash
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
```

Le CI doit refuser une modification qui :

* ne compile pas ;
* ne respecte pas le lint ;
* contient des erreurs TypeScript ;
* casse les tests.

---

# 32. Git

Utiliser des commits propres et explicites.

Privilégier des commits du type :

```text
feat: add job matching
feat: add resume customization
fix: handle expired job listings
refactor: extract job filters
test: add job matching tests
```

Éviter les commits vagues :

```text
update
fix stuff
changes
test
```

---

# 33. Commentaires dans le code

Éviter au maximum les commentaires.

Le code doit être suffisamment explicite pour être compris sans commentaires.

Ne mettre un commentaire que lorsqu'il explique :

* une décision technique non évidente ;
* une contrainte externe ;
* un comportement volontairement inhabituel ;
* un workaround nécessaire.

Ne pas écrire de commentaires qui décrivent simplement le code.

Mauvais :

```ts
// Get the job
const job = await getJob(id)
```

Préférer du code suffisamment explicite.

---

# 34. Sécurité

Ne jamais exposer :

* clés API ;
* secrets ;
* tokens ;
* credentials.

Utiliser des variables d'environnement.

Valider toutes les données provenant :

* du frontend ;
* des APIs externes ;
* des sources d'emploi ;
* des modèles IA.

Prévoir :

* authentication ;
* authorization ;
* validation ;
* rate limiting ;
* protection des endpoints sensibles ;
* gestion sécurisée des fichiers CV.

---

# 35. IA

L'IA doit être considérée comme un service métier et non comme du code dispersé partout dans l'application.

Créer une abstraction claire.

Exemple conceptuel :

```text
AIService
 ├── analyzeJob()
 ├── calculateMatch()
 ├── adaptResume()
 ├── generateCoverLetter()
 └── summarizeJob()
```

Le fournisseur d'IA doit pouvoir être remplacé facilement.

Ne pas coupler toute l'application à un seul fournisseur.

---

# 36. Prompts IA

Les prompts utilisés par l'application doivent être versionnés et organisés.

Ne pas mettre de longs prompts directement dans les composants React.

Exemple :

```text
ai/
  prompts/
    job-analysis.ts
    resume-adaptation.ts
    cover-letter.ts
```

Les réponses structurées de l'IA doivent être validées avec un schema.

Ne jamais faire confiance aveuglément à une réponse JSON générée par une IA.

---

# 37. Performance

L'application doit être rapide.

Optimiser :

* appels réseau ;
* cache ;
* pagination ;
* images ;
* bundle ;
* rendering ;
* requêtes SQL.

Ne pas optimiser prématurément.

Mesurer avant d'introduire une optimisation complexe.

---

# 38. Accessibilité

L'application doit respecter les bonnes pratiques WCAG.

Notamment :

* navigation clavier ;
* focus visible ;
* labels ;
* contraste ;
* boutons accessibles ;
* modales accessibles ;
* aria uniquement lorsqu'elle est nécessaire ;
* support de `prefers-reduced-motion`.

---

# 39. Gestion des erreurs

Toutes les erreurs importantes doivent être gérées.

Prévoir :

```text
Network error
API error
AI error
Invalid job
Expired job
Parsing error
Authentication error
Database error
```

L'utilisateur doit toujours savoir :

1. ce qui s'est passé ;
2. si son action a été enregistrée ;
3. ce qu'il peut faire ensuite.

---

# 40. UX de l'IA

L'utilisateur doit toujours savoir lorsqu'une opération IA est en cours.

Exemple :

```text
Analyzing job...
```

puis :

```text
Analysis complete
```

Pour les opérations longues :

* afficher une progression lorsque possible ;
* afficher un skeleton ;
* permettre de continuer à naviguer si possible ;
* éviter de bloquer inutilement toute l'interface.

---

# 41. Priorité au MVP

Ne pas essayer de construire immédiatement une énorme plateforme.

Le MVP doit se concentrer sur :

### 1.

Profil utilisateur.

### 2.

Import du CV.

### 3.

Recherche d'offres.

### 4.

Détection des offres expirées.

### 5.

Matching IA.

### 6.

Adaptation du CV.

### 7.

Génération de lettre de motivation.

### 8.

Sauvegarde des offres.

### 9.

Suivi des candidatures.

Le reste pourra être ajouté progressivement.

---

# 42. Principe de développement avec IA

L'application sera développée principalement à l'aide d'agents IA.

L'IA doit donc produire du code :

* compréhensible par un développeur humain ;
* maintenable ;
* testable ;
* modulaire ;
* cohérent ;
* documenté uniquement lorsque nécessaire.

Ne jamais générer rapidement une énorme quantité de code difficile à maintenir.

Avant d'implémenter une fonctionnalité importante :

1. comprendre l'architecture existante ;
2. identifier les composants/services concernés ;
3. proposer la structure ;
4. implémenter ;
5. vérifier les types ;
6. lancer le lint ;
7. lancer les tests ;
8. corriger les problèmes ;
9. seulement ensuite passer à la fonctionnalité suivante.

---

# 43. Règle fondamentale pour les agents IA

**Ne jamais sacrifier la qualité du code pour aller plus vite.**

Avant d'ajouter une nouvelle abstraction, se demander :

> Est-elle réellement nécessaire ?

Avant de créer un nouveau composant :

> Ce composant possède-t-il une responsabilité claire ?

Avant d'ajouter une dépendance :

> Peut-on résoudre correctement le problème avec les outils déjà présents ?

Avant d'ajouter un état :

> Cette donnée est-elle réellement un état ou peut-elle être dérivée ?

Avant d'utiliser `useEffect` :

> Cette logique peut-elle être réalisée autrement ?

---

# 44. Résultat attendu

À la fin du projet, je dois disposer d'une application web qui me permet de passer de :

```text
Je cherche un emploi
```

à :

```text
Voici les meilleures offres disponibles pour ton profil.
```

Puis :

```text
Voici pourquoi elles correspondent à ton profil.
```

Puis :

```text
Voici ton CV adapté.
```

Puis :

```text
Voici ta lettre de motivation personnalisée.
```

Puis :

```text
Ajoute la candidature à ton suivi.
```

L'objectif final est de transformer la recherche d'emploi en un **workflow largement automatisé, intelligent et mesurable**, tout en gardant l'utilisateur humain dans la boucle pour les décisions importantes.

---

# 45. Règle finale

Construire une application **simple à utiliser mais techniquement propre**.

La priorité est :

```text
UX
>
Fiabilité
>
Lisibilité du code
>
Maintenabilité
>
Automatisation
>
Fonctionnalités secondaires
```

Ne pas chercher à impressionner avec une architecture inutilement complexe.

Construire progressivement un produit réellement utilisable.

Avant chaque implémentation importante, réfléchir à la solution la plus simple, robuste et maintenable.

