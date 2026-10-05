# HATEOAS+SPA,<br/> a love story 💘


## Introduction
- Benjamin Legrand / `@benjilegnard`
- Tech Lead @ __onepoint__<!-- .element class="poppins"-->
- Expert front, mais gros bagage ☕Java™
- (🅰️ngular/🍃spring-boot)
Notes:
- présentation speaker
- avant d'aborder HATEOAS, il faut qu'on parle de REST


### Ice Breaker: REST ?
 🧊 🪚
Notes:
- Qui a déjà développé ou utilisé des API's REST ici ?
- Qui s'est dèjà cassé les dents à expliquer ce que c'était.
- Ou dans un retour PR on vous a dit "C'est pas très RESTful ça"


### REST c'est quoi ?
> Une API REST, c'est une API dont le développeur a dit « c'est une API REST »

<div class="trollface fragment"></div>

Notes:
- Une API REST, c'est une API dont le développeur a dit « c'est une API REST » en réunion, et personne n'a osé le contredire. Voilà, fin de la définition pratique utilisée par 95 % de l'industrie.
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
- Félicitations, ton LinkedIn peut désormais afficher « Expert REST ».


### Sérieusement!

- **RE**presentational **S**tate **T**ransfer
- *Roy Fielding*, thèse de doctorat (2000)
- 🌐 world wide web<!-- .element class="fragment"-->
<!-- // TODO QRcode / lien thèse -->
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
- concept évoqué dès la thèse de fielding



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

