---
lang: fr
---

# HATEOAS & ANGULAR, a LOVE(OAS) story.

Une conférence sur les avantages d'HATEOAS côté front. Principalement pour présenter des utilitaires front et comment réconcilier les deux états, back et front.

Slides visibles ici : <https://benjilegnard.github.io/hateoas-and-spa-a-loveoas-story/>

## Abstract

```markdown
« HATEOAS ». Le mot qui fait fuir les devs front en réunion d'archi, juste après « microservices » et « on va tout réécrire (en Rust) ».

Pourtant, derrière cet acronyme imprononçable se cache une idée romantique: et si le backend arrêtait de nous mentir, et nous disait enfin comment l'utiliser ?

Plus de boutons grisés codés en dur, finies les permissions dupliquées des deux côtés, plus de « attends, c'est quoi l'URL de la page suivante déjà ? ».

Dans ce talk, on va (ré)concilier HATEOAS et Angular.
On verra ensemble pourquoi cette relation a longtemps été compliquée ( qui gère l'état ? le front ? le back ? les deux, en se disputant ? ) 
et comment, à coups de signals, de resource() et d'un poil de discipline, on peut transformer ce mariage de raison en véritable histoire d'amour.

Découvrabilité, navigation, pagination, formulaires génériques, permissions granulaires : vous découvrirez, démo à l'appui, ce que HATEOAS apporte vraiment à une SPA...
et surtout quand il vaut mieux passer son chemin.

Spoiler: à la fin, votre back vous dira « je t'aime » en JSON. Et vous, vous saurez quoi en faire.
```


## Titres alternatifs
- a LOVEAS/HATEOAS relationship
- HATEOAS, démystifié pour les devs front.
- une solution à deux états (nan, trop politique)
- HATEOAS et SPA sont dans un bateau, qui tombe à l'eau ? ⛵

---

__Plan__ :

## Introduction

- Votre speaker du jour (moi)
- Ice breaker
  - Qui a déjà fait ou développé dans des projets avec API REST ici ?
  - Qui s'est déjà pris la tête sur des API RESTs ?
- REST c'est quoi ?
  - version troll
  - version roy fielding
  - version réèlle
- Notre Casting, Alice et Bernard

## Chapitre 0: la rencontre
- REST & HATEOAS c'est quoi
- une SPA c'est quoi ?
- REST, c'est quoi ?
- maturité des APIs rest

### Avantages et features de hateoas par rapport à du REST standard

- découvrabilité, liste de services/resources à la racine
- pagination et navigation standardisées
- gestion des permissions granulaires (qui peut afficher quel champ/faire quelle action ?)
- source unique de vérité (=> le back)
- formulaires génériques / dynamiques

### Oui mais, on gère l'état côté front

- il y a plusieurs types d'état (serveur, client, statique)
- ou doit on mettre l'état ? (query params ? store global?)
- les solutions actuelles

### Dans quel état j'ère ? (réconcilions tout ça)

L'idée clé : laisser le serveur être la source de vérité de l'état *serveur*, et
n'utiliser le front que pour ce qui le concerne vraiment (état UI, navigation).
On regarde, feature par feature, comment Angular moderne (signals, `resource()`,
`httpResource`) s'y prête naturellement.

### features de routage / fetching de données ("_links")

- suivre les `_links` plutôt que de hard-coder les URLs côté front
- `resource()` / `httpResource()` : un signal d'URL qui re-fetch tout seul
- naviguer de ressource en ressource sans connaître la structure de l'API à l'avance
- gestion du cache et de l'invalidation : le lien comme clé naturelle
- garder les routes Angular pour l'état UI, les `_links` pour l'état serveur

### features de pagination / navigation

- `first` / `prev` / `next` / `last` fournis par le back => boutons pilotés par les liens
- plus de calcul d'offset/limit côté front, on suit juste le lien suivant
- pagination par curseur « gratuite » (le back décide, le front exécute)
- état de pagination dans la query string vs dans un store : qui gagne ?
- liste infinie / "load more" reconstruite à partir des `_links`

### features de permissions

- afficher/masquer une action selon la présence d'un lien `_links` ou `_templates`
- boutons "Éditer / Supprimer / Valider" pilotés par ce que le back autorise vraiment
- fini les permissions dupliquées (et désynchronisées) des deux côtés
- une pipe `hasLink` pour rendre tout ça déclaratif dans le template
- sécurité: le front *montre*, le back *décide* (le lien n'est qu'un indice d'UI)

### features de formulaires (HAL-FORMS)

- décrire un formulaire à partir de la ressource (champs, types, contraintes)
- réutiliser les `_templates` (HAL-FORMS) pour générer des ~~Reactive Forms~~ signal-forms dynamiquement
- validation pilotée par le back (required, regex, min/max) => plus de duplication de la validation.
- limites: champs custom, UX fine, widgets métier => là où le générique craque

## Démo / overview du code

- back Spring Boot HATEOAS minimaliste (ou mock) qui expose `_links` / `_actions`
- front Angular en signals + `resource()`, sans store global au début
- montrer la même feature codée « à l'ancienne » vs « pilotée par les liens »
- introduire un store (ngrx-hateoas / SignalStore) seulement quand ça devient nécessaire

## Conclusion

### Avantages

- standardisation des échanges
- découvrabilité: l'API se documente elle-même, le front explore les `_links`
- source unique de vérité: le back décide, le front exécute (permissions, navigation)
- moins de duplication: permissions, pagination, validation ne vivent plus en double
- formulaires et navigation génériques: on code une fois, ça marche partout
- couplage faible aux URLs: le back peut bouger ses routes sans casser le front
- Angular moderne (signals + `resource()` + ngrx-hateoas) rend cette relation vivable

### Inconvénients / quand ne pas utiliser

- nécéssite une certaine échelle nombre d'APIs / entités à gérer.
- sortir du générique: dès que l'UX devient trop spécifique.
- verbosité / poids des payloads (`_links` partout)
- courbe d'apprentissage et culture d'équipe (back ET front doivent jouer le jeu)
- couplage fort à un back non-discipliné: si l'API triche, tout s'écroule
- performance / first paint : attention aux allers-retours pour « découvrir » l'API
- pas adapté aux apps très offline-first ou très optimistes côté UI

### Pour conclure

- HATEOAS n'est pas une religion : c'est un curseur entre « back source de vérité », « API orientées métier » et « front autonome »
- Angular moderne (signals + resource + ngrx-hateoas) peuvent rendre enfin cette relation vivable
- à adopter pour le générique et le piloté-par-permissions, à éviter pour le sur-mesure
- suivre les liens, pas les URLs; afficher ce que le back autorise
- on passe de HATEOAS uniquement au niveau « client d'API » à HATEOAS au niveau de la gestion d'état.

---

## Sources
- essai de roy fielding sur REST: <https://ics.uci.edu/~fielding/pubs/dissertation/>
- specs/normes : 
  - HAL : <https://stateless.co/hal_specification.html>
  - HAL-FORMS : <http://rwcbook.com/hal-forms/>
- restguide : <https://www.restguide.info/hateoas>
- libs front :
  - librairie ngrx-hateoas : <https://angular-architects.github.io/ngrx-hateoas/>
  - ngx-hateoas-client : <https://github.com/lagoshny/ngx-hateoas-client#ngxhateoasclient>
- implémentations côté back.
  - java/spring-boot : <https://docs.spring.io/spring-hateoas/docs/current/reference/html/>
  - node.js : <https://www.npmjs.com/package/hal>
  - C#/dotnet : <https://github.com/danielmurrmann/Fancy.ResourceLinker>
- chaque ligne de code est de la dette technique : <https://x.com/matteocollina/status/2072762093346922907>
- comics / conversations inspirées de [XKCD](https://xkcd.com)
- police XKCD sous licence CC BY-NC 3.0 récupérée de <https://github.com/ipython/xkcd-font>

## Feedbacks

- enlever la partie "gestion d'erreurs" pour gagner du temps
- parler de ngrx-hateoas
- rappeler plus le thème du sport, améliorer les dialogues au démarrage de chaque partie
- différentier les personnages cheveux/chapeau
- ajouter l'image de chaque lors du kickoff initial

