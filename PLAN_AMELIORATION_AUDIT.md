# Plan d'amélioration de l'audit

## Objectif
Ce document transforme l'audit de sécurité, de base de données, de permissions et de performance en plan d'action concret.

Chaque tâche explique :
- ce qu'il faut changer,
- pourquoi c'est nécessaire,
- quel risque elle réduit,
- et dans quel ordre l'exécuter.

## Résumé exécutif
L'application est globalement bien structurée, avec une base Supabase/RLS correcte et une séparation serveur/client déjà sérieuse.

Les priorités réelles sont :
1. bloquer les URLs utilisateur non sûres sur les pages publiques,
2. durcir les redirections d'authentification,
3. imposer les invariants métier au niveau SQL,
4. préparer une vraie révocation/suspension de compte,
5. ajouter une meilleure hygiène de stockage et de logs.

## Priorité critique

### 1) Bloquer les liens non sûrs dans les profils publics
**Pourquoi :** les URLs saisies par un utilisateur sont réutilisées dans les pages publiques. Sans filtrage strict, elles peuvent devenir un vecteur de phishing ou de XSS stockée si un schéma dangereux ou une URL mal formée est acceptée.

**Ce qu'il faut faire :**
- valider et normaliser les URLs côté serveur avant de les enregistrer,
- n'autoriser que `https:` pour les liens visibles publiquement,
- refuser les schémas non web comme `javascript:`, `data:` ou `file:`,
- appliquer exactement la même règle à tous les points d'entrée et de rendu.

**Impact attendu :** empêche l'exécution de contenus malveillants depuis une page de confiance et limite les liens trompeurs sur les profils publics.

### 2) Supprimer les redirections dépendantes des headers non verrouillés
**Pourquoi :** construire l'URL de confirmation à partir des headers de la requête peut devenir fragile derrière un proxy ou un host mal configuré.

**Ce qu'il faut faire :**
- utiliser une URL de base explicite depuis la configuration,
- ne garder les headers qu'en secours contrôlé,
- vérifier `next` avec une allowlist stricte de chemins internes.

**Impact attendu :** réduit les risques de redirection vers un domaine externe ou d'ouverture de lien manipulé.

## Priorité importante

### 3) Imposer l'unicité du CV par utilisateur au niveau base
**Pourquoi :** le code suppose un seul CV par compte, mais la base ne le garantit pas assez explicitement dans l'état actuel de l'audit.

**Ce qu'il faut faire :**
- ajouter une contrainte unique sur `cvs.user_id` si l'invariant métier reste "un CV = un utilisateur",
- documenter cette règle dans la migration,
- vérifier que les requêtes applicatives restent cohérentes avec cette règle.

**Impact attendu :** évite les doublons, les effets de bord en lecture et les bugs sur les pages `maybeSingle()`.

### 4) Ajouter un vrai statut de révocation / suspension
**Pourquoi :** aujourd'hui, retirer l'accès d'un membre repose surtout sur les rôles et les redirects. Ce n'est pas suffisant pour une exploitation entreprise.

**Ce qu'il faut faire :**
- ajouter un champ de statut de compte (`active`, `suspended`, `revoked`, éventuellement `deleted_at`),
- bloquer les routes privées pour les comptes révoqués,
- bloquer les writes côté serveur,
- prévoir la désactivation des sessions si nécessaire.

**Impact attendu :** permet de couper proprement l'accès d'un utilisateur sans bricolage manuel.

### 5) Renforcer le stockage d'images
**Pourquoi :** l'upload accepte des fichiers valides côté MIME déclaré, mais la défense reste légère face au spoofing ou aux médias non souhaités.

**Ce qu'il faut faire :**
- vérifier le type réel du fichier côté serveur autant que possible,
- limiter davantage la taille et les formats autorisés si le besoin métier le permet,
- prévoir la suppression des anciens fichiers lors d'un remplacement,
- surveiller les URL publiques générées.

**Impact attendu :** réduit les risques de contenu piégé, d'accumulation d'orphelins et d'abus de stockage.

## Priorité moyenne

### 6) Ajouter des logs d'audit sur les actions sensibles
**Pourquoi :** sans journal d'événements, il est difficile de comprendre qui a changé un profil, un rôle ou un contenu public.

**Ce qu'il faut faire :**
- tracer les changements de CV,
- tracer les changements de plan / owner / visibilité,
- conserver l'historique des actions administratives.

**Impact attendu :** améliore la traçabilité, le diagnostic et la réponse incident.

### 7) Réduire les requêtes redondantes
**Pourquoi :** certaines pages font plusieurs lectures Supabase pour le même contexte.

**Ce qu'il faut faire :**
- mutualiser les données déjà chargées,
- éviter les double-fetch inutiles sur les pages publiques,
- limiter les appels globaux dans le layout.

**Impact attendu :** meilleure latence et moins de coût serveur / base.

### 8) Standardiser la validation des données utilisateur
**Pourquoi :** la validation existe, mais elle est dispersée entre actions, composants et vues.

**Ce qu'il faut faire :**
- centraliser la normalisation des URLs, textes et JSONB,
- réutiliser les mêmes règles côté builder, actions serveur et affichage,
- éviter les validations divergentes.

**Impact attendu :** moins de dette technique et moins d'écarts fonctionnels entre écriture et lecture.

## Priorité faible

### 9) Préparer une séparation plus nette des responsabilités
**Pourquoi :** le projet reste lisible, mais la logique métier est encore répartie entre plusieurs couches proches.

**Ce qu'il faut faire :**
- isoler la normalisation métier,
- séparer les accès data, les règles de droits et le rendu,
- extraire quelques services ou helpers partagés.

**Impact attendu :** améliore la maintenabilité et facilite les futures évolutions.

### 10) Préparer une vraie stratégie de performance à moyen terme
**Pourquoi :** le code est correct pour un trafic modéré, mais certains points ne passeront pas bien à grande échelle sans optimisation.

**Ce qu'il faut faire :**
- ajouter la pagination là où les listes grandissent,
- revoir le cache sur les pages très fréquentées,
- surveiller le poids du bundle et des composants client,
- vérifier les images et médias lourds.

**Impact attendu :** meilleure tenue sous charge et meilleure expérience mobile.

## Ordre d'exécution recommandé
1. Sécuriser les liens publics.
2. Verrouiller les redirections d'authentification.
3. Ajouter la contrainte d'unicité sur le CV.
4. Implémenter la révocation / suspension de compte.
5. Renforcer les uploads et la gestion des fichiers orphelins.
6. Ajouter les logs d'audit.
7. Réduire les requêtes redondantes.
8. Centraliser la validation des données.
9. Nettoyer et modulariser la logique métier.
10. Préparer les optimisations de charge et de bundle.

## Ce que je ferais en premier
Si l'objectif est de mettre l'application en état production le plus vite possible, je commencerais par :
- la validation stricte des URLs publiques,
- l'allowlist des redirections,
- la contrainte SQL d'unicité,
- puis la révocation/suspension.

Ces 4 points traitent à la fois la sécurité, la logique métier et le risque d'exploitation.

## Remarques techniques
- La base Supabase/RLS actuelle est une bonne fondation.
- Le plus gros risque ne vient pas d'un gros trou dans les policies, mais d'une validation inégale des données affichées publiquement.
- Le système gagnera en robustesse si les règles critiques sont imposées au niveau base et recopiées en défense en profondeur côté serveur.

## Conclusion
Le projet n'est pas "cassé", mais il n'est pas encore au niveau d'une production entreprise sur trois points : validation des liens, gouvernance des accès, et invariants de base.

La bonne stratégie est donc de corriger d'abord les risques de sécurité, puis de consolider les règles métier dans la base, puis seulement d'optimiser l'architecture et les performances.
