---
lang: fr
---

# HATEOAS + SPA, a LOVE(OAS) story 💘

*Alice (back, Spring Boot) et John (front, Angular) construisent **ClubHub**, l'app de gestion d'un complexe multisport. Une relation compliquée, en 5 disputes.*

Périmètre de démo : **racine de l'API + Salles + Réservations + Équipements**. Compétitions et Licences restent en bonus (cf `demos/ffats/README.md`).

Structure : un prologue, 5 chapitres (une dispute chacun), un épilogue.

---

## Prologue : La rencontre (intro)

- **La scène** : réunion d'archi pour ClubHub. Alice prononce le mot « HATEOAS ». John cherche la sortie de secours.
- **Une seule slide théorique** : le modèle de maturité de Richardson.
  - Alice : « Notre API est RESTful. »
  - John : « Niveau 2, à tout casser. »
- HATEOAS en une phrase : le serveur dit au client ce qu'il peut faire ensuite.
- **Le contrat du couple** : HAL (`_links`, `_embedded`), HAL-FORMS (`_templates`) et ProblemDetails pour les erreurs.
- **Présentation de ClubHub** : 6 rôles (visiteur, adhérent, coach, gestionnaire, arbitre, admin), des salles, des réservations et du matériel.
- Statut de la relation : *« C'est compliqué »*.

---

## Chapitre 1 : Premier rendez-vous, liens, découvrabilité et `_embedded`

- **Le bug** : Alice réorganise l'API, et `/api/terrains/{id}` devient `/api/sites/{id}/salles/{id}/terrains/{id}`. Vendredi, 17h. Les URLs codées en dur de John cassent en prod.
- **La dispute** :
  - John : « Tu as changé l'URL ! »
  - Alice : « Tu n'étais pas censé la connaître. »
- **Le fix** :
  - `GET /api` renvoie les points d'entrée selon le rôle, et le menu Angular est construit **entièrement** à partir de cette racine
  - on navigue site → salle → terrain → réservations en suivant les `_links`
  - `httpResource()` : un signal d'URL qui re-fetch tout seul
  - les routes Angular gardent l'état UI, les `_links` portent l'état serveur
- **Démo avant/après** : le détail d'une salle, avec une URL en dur puis avec un lien suivi.
- **La réplique (John a raison)** : « Pour afficher une salle et ses terrains, il me faut 1 + N appels. »
- **Le fix rapide : `_embedded`**
  - la salle embarque ses terrains dans `_embedded`, ce qui fait un seul appel
  - chaque ressource embarquée garde ses propres `_links`, avec ses propres permissions
  - le front lit `_embedded` s'il est présent, et sinon il suit le lien (même code)
- **La contre-réplique** : « Qui décide de ce qu'on embarque ? »
  - si Alice embarque tout, les payloads deviennent lourds
  - si elle n'embarque rien, on revient aux N appels
  - c'est un choix de conception de l'API, à faire à deux
  - en complément, le cache avec le lien comme clé naturelle

---

## Chapitre 2 : On emménage ensemble, la pagination

- **Le bug** : le fil des derniers résultats devient trop gros, et Alice passe de l'offset au curseur. Le `page * size` de John affiche des doublons, et « page 3 sur 12 » ne veut plus rien dire.
- **La dispute** :
  - John : « Tu changes le contrat sans prévenir ! »
  - Alice : « Le contrat, c'était `next`. C'est toi qui as fait le calcul. »
- **Le fix** :
  - l'inventaire des équipements a des boutons `first` / `prev` / `next` / `last` pilotés par les liens
  - le fil des résultats a un « load more » reconstruit à partir de `next` (curseur)
  - le front ne calcule plus d'offset : le back décide, le front exécute
- **Démo avant/après** : l'inventaire des équipements, puis le fil des résultats.
- **La réplique** : le gestionnaire veut « page 7, filtrée sur les défibrillateurs du site Nord », dans une URL qu'il peut envoyer à un collègue.
  - où vit l'état de pagination et des filtres : query string ou store ?
  - John veut la query string, Alice dit que le lien suffit
  - *teaser du chapitre 5*

---

## Chapitre 3 : Crise de confiance, les permissions

- **Le bug** : John code `if (role === 'ADHERENT' && dateCreneau - now > 24h)` pour afficher « Annuler ». Le club décide de passer le délai à 48h.
  - Alice change la règle, mais le front de John affiche toujours le bouton
  - l'adhérent clique et prend une erreur
  - en plus, l'horloge du navigateur n'est pas celle du serveur
- **La dispute** :
  - John : « Qui t'a donné le droit de changer les règles ? »
  - Alice : « Qui t'a donné le droit de les copier ? »
- **Le fix** :
  - l'action est affichée seulement si le `_link` ou le `_template` est présent
  - les actions dépendent de l'état **et** du rôle : `annuler` (adhérent), `confirmer` / `refuser` (gestionnaire), `dupliquer` (coach)
  - côté template, c'est déclaratif : `@if (booking().can('annuler'))` ou une directive d'attribut
  - aucun `if (role === …)` dans le front
- **Démos « effet waouh »** :
  - on change de rôle en direct dans le header, et la même page montre d'autres boutons et d'autres menus
  - on passe de 24h à 48h dans le back, et le front s'adapte sans redéploiement
  - un prêt de matériel passe de `PRETE` à `RETOURNEE`, et les actions changent à chaque étape
- **La réplique (Alice a tort cette fois)** : côté back, le code qui génère le lien et le code qui protège l'endpoint divergent. Le lien dit oui, l'endpoint répond 403.
  - la duplication a juste déménagé dans le back
  - leçon : une seule fonction de policy, utilisée par le lien et par le contrôle
  - rappel sécurité : le front *montre*, le back *décide* (un bouton masqué n'est pas une protection)
  - transition : et cette 403, elle ressemble à quoi ?

---

## Chapitre 4 : Présentation aux beaux-parents, formulaires et erreurs

- **Transition** : au chapitre 3, le `_template` est présent, donc l'action existe. Ici, le `_template` décrit ses champs, donc le formulaire existe.
- **Le bug**, dans les deux sens :
  - Alice rend le `motif` obligatoire dans le formulaire « refuser », mais celui de John l'ignore : des 400 en prod
  - en plus, chaque contrôleur renvoie son propre format d'erreur (un `{ "message": … }` ici, un `{ "error": … }` là), et John parse au cas par cas
- **La dispute** :
  - « Ta validation est fausse. »
  - « Non, c'est la tienne. »
  - la vérité : il y a deux copies, donc une des deux a toujours tort
- **Le fix, partie 1 : HAL-FORMS**
  - les signal forms sont générés à partir des `_templates` : `refuser`, `signaler-panne`, `creer-salle`
  - la validation vient du back : `required`, `regex`, `min` / `max` sur la capacité
  - les `options` sont statiques (gravité de la panne) ou distantes via `options.link` (sports compatibles)
- **Le fix, partie 2 : les erreurs avec ProblemDetails (RFC 9457)**
  - Spring : la classe `ProblemDetail` et `spring.mvc.problemdetails.enabled=true`
  - un seul format, `application/problem+json`, avec `type`, `title`, `status`, `detail`, `instance`
  - attention : par défaut, Spring ne met pas les erreurs par champ dans la réponse. Alice les ajoute via une extension (`errors: [{ field, message }]`)
  - côté front : un seul intercepteur, et les erreurs par champ sont mappées sur les champs du signal form généré
  - la 403 du chapitre 3 et la 409 du chapitre 5 utilisent le même format
- **Démo « effet waouh »** : Alice ajoute `niveauGravite` au template `signaler-panne`, et le champ apparaît avec sa validation. On soumet une valeur que seul le back refuse, et l'erreur s'affiche sous le bon champ.
- **La réplique (les beaux-parents débarquent)** : la designer veut le **planning hebdomadaire des salles**, avec une grille calendrier et du drag & drop.
  - Alice : « J'ajoute `widget: 'calendar-grid'` dans le template. »
  - le back choisit alors les widgets UI : c'est la ligne rouge
  - démo honnête : ici, le générique craque, et John code du sur-mesure

---

## Chapitre 5 : Thérapie de couple, à qui appartient l'état ?

- **Le bug** : John met les réservations en cache dans un store global. Le gestionnaire confirme une réservation dans un autre onglet. L'adhérent voit encore « Annuler » (avec des données périmées *et des liens périmés*), clique, et reçoit une **409 Conflict** au format ProblemDetails.
- **La dispute** :
  - Alice : « C'est moi la source de vérité. »
  - John : « Alors pourquoi mon bouton met 400 ms à réagir ? Je veux de l'UI optimiste. »
- **La séance de thérapie** :
  - les types d'état : serveur, client/UI, statique
  - l'état serveur appartient à Alice, avec ses liens
  - l'état UI appartient à John (routes, filtres, sélection, query params)
  - les solutions actuelles et leurs limites
- **Le fix** :
  - au départ, signals + `httpResource()`, sans store
  - ngrx-hateoas / SignalStore arrive seulement quand le besoin apparaît
  - sur une 409, on recharge le lien `self` : les nouvelles actions arrivent avec les nouvelles données
  - réponse au teaser du chapitre 2 : où vit l'état de pagination et des filtres
- **Démo** : ajout de ngrx-hateoas dans ClubHub. Bonus : on branche le module Compétitions « presque gratuitement ».
- **La réplique** : pour le score live et l'UI optimiste, Alice et John sont d'accord : HATEOAS n'est pas le bon outil.

---

## Épilogue : Mariage ou rupture ? (conclusion)

- **Le contrat de mariage** : HAL + HAL-FORMS + ProblemDetails, que les deux équipes acceptent.
- **3 avantages, pas plus** :
  - une seule source de vérité (permissions, navigation, validation, erreurs)
  - moins de duplication entre front et back
  - un couplage faible aux URLs
- **Quand passer son chemin** : on reprend les répliques des chapitres 1 à 5.
  - allers-retours, ou payloads lourds avec `_embedded` (ch. 1)
  - « aller à la page N » et URLs partageables (ch. 2)
  - policy dupliquée côté back (ch. 3)
  - UX sur-mesure, comme le planning des salles (ch. 4)
  - UI optimiste et temps réel, comme le score live (ch. 5)
  - et en plus : il faut une certaine échelle et un back discipliné
- **Message final** :
  - HATEOAS n'est pas une religion, c'est un curseur
  - suivre les liens, pas les URLs
  - afficher ce que le back autorise
  - on passe de HATEOAS « client d'API » à HATEOAS « gestion d'état »
- **Dernière slide** : Alice envoie `{"_links": {"self": …, "love": …}}`, et John sait quoi en faire.

---

## Hors scope (à annoncer à l'oral)

- les tests de contrat front/back
- le versioning d'API

## Fil conducteur visuel

- **Chaque bug** : un `sequenceDiagram` mermaid Alice ↔ John.
- **Chaque dispute** : une capture Slack/Teams.
- **Gags récurrents** :
  - le déploiement du vendredi 17h
  - le badge « statut de la relation », mis à jour à chaque chapitre
  - les messages de commit passifs-agressifs
