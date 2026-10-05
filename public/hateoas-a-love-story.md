# HATEOAS+SPA,<br/> a love story 💘


## Introduction
- Benjamin Legrand / `@benjilegnard`
- Tech Lead @ __onepoint__<!-- .element class="poppins"-->
- Expert front, mais gros bagage ☕Java™<!-- .element class="fragment"-->
- (🅰️ngular/🍃spring-boot)<!-- .element class="fragment"-->
- Janvier 2026<!-- .element class="fragment"-->
Notes:
- présentation speaker
- qui connait déjà HATEOAS?
- 
- avant d'aborder HATEOAS, il faut qu'on parle de REST


### Ice Breaker: REST ?
 🧊 🪚
Notes:
- Qui a déjà développé ou utilisé des API's REST ici ?
- Qui s'est dèjà cassé les dents à expliquer ce que c'était.
- Ou dans un retour PR on vous a dit "C'est pas très RESTful ça"


### REST c'est quoi ?
> Une API REST, c'est une API dont le lead développeur a dit « c'est une API REST ».

<div class="trollface fragment"></div>

Notes:
- Une API REST, c'est une API dont le développeur a dit « c'est une API REST » en réunion, et personne n'a osé le contredire.
- Voilà, fin de la définition pratique utilisée par 95 % de l'industrie.
- désolé, allez un peu plus sérieusement


### Plus sérieusement

- On renvoie du `JSON` sur du protocole `HTTP`
- Noms au pluriel dans tes URLs (`/users`, pas `/getUsers`)
- `GET` pour lire et `POST`... pour tout le reste
- Erreurs en 200 OK avec un corps de réponse :

```json
{
    "success": false,
    "error": "ça a planté"
}
```
<!-- .element class="fragment"-->

<div class="trollface fragment"></div>

Notes:
-  (/users, surtout pas /getUsers, on n'est pas des sauvages)
- Tu renvoies un 200 avec {"success": false, "error": "ça a planté"} dans le corps, parce que les codes HTTP c'est pour les faibles.
- Félicitations, si vous faites ça, ton LinkedIn peut désormais afficher « Expert REST ».
- Le titre il dit plus sérieusement, pas que c'est complètement sérieux.


### Sérieusement!

**RE**presentational **S**tate **T**ransfer
<br/>
*Roy Fielding*, thèse de doctorat (2000)
<br/>
<https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm>
<img src="qrcodes/roy-fielding.png" class="qrcode" />
Notes:
- soit en français « transfert d'état de représentation ».
- Le terme a été défini par Roy Fielding en 2000 dans sa thèse de doctorat, où il décrivait le style d'architecture qui sous-tend le Web.
- il passe depuis une partie de sa vie à expliquer que ce que tout le monde appelle REST n'en est pas


#### Representational (représentation)
```mermaid
flowchart LR
  R(("/users/42<br/>(la ressource)"))
  R -- "Accept: application/json" --> J["{ id: 42, name: 'Ada' }"]
  R -- "Accept: text/html" --> H["#lt;h1#gt;Ada#lt;/h1#gt;"]
  R -- "Accept: application/xml" --> X["#lt;user id='42'#gt;…#lt;/user#gt;"]
```
Notes:
- le client ne manipule jamais directement une ressource (un utilisateur, une commande, un article), mais une représentation de celle-ci à un instant donné. 
- La même ressource peut être représentée en JSON, en XML, en HTML, etc. Le client et le serveur peuvent négocier le format, par exemple via l'en-tête HTTP Accept.
- Ca veut aussi dire que vous n'exposez pas vos entités de base de données directement hein, mais une "représentation de cette donnée"
- Et que vous pouvez avoir des ressources REST, destinées à une page / un écran (BFF)


#### State (état)
```mermaid
sequenceDiagram
  participant C as Client
  participant S as Serveur
  C->>S: GET /users?page=1<br/>Authorization: Bearer abc
  S-->>C: 200 OK (page 1)
  Note over S: rien en mémoire,<br/>pas de session
  C->>S: GET /users?page=2<br/>Authorization: Bearer abc
  S-->>C: 200 OK (page 2)
  Note over C: état de l'application<br/>(page courante, filtres)<br/>= chez le client
```

Notes:
- il s'agit de l'état de la ressource, mais aussi de l'état de l'application côté client.
- Comme les échanges sont sans état (stateless), le serveur ne conserve pas le contexte de la session du client entre deux requêtes : chaque requête contient tout ce qui est nécessaire pour être comprise.


#### Transfer (transfert)
```mermaid
sequenceDiagram
  participant C as Client
  participant S as Serveur
  C->>S: GET /users/42
  S-->>C: 200 OK { name: "Ada" }
  Note left of C: état transféré<br/>serveur → client
  C->>S: PUT /users/42<br/>{ name: "Ada Lovelace" }
  Note right of S: état transféré<br/>client → serveur
  S-->>C: 200 OK { name: "Ada Lovelace" }
```
Notes:
- cet état circule entre client et serveur à travers les représentations échangées. Quand tu fais un GET, le serveur te transfère l'état actuel de la ressource ; quand tu fais un PUT, c'est toi qui transfères un nouvel état au serveur.
- tout ça n'est ni une spec, ni une norme
- c'est un style d'architecture, un ensemble de contraintes


### Bref, Six contraintes
- une séparation client/serveur
- des échanges sans état
- des réponses qui disent si elles sont cachables
- un système en couches (le client ne sait pas s'il parle au vrai serveur ou à un proxy)
- éventuellement du code à la demande (la seule contrainte optionnelle, donc la seule que tout le monde respecte)
- et surtout une __interface uniforme__.
Notes:
- le minimum vital
- des échanges sans état (le serveur ne se souvient pas de toi, comme ton ex),
- un système en couches (le client ne sait pas s'il parle au vrai serveur ou à un proxy)
- gros problème c'est l'interface uniforme


### HATEOAS
Hypermedia As The Engine Of Application **S**tate
- chaque réponse doit contenir les liens vers les actions possibles ensuite.
- Le client ne devrait connaître qu'une URL d'entrée et naviguer comme un humain sur un site web, en cliquant sur des liens.
- Si ton frontend a 47 URLs codées en dur, ton API n'est pas REST, c'est du « RPC sur HTTP avec des URLs jolies »

Notes:
- concept évoqué dès 2000 dans la thèse de fielding
- article de blogs de 2008


### Modèle de maturité de Richardson
```mermaid
  block-beta
    columns 4
    space:3 L3["Niveau 3<br/>HATEOAS"]
    space:2 L2["Niveau 2<br/>Verbes HTTP"]:2
    space:1 L1["Niveau 1<br/>Ressources"]:3
    L0["Niveau 0<br/>Le marais du POX"]:4

    style L3 fill:#e64553,color:#fff
```


#### Niveau 0
```mermaid
  sequenceDiagram
      participant C as Client
      participant S as Serveur
      Note over C,S: un seul endpoint, tout en POST
      C->>S: POST /api {action: "getUser", id: 42}
      S-->>C: 200 OK {name: "Ada"}
      C->>S: POST /api {action: "deleteUser", id: 42}
      S-->>C: 200 OK {error: "interdit"} 🙃
```


#### Niveau 3
```mermaid
  sequenceDiagram
      participant C as Client
      participant S as Serveur
      Note over C,S: la réponse dit quoi faire ensuite
      C->>S: GET /users/42
      S-->>C: 200 OK + _links {self, edit, orders}
      C->>S: PUT (href du lien "edit")
      S-->>C: 200 OK + _links {self, edit, orders}
```


---
## Prologue : La rencontre
- Alice, lead dev back (🍃 Spring Boot)
- Bernard, lead dev front ( 🅰️ Angular)
- Réunion de kickoff du projet ClubHub pour la FFATS

Notes:
- Alice (back, Spring Boot) et John (front, Angular) construisent ClubHub
- TODO


### La scène
```xkcd
A(point): Notre API est RESTful.
B(shrug): Niveau 2, à tout casser.
```
Notes:
- réunion d'archi pour ClubHub
- Alice prononce le mot « HATEOAS », John cherche la sortie de secours
- TODO


### HATEOAS en une phrase
> Le serveur dit au client ce qu'il peut faire ensuite.

Notes:
- TODO


### ClubHub
Un complexe multisport : salles, réservations, matériel.

Notes:
- 6 rôles : visiteur, adhérent, coach, gestionnaire, arbitre, admin
- TODO


### Le contrat du couple
HAL

<img src="images/hal-info-model.svg" />.


### Le contrat du couple (2)

```json [3-6|7-9|10-15]
{
  "statut": "DEMANDEE",
  "_links": {
    "self":      { "href": "/api/reservations/42" },
    "confirmer": { "href": "/api/reservations/42/confirmation" }
  },
  "_embedded": {
    "terrain": { "nom": "Court 3", "_links": { "self": { "href": "..." } } }
  },
  "_templates": {
    "refuser": {
      "method": "POST",
      "properties": [{ "name": "motif", "required": true }]
    }
  }
}
```
Notes:
- HAL : `_links`, `_embedded`
- HAL-FORMS : `_templates`
- ProblemDetails pour les erreurs (chapitre 4)
- TODO


### Statut de la relation
*« C'est compliqué »*

Notes:
- TODO


---
## Chapitre 1 : Premier rendez-vous
Liens, découvrabilité et `_embedded`

Notes:
- statut : premier rendez-vous
- TODO


### Le bug
```mermaid
sequenceDiagram
  participant J as John (Angular)
  participant A as Alice (Spring)
  Note over A: vendredi 17h, refacto des URLs
  A->>A: /api/terrains/{id} devient<br/>/api/sites/{id}/salles/{id}/terrains/{id}
  J->>A: GET /api/terrains/7
  A-->>J: 404 Not Found 💥
```
Notes:
- Alice réorganise l'API, vendredi 17h
- les URLs codées en dur de John cassent en prod
- TODO


### Avant : Angular
```typescript [4-5]
@Injectable({ providedIn: 'root' })
export class TerrainService {
  private http = inject(HttpClient);
  getTerrain(id: number) {
    return this.http.get<Terrain>(`/api/terrains/${id}`);
  }
}
```
Notes:
- une URL en dur, copiée depuis le Swagger
- TODO


### La dispute
```xkcd
B(armsup): Tu as changé l'URL !
A(shrug): Tu n'étais pas censé la connaître.
```
Notes:
- TODO


### Le fix : Spring
```java [1-2|5-8|9]
@GetMapping("/api")
RepresentationModel<?> racine(@AuthenticationPrincipal ClubUser user) {
  var racine = new RepresentationModel<>();
  racine.add(linkTo(RacineController.class).withSelfRel());
  if (user.hasRole("GESTIONNAIRE")) {
    racine.add(linkTo(SiteController.class).withRel("sites"));
    racine.add(linkTo(EquipementController.class).withRel("equipements"));
  }
  return racine;
}
```
Notes:
- `GET /api` renvoie les points d'entrée selon le rôle
- le seul point d'entrée connu du front
- TODO


### Le fix : Angular
```typescript [1-3|5-6]
racine = httpResource<HalResource>(() => '/api');
menu = computed(() => Object.entries(this.racine.value()?._links ?? {})
    .map(([rel, { href }]) => ({ rel, href })));

href = input.required<string>(); // depuis la route
salle = httpResource<Salle>(() => this.href());
```
```html
@for (lien of menu(); track lien.rel) {
  <a routerLink="/explorer" [queryParams]="{ href: lien.href }">
    {{ lien.rel }}
  </a>
}
```
Notes:
- le menu est construit entièrement à partir de la racine
- on navigue site → salle → terrain → réservations en suivant les `_links`
- `httpResource()` : un signal d'URL qui re-fetch tout seul
- les routes Angular gardent l'état UI, les `_links` portent l'état serveur
- TODO


### Démo
Le détail d'une salle : URL en dur, puis lien suivi.

Notes:
- TODO


### La réplique
```xkcd
B(point): Pour afficher une salle et ses terrains,
  il me faut 1 + N appels.
A(facepalm): ...
```
Notes:
- John a raison
- TODO


### Le fix rapide : `_embedded`
```java [3-5|6-9]
@GetMapping("/api/salles/{id}")
RepresentationModel<?> salle(@PathVariable Long id) {
  var terrains = terrainRepository.findBySalle(id).stream()
      .map(terrainAssembler::toModel)
      .toList();
  var salle = salleAssembler.toModel(salleRepository.get(id));
  return HalModelBuilder.halModelOf(salle)
      .embed(terrains, LinkRelation.of("terrains"))
      .build();
}
```
Notes:
- un seul appel, chaque terrain garde ses propres `_links` et permissions
- le front lit `_embedded` s'il est présent, sinon il suit le lien (même code)
- TODO


### La contre-réplique
> Qui décide de ce qu'on embarque ?

Notes:
- tout embarquer : payloads lourds
- rien embarquer : retour aux N appels
- un choix de conception de l'API, à faire à deux
- en complément : le cache, avec le lien comme clé naturelle
- TODO


---
## Chapitre 2 : On emménage ensemble
La pagination

Notes:
- statut : on emménage ensemble
- TODO


### Le bug
```mermaid
sequenceDiagram
  participant J as John (Angular)
  participant A as Alice (Spring)
  Note over A: offset → curseur
  J->>A: GET /api/resultats?page=3&size=20
  A-->>J: 200 OK (paramètre page ignoré)
  Note over J: doublons à l'écran,<br/>« page 3 sur 12 » ???
```
Notes:
- le fil des derniers résultats devient trop gros
- Alice passe de l'offset au curseur
- TODO


### Avant : Angular
```typescript [1-2|4-6]
page = signal(0);
resultats = httpResource(() => `/api/resultats?page=${this.page()}`);

totalPages = computed(() =>
  Math.ceil(this.resultats.value()!.total / 20)
);
```
```html
<span>page {{ page() + 1 }} sur {{ totalPages() }}</span>
```
Notes:
- John calcule lui-même l'offset et le nombre de pages
- TODO


### La dispute
```xkcd
B(armsup): Tu changes le contrat sans prévenir !
A(point): Le contrat, c'était next.
  C'est toi qui as fait le calcul.
```
Notes:
- TODO


### Le fix : Spring
```java [2-3|4]
@GetMapping("/api/equipements")
PagedModel<EntityModel<Equipement>> liste(Pageable pageable) {
  Page<Equipement> page = equipementRepository.findAll(pageable);
  return pagedAssembler.toModel(page, equipementAssembler);
}
```
```json
"_links": { "first": …, "prev": …, "self": …, "next": …, "last": … }
```
Notes:
- `PagedResourcesAssembler` génère `first` / `prev` / `next` / `last`
- pour le fil des résultats : un seul lien `next` qui porte le curseur
- TODO


### Le fix : Angular
```typescript [1-2]
url = signal('/api/equipements');
page = httpResource<HalPage<Equipement>>(() => this.url());
```
```html [1-6|7]
@for (rel of ['first', 'prev', 'next', 'last']; track rel) {
  <button [disabled]="!page.value()?._links[rel]"
          (click)="url.set(page.value()!._links[rel].href)">
    {{ rel }}
  </button>
}
<!-- fil des résultats : « load more » sur _links.next -->
```
Notes:
- le front ne calcule plus d'offset : le back décide, le front exécute
- « load more » : on concatène les éléments à chaque `next`
- TODO


### Démo
L'inventaire des équipements, puis le fil des résultats.

Notes:
- TODO


### La réplique
```text
/equipements?page=7&categorie=defibrillateur&site=nord
```
```xkcd
B(point): Je veux la query string.
A(shrug): Le lien suffit.
```
Notes:
- le gestionnaire veut une URL qu'il peut envoyer à un collègue
- où vit l'état de pagination et des filtres : query string ou store ?
- teaser du chapitre 5
- TODO


---
## Chapitre 3 : Crise de confiance
Les permissions

Notes:
- statut : crise de confiance
- TODO


### Le bug
```mermaid
sequenceDiagram
  participant U as Adhérent
  participant J as John (Angular)
  participant A as Alice (Spring)
  Note over A: délai d'annulation : 24h → 48h
  J->>U: bouton « Annuler » (règle 24h en dur)
  U->>J: clic, à 30h du créneau
  J->>A: POST /api/reservations/42/annulation
  A-->>J: 403 Forbidden 💥
```
Notes:
- le club passe le délai à 48h, Alice change la règle
- le front de John affiche toujours le bouton
- en plus, l'horloge du navigateur n'est pas celle du serveur
- TODO


### Avant : Angular
```html [1-2]
@if (user().role === 'ADHERENT'
     && resa().debut.getTime() - Date.now() > 24 * 3600_000) {
  <button (click)="annuler()">Annuler</button>
}
```
Notes:
- la règle métier est copiée dans le front
- TODO


### La dispute
```xkcd
B(armsup): Qui t'a donné le droit de changer les règles ?
A(point): Qui t'a donné le droit de les copier ?
```
Notes:
- TODO


### Le fix : Spring
```java [6-7|8-9|10-11]
public EntityModel<Reservation> toModel(Reservation resa) {
  var ctrl = methodOn(ReservationController.class);
  var user = currentUser();
  var model = EntityModel.of(resa,
      linkTo(ctrl.get(resa.id())).withSelfRel());
  if (policy.peutAnnuler(user, resa))
    model.add(linkTo(ctrl.annuler(resa.id())).withRel("annuler"));
  if (policy.peutConfirmer(user, resa))
    model.add(linkTo(ctrl.confirmer(resa.id())).withRel("confirmer"));
  if (policy.peutDupliquer(user, resa))
    model.add(linkTo(ctrl.dupliquer(resa.id())).withRel("dupliquer"));
  return model;
}
```
Notes:
- les actions dépendent de l'état **et** du rôle
- `annuler` (adhérent), `confirmer` / `refuser` (gestionnaire), `dupliquer` (coach)
- TODO


### Le fix : Angular
```html
@if (resa().can('annuler')) {
  <button (click)="resa().follow('annuler')">Annuler</button>
}
```
```typescript
can = (rel: string) => rel in this._links;
```
Notes:
- déclaratif : `@if` ou une directive d'attribut
- aucun `if (role === …)` dans le front
- TODO


### Démo
Changer de rôle, changer la règle, faire avancer un prêt.

Notes:
- on change de rôle dans le header : autres boutons, autres menus
- on passe de 24h à 48h dans le back : le front s'adapte sans redéploiement
- un prêt passe de `PRETE` à `RETOURNEE` : les actions changent à chaque étape
- TODO


### La réplique
```java [2|5-6]
// l'assembler
if (resa.debut().isAfter(now().plusHours(48))) model.add(...annuler...);

// le contrôleur
@PreAuthorize("@clock.hoursBefore(#id) > 24")
@PostMapping("/api/reservations/{id}/annulation")
```
```xkcd
B(point): Ton lien dit oui, ton endpoint dit 403.
A(facepalm): ...
```
Notes:
- Alice a tort cette fois : la duplication a juste déménagé dans le back
- TODO


### La leçon
```java [1-4|6|8-9]
@Component("reservationPolicy")
class ReservationPolicy {
  boolean peutAnnuler(User user, Reservation resa) { ... }
}

if (policy.peutAnnuler(user, resa)) model.add(...annuler...);

@PreAuthorize("@reservationPolicy.peutAnnuler(principal, #id)")
@PostMapping("/api/reservations/{id}/annulation")
```
Notes:
- une seule fonction de policy, utilisée par le lien et par le contrôle
- le front *montre*, le back *décide* : un bouton masqué n'est pas une protection
- transition : et cette 403, elle ressemble à quoi ?
- TODO


---
## Chapitre 4 : Présentation aux beaux-parents
Formulaires et erreurs

Notes:
- statut : présentation aux beaux-parents
- ch. 3 : le `_template` est présent, donc l'action existe
- ici : le `_template` décrit ses champs, donc le formulaire existe
- TODO


### Le bug
```mermaid
sequenceDiagram
  participant J as John (Angular)
  participant A as Alice (Spring)
  Note over A: motif obligatoire dans « refuser »
  J->>A: POST /refus {}
  A-->>J: 400 { "message": "motif requis" }
  J->>A: POST /salles { capacite: -3 }
  A-->>J: 400 { "error": "invalid" }
  Note over J: un format par contrôleur 😩
```
Notes:
- le formulaire de John ignore le nouveau champ : des 400 en prod
- chaque contrôleur renvoie son propre format d'erreur
- TODO


### Avant : Angular
```typescript [1-3|5-7]
refusForm = new FormGroup({
  motif: new FormControl(''), // obligatoire ? personne ne m'a prévenu
});

catchError(err =>
  of(err.error.message ?? err.error.error ?? 'Erreur inconnue')
)
```
Notes:
- validation dupliquée (ou oubliée)
- parsing des erreurs au cas par cas
- TODO


### La dispute
```xkcd
A(point): Ta validation est fausse.
B(point): Non, c'est la tienne.
```
Notes:
- la vérité : il y a deux copies, donc une des deux a toujours tort
- TODO


### Le fix : Spring, HAL-FORMS
```java [1-4|6-8]
record Refus(@NotBlank String motif) {}
@PostMapping("/api/reservations/{id}/refus")
ResponseEntity<?> refuser(@PathVariable Long id,
                          @Valid @RequestBody Refus refus)

var ctrl = methodOn(ReservationController.class);
model.add(linkTo(ctrl.get(id)).withSelfRel()
    .andAffordance(afford(ctrl.refuser(id, null))));
```
```json
"_templates": { "refuser": { "method": "POST",
  "properties": [{ "name": "motif", "required": true }] } }
```
Notes:
- Spring HATEOAS génère le template à partir du DTO et de ses annotations de validation
- attention : la première affordance d'un lien s'appelle `default` dans `_templates`
- TODO


### Le fix : Angular, HAL-FORMS
```typescript [1-2|3-8]
model = signal<Record<string, unknown>>({});
refusForm = form(this.model, (path) => {
  for (const p of this.template().properties) {
    if (p.required) required(path[p.name]);
    if (p.regex) pattern(path[p.name], new RegExp(p.regex));
    if (p.min != null) min(path[p.name], p.min);
    if (p.max != null) max(path[p.name], p.max);
  }
});
```
Notes:
- signal forms générés à partir des `_templates` : `refuser`, `signaler-panne`, `creer-salle`
- `options` statiques (gravité de la panne) ou distantes via `options.link` (sports compatibles)
- TODO


### Le fix : Spring, ProblemDetail
```java [1-3|4-7|8]
@ExceptionHandler(MethodArgumentNotValidException.class)
ProblemDetail validation(MethodArgumentNotValidException ex) {
  var problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
  problem.setProperty("errors", ex.getFieldErrors().stream()
      .map(e -> Map.of("field", e.getField(),
                       "message", e.getDefaultMessage()))
      .toList());
  return problem;
}
```
Notes:
- RFC 9457, `spring.mvc.problemdetails.enabled=true`
- un seul format `application/problem+json` : `type`, `title`, `status`, `detail`, `instance`
- par défaut, Spring ne met pas les erreurs par champ dans la réponse : extension `errors`
- la 403 du ch. 3 et la 409 du ch. 5 utilisent le même format
- TODO


### Le fix : Angular, ProblemDetail
```typescript [2|4-5]
export const problemInterceptor: HttpInterceptorFn = (req, next) => {
  const problems = inject(ProblemStore);
  return next(req).pipe(catchError((err: HttpErrorResponse) => {
    problems.set(err.error as ProblemDetail);
    return throwError(() => err.error);
  }));
};
```
```html
<input [field]="refusForm.motif" />
<span>{{ problems.forField('motif') }}</span>
```
Notes:
- un seul intercepteur
- les erreurs par champ sont mappées sur les champs du signal form généré
- TODO : vérifier le nom de la directive signal forms (`[field]` ou `[formField]`) selon la version d'Angular
- TODO


### Démo
Ajouter `niveauGravite` au template `signaler-panne`.

Notes:
- le champ apparaît avec sa validation
- on soumet une valeur que seul le back refuse : l'erreur s'affiche sous le bon champ
- TODO


### La réplique
```json
"properties": [
  { "name": "creneau", "widget": "calendar-grid", "draggable": true }
]
```
```xkcd
A(armsup): J'ajoute widget: 'calendar-grid' dans le template !
B(facepalm): Non.
```
Notes:
- la designer veut le planning hebdomadaire des salles, grille calendrier et drag & drop
- le back choisit alors les widgets UI : c'est la ligne rouge
- démo honnête : ici, le générique craque, et John code du sur-mesure
- TODO


---
## Chapitre 5 : Thérapie de couple
À qui appartient l'état ?

Notes:
- statut : thérapie de couple
- TODO


### Le bug
```mermaid
sequenceDiagram
  participant U as Adhérent (onglet 1)
  participant G as Gestionnaire (onglet 2)
  participant A as Alice (Spring)
  U->>A: GET /reservations/42
  A-->>U: DEMANDEE + _links.annuler (mis en cache)
  G->>A: POST /reservations/42/confirmation
  U->>A: POST /reservations/42/annulation
  A-->>U: 409 Conflict 💥
```
Notes:
- John met les réservations en cache dans un store global
- l'adhérent voit encore « Annuler » : données *et* liens périmés
- TODO


### Avant : la 409
```json
{
  "type": "https://clubhub.fr/problems/etat-invalide",
  "title": "Transition impossible",
  "status": 409,
  "detail": "La réservation 42 est déjà CONFIRMEE",
  "instance": "/api/reservations/42/annulation"
}
```
Notes:
- le même format ProblemDetails qu'au chapitre 4
- TODO


### La dispute
```xkcd
A(point): C'est moi la source de vérité.
B(armsup): Alors pourquoi mon bouton met 400 ms à réagir ?
  Je veux de l'UI optimiste.
```
Notes:
- TODO


### La séance de thérapie
- État serveur : Alice, avec ses liens
- État UI : John (routes, filtres, sélection)
- État statique : personne

Notes:
- l'état serveur appartient à Alice, avec ses liens
- l'état UI appartient à John : routes, filtres, sélection, query params
- les solutions actuelles et leurs limites
- réponse au teaser du ch. 2 : l'état de pagination et des filtres vit dans les query params
- TODO


### Le fix : Angular, sans store
```typescript [1|3-7]
resa = httpResource<HalResource<Reservation>>(() => this.selfHref());

annuler() {
  this.resa.value()!.follow('annuler').subscribe({
    error: (p: ProblemDetail) => p.status === 409 && this.resa.reload(),
  });
}
```
Notes:
- au départ : signals + `httpResource()`, sans store
- sur une 409, on recharge le lien `self` : les nouvelles actions arrivent avec les nouvelles données
- TODO


### Le fix : Angular, ngrx-hateoas
```typescript
export const ReservationStore = signalStore(
  withHypermediaResource('reservation', initialReservation),
  withHypermediaAction('annuler'),
);
```
Notes:
- ngrx-hateoas / SignalStore arrive seulement quand le besoin apparaît
- TODO : vérifier l'API exacte de ngrx-hateoas
- TODO


### Démo
ngrx-hateoas dans ClubHub, puis le module Compétitions « presque gratuitement ».

Notes:
- TODO


### La réplique
```xkcd
A(shrug): Score live et UI optimiste ?
B(shrug): HATEOAS n'est pas le bon outil.
```
Notes:
- pour une fois, Alice et John sont d'accord
- TODO


---
## Épilogue : Mariage ou rupture ?

Notes:
- TODO


### Le contrat de mariage
HAL + HAL-FORMS + ProblemDetails

Notes:
- accepté par les deux équipes
- TODO


### 3 avantages, pas plus
- une seule source de vérité
- moins de duplication front/back
- un couplage faible aux URLs

Notes:
- source de vérité : permissions, navigation, validation, erreurs
- TODO


### Quand passer son chemin
- ch. 1 : allers-retours, payloads lourds <!-- .element class="fragment" -->
- ch. 2 : « page N », URLs partageables <!-- .element class="fragment" -->
- ch. 3 : policy dupliquée côté back <!-- .element class="fragment" -->
- ch. 4 : UX sur-mesure <!-- .element class="fragment" -->
- ch. 5 : UI optimiste, temps réel <!-- .element class="fragment" -->

Notes:
- on reprend les répliques des chapitres 1 à 5
- et en plus : il faut une certaine échelle et un back discipliné
- TODO


### Message final
> HATEOAS n'est pas une religion, c'est un curseur.

Notes:
- suivre les liens, pas les URLs
- afficher ce que le back autorise
- de HATEOAS « client d'API » à HATEOAS « gestion d'état »
- hors scope (à l'oral) : tests de contrat front/back, versioning d'API
- TODO


### 💘
```json
{
  "_links": {
    "self": { "href": "/alice" },
    "love": { "href": "/john" }
  }
}
```
Notes:
- John sait quoi en faire
- TODO


### Sources


### Slides
<https://github.com/benjilegnard/hateoas-and-spa-a-loveoas-story/>

<img src="qrcodes/github-slides.png" class="qrcode"/>


---
## Démos reveal.js/mermaid

```mermaid
classDiagram
  class Customer {
    +String name
    +String email
  }
  class Order {
    +String id
    +Date placedAt
    +total() Money
  }
  class LineItem {
    +int quantity
  }
  class Payment {
    <<interface>>
    +authorise() bool
  }
  Customer "1" --> "*" Order : places
  Order "1" *-- "*" LineItem : contains
  Order --> Payment : settled by
```


```mermaid
erDiagram
          CUSTOMER }|..|{ DELIVERY-ADDRESS : has
          CUSTOMER ||--o{ ORDER : places
          CUSTOMER ||--o{ INVOICE : "liable for"
          DELIVERY-ADDRESS ||--o{ ORDER : receives
          INVOICE ||--|{ ORDER : covers
          ORDER ||--|{ ORDER-ITEM : includes
          PRODUCT-CATEGORY ||--|{ PRODUCT : contains
          PRODUCT ||--o{ ORDER-ITEM : "ordered in"
```


```mermaid
graph TD
    A[Enter Chart Definition] --> B(Preview)
    B --> C{decide}
    C --> D[Keep]
    C --> E[Edit Definition]
    E --> B
    D --> F[Save Image and Code]
    F --> B
```


```mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
```


```mermaid 
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted : submit
  state Review {
    [*] --> Screening
    Screening --> Decision
  }
  Submitted --> Review
  Review --> Published : approved
  Review --> Draft : rejected
  Published --> [*]
```


```xkcd
A: Hi Bob, have you ever heard of HATEOAS?
B(shrug): Is that some kind of French cheese?
A(facepalm): No... It's about putting links in your API responses,
  so the client knows what it can do next.
B(armsup): So my SPA doesn't need to hardcode every URL?
A(point): Exactly!
```


```typescript
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  /**
   * Active sort clause(s). Defaults to `undefined` (let the server decide its
   * default ordering); set an app-specific default via the `withPagination`
   * initial-state override.
   */
  sort: string | string[] | undefined;
  /** IDs of the entities that belong to the current page, in server order. */
  currentPageIds: EntityId[];
}

```

