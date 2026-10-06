## Contexte réel du projet

Cette application n'est pas un exercice, un prototype destiné à démontrer des compétences techniques, ni un produit SaaS commercial.

Elle est développée pour répondre à un problème réel que nous rencontrons personnellement dans notre recherche d'emploi.

Le projet est réalisé par deux équipes distinctes :

* une équipe Frontend ;
* une équipe Backend.

Nous sommes nous-mêmes les premiers utilisateurs de l'application.

Aujourd'hui, notre recherche d'emploi nous fait perdre énormément de temps à cause de tâches répétitives :

* parcourir plusieurs plateformes de recherche d'emploi ;
* rechercher manuellement les offres correspondant à notre profil ;
* tomber sur des offres déjà expirées ;
* analyser les exigences de chaque offre ;
* déterminer si notre profil correspond réellement au poste ;
* adapter notre CV à chaque offre ;
* rédiger une lettre de motivation ;
* remplir plusieurs fois des informations similaires dans différents formulaires ;
* suivre les candidatures envoyées ;
* retrouver les offres intéressantes parmi toutes celles consultées.

### Objectif principal

L'objectif n'est pas simplement de créer une interface permettant de rechercher des offres d'emploi.

Nous voulons construire un **assistant intelligent capable d'automatiser une grande partie de notre processus de recherche d'emploi et de candidature**.

L'application doit prendre en charge autant que possible les tâches répétitives et à faible valeur ajoutée afin que nous puissions consacrer notre temps aux tâches nécessitant réellement une intervention humaine.

Le principe général est :

> **L'application cherche, analyse, prépare et automatise. L'utilisateur intervient lorsqu'une décision humaine est réellement nécessaire.**

### Automatisation attendue

L'application doit notamment pouvoir :

1. **Rechercher les offres**

   * parcourir les sources de recherche d'emploi pertinentes ;
   * identifier les nouvelles offres ;
   * éviter les doublons ;
   * détecter les offres expirées lorsque cela est possible ;
   * filtrer les offres selon le profil et les préférences de l'utilisateur.

2. **Analyser les offres**

   * extraire les compétences demandées ;
   * identifier les années d'expérience ;
   * analyser les technologies ;
   * identifier les contraintes importantes ;
   * comparer l'offre avec le profil de l'utilisateur ;
   * calculer un score de correspondance suffisamment fiable ;
   * expliquer pourquoi une offre correspond ou non au profil.

3. **Préparer la candidature**

   * sélectionner le CV le plus approprié ;
   * adapter le CV à l'offre ;
   * générer une lettre de motivation lorsque cela est pertinent ;
   * préparer les réponses aux questions connues ;
   * préremplir les informations disponibles ;
   * identifier clairement les informations que l'application ne peut pas déterminer.

4. **Automatiser la candidature lorsque c'est possible**

L'application peut soumettre automatiquement une candidature uniquement lorsque les conditions nécessaires sont réunies.

Un score de matching élevé ne suffit pas à lui seul.

Il faut distinguer :

* **Match Score** : degré de correspondance entre le profil et l'offre ;
* **Application Readiness** : degré de préparation de la candidature.

Par exemple :

* Match = 100 % + Readiness = 100 % → candidature potentiellement automatisable ;
* Match = 100 % + Readiness = 70 % → intervention humaine nécessaire ;
* Match = 85 % → candidature préparée mais jamais envoyée automatiquement.

Une candidature ne doit jamais être envoyée automatiquement si elle nécessite une information personnelle inconnue, une réponse subjective, une déclaration légale, une information sensible non confirmée, un document manquant, une interaction CAPTCHA, une authentification manuelle ou toute autre action nécessitant explicitement l'utilisateur.

Lorsque l'automatisation n'est pas possible, l'application doit préparer au maximum la candidature puis laisser l'utilisateur effectuer l'action finale.

### Principe Human-in-the-loop

L'objectif n'est pas de supprimer complètement l'utilisateur du processus.

L'objectif est de supprimer **le maximum de travail répétitif** tout en conservant l'utilisateur pour les décisions qui nécessitent son jugement.

Le workflow idéal est donc :

**Recherche → Filtrage → Analyse → Matching → Préparation → Vérification → Candidature**

avec une intervention humaine uniquement lorsque celle-ci est nécessaire.

### Philosophie du projet

Nous ne cherchons pas à construire une application impressionnante simplement pour démontrer des capacités techniques.

Nous cherchons à construire un outil que nous utiliserons réellement dans notre quotidien.

Chaque fonctionnalité doit donc être évaluée selon une question simple :

> **Cette fonctionnalité nous fait-elle réellement gagner du temps dans notre recherche d'emploi ou dans nos candidatures ?**

Si une tâche peut être automatisée de manière fiable, elle doit l'être.

Si elle ne peut pas être automatisée de manière fiable, l'application doit au minimum la préparer afin de réduire au maximum le travail restant à effectuer manuellement.

### Contraintes du projet

L'application est destinée principalement à notre usage interne.

Elle pourra éventuellement être partagée avec quelques amis ou collègues confrontés au même problème, mais elle n'a pas d'objectif commercial.

Il n'est donc pas nécessaire de construire une infrastructure surdimensionnée pour supporter des milliers ou des millions d'utilisateurs.

En revanche, il s'agit d'une **véritable application de productivité que nous allons utiliser**, et non d'un simple prototype.

Les priorités sont donc :

* automatisation ;
* gain de temps ;
* fiabilité ;
* simplicité ;
* maintenabilité ;
* bonne expérience utilisateur ;
* coût raisonnable ;
* collaboration efficace entre les équipes Frontend et Backend.

La solution doit être suffisamment robuste pour être utilisée quotidiennement, tout en évitant les complexités qui ne répondent pas à un besoin réel.
