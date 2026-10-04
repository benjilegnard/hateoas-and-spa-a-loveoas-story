---
lang: fr
---

# ClubHub, gestion d'un complexe multisport

Un club omnisports (ou un complexe municipal) qui gère ses adhérents, ses salles, son matériel et ses compétitions. Ce thème colle bien à HATEOAS : beaucoup de rôles, beaucoup d'entités qui changent d'état, et des permissions très fines.

## Rôles (base des permissions)

| Rôle | Ce qu'il voit / fait |
|---|---|
| Visiteur | catalogue des activités, inscription |
| Adhérent | réserve un créneau, emprunte du matériel, s'inscrit à un tournoi |
| Coach | gère ses équipes et ses séances, réserve des salles pour ses groupes |
| Gestionnaire de site | salles, équipements, maintenance, valide les réservations |
| Arbitre | saisit et valide les scores |
| Admin | tout, plus la configuration (sports, tarifs, saisons) |

Point important pour la démo : le **même endpoint** renvoie des `_links` et `_templates` différents selon le rôle. Le front ne contient aucun `if (role === 'coach')`.

## Modules fonctionnels

### 1. Gestion des salles et terrains

- Liste des sites > salles > terrains (navigation par `_links`, `_embedded`)
- Caractéristiques : surface, capacité, sports compatibles, horaires d'ouverture
- Fermetures exceptionnelles (travaux, événements)
- **HAL-FORMS** : création d'une salle avec `options` pour les sports compatibles (liste distante via `options.link`), `min/max` sur la capacité
- **Permissions** : seul le gestionnaire a `edit` / `close` / `delete`

### 2. Réservations de créneaux

- Cycle de vie : `DEMANDEE → CONFIRMEE → EN_COURS → TERMINEE`, ou `REFUSEE` / `ANNULEE`
- Les actions possibles dépendent de l'état **et** du rôle :
  - adhérent : `annuler` (seulement plus de 24h avant)
  - gestionnaire : `confirmer`, `refuser`
  - coach : `dupliquer` (créneau récurrent)
- **HAL-FORMS** : formulaire `refuser` avec un champ `motif` obligatoire, formulaire `reserver` où les options de terrain dépendent du sport choisi
- Bonne démo : la règle « annulable jusqu'à 24h avant » vit **uniquement** côté back. Le bouton disparaît tout seul.

### 3. Équipements et matériel

- Inventaire : ballons, raquettes, filets, tapis, chronos, défibrillateurs...
- Cycle de vie : `DISPONIBLE → PRETE → RETOURNEE`, `EN_MAINTENANCE`, `HORS_SERVICE`
- Prêt à un adhérent ou affectation à une salle
- Maintenance : signalement de panne, intervention, contrôle obligatoire (ex : défibrillateur avec date de contrôle)
- **Pagination** : inventaire volumineux avec filtres (catégorie, état, site), liens `first/prev/next/last`
- **HAL-FORMS** : `signaler-panne` (textarea, niveau de gravité en `options`), `retourner` (état constaté)

### 4. Adhérents et licences

- Fiche adhérent, cotisation, certificat médical, licence fédérale
- Cycle de la licence : `BROUILLON → SOUMISE → VALIDEE / REJETEE → EXPIREE`
- **Permissions sur les champs** : le coach voit le nom et la catégorie, pas les infos médicales. Le back ne les envoie simplement pas (et le template n'expose pas les champs).
- **HAL-FORMS** : `regex` sur le numéro de licence, `readOnly` sur la date de naissance après validation

### 5. Équipes et entraînements

- Équipes par sport et catégorie d'âge (U13, Seniors...), effectif en `_embedded`
- Séances d'entraînement liées à une réservation de salle
- Feuille de présence
- **Liens** : `team → players → player → licence`, navigation sans connaître les URLs

### 6. Compétitions et tournois

- Tournoi : inscriptions, poules, tableau final, matchs
- Cycle du match : `PLANIFIE → EN_COURS → TERMINE → VALIDE` (validation par l'arbitre)
- Classements paginés
- **Permissions** : `saisir-score` seulement pour l'arbitre assigné, `contester` pour le capitaine pendant 1h
- **Pagination par curseur** : fil des derniers résultats (« load more »)

### 7. Racine de l'API (découvrabilité)

- `GET /api` renvoie les points d'entrée selon le rôle :
  - visiteur : `activities`, `register`
  - adhérent : + `my-bookings`, `my-loans`, `tournaments`
  - gestionnaire : + `sites`, `equipment`, `maintenance`
- Le menu de l'application Angular est construit **entièrement** à partir de cette racine.

## Correspondance avec le plan du talk

| Partie du talk | Démo ClubHub |
|---|---|
| Découvrabilité | menu construit depuis `GET /api` |
| Routage / `_links` | site → salle → terrain → réservations |
| Pagination | inventaire équipements, classements, fil de résultats (curseur) |
| Permissions | boutons de réservation / prêt / score selon rôle et état |
| HAL-FORMS | formulaires générés : réserver, signaler panne, refuser, créer salle |
| Limites du générique | **planning hebdomadaire des salles** (grille calendrier, drag & drop) et **score live** : UI sur-mesure, le formulaire générique ne suffit plus |

## Scénarios de démo « effet waouh »

1. **Changement de rôle en direct** : on change d'utilisateur (sélecteur dans le header), la même page affiche d'autres boutons et d'autres menus, sans aucun changement de code front.
2. **Règle métier modifiée côté back** : on passe le délai d'annulation de 24h à 48h dans le back, le front s'adapte sans redéploiement.
3. **Nouveau champ dans un formulaire** : on ajoute `niveauGravite` au template `signaler-panne`, le champ apparaît avec sa validation.
4. **Machine à états visible** : un prêt de matériel passe de `PRETE` à `RETOURNEE`, les actions disponibles changent à chaque étape.
5. **Là où ça casse** : le planning des salles, pour montrer honnêtement la limite du générique.

## Périmètre conseillé

Pour une démo « conséquente » mais maîtrisable en live, garder les modules **Salles + Réservations + Équipements**, plus la racine de l'API. Ils couvrent déjà toutes les parties du talk. Les modules Compétitions et Licences peuvent servir de bonus, ou montrer qu'on les ajoute « presque gratuitement » grâce au générique.
