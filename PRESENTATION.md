# TaskFlow — Présentation complète du projet

> Guide pour bien comprendre le projet, expliqué simplement (niveau débutant).
> Sujet : EFREI — Full Stack JS — « Sujet A : TaskFlow ».

---

## 1. C'est quoi ce projet ?

**TaskFlow** est une petite application web pour **gérer ses tâches personnelles** et **suivre ses habitudes**.

Chaque utilisateur crée un compte et ne voit **que ses propres données** (ses tâches, ses habitudes). On peut aussi afficher des **statistiques** (taux de complétion, heatmap type GitHub).

C'est un projet **« Full Stack »** : il y a un **front** (ce que l'utilisateur voit), un **back** (le serveur), et une **base de données** (là où tout est stocké).

---

## 2. Les 3 grandes briques (analogie restaurant)

Imaginez un restaurant :

| Brique | Rôle | Analogie | Techno |
| --- | --- | --- | --- |
| **Frontend** | Ce que l'utilisateur voit et touche | La **salle** et le **menu** | React + Vite |
| **Backend (API)** | Reçoit les demandes, applique les règles | La **cuisine** | Node.js + Express |
| **Base de données** | Stocke les données pour de bon | Le **garde-manger** | MongoDB |

Le serveur (API) est le **seul** à parler à la base. Le front ne parle **jamais** directement à la base : il passe toujours par l'API.

```
Navigateur (React)  ──HTTP/JSON──►  API (Express)  ──►  MongoDB
        ▲                                   │
        └────────── réponse JSON ───────────┘
```

---

## 3. Le trajet d'un clic (exemple concret)

L'utilisateur clique sur **« Se connecter »** :

1. **Le front** envoie une requête HTTP :
   `POST http://localhost:4000/api/auth/login` avec `{ "email": "...", "password": "..." }`.
2. **L'API** reçoit, vérifie le format, cherche l'utilisateur en base.
3. **L'API** compare le mot de passe avec le **hash** stocké.
4. Si c'est bon, l'API fabrique un **token JWT** (un peu comme un badge) et le renvoie.
5. **Le front** garde ce token (dans le `localStorage` du navigateur).
6. Pour toutes les actions suivantes, le front renvoie ce token dans l'en-tête
   `Authorization: Bearer <token>`.
7. **L'API** vérifie le token avant de laisser passer (c'est le **middleware** d'authentification).

---

## 4. Le vocabulaire à connaître

- **API** : la « porte d'entrée » du serveur. On lui envoie des demandes, elle répond.
- **REST** : une façon d'organiser l'API autour de « ressources » (tâches, habitudes…) et de **verbes HTTP**.
- **HTTP** : le langage des échanges web.
  - Verbes : `GET` (lire), `POST` (créer), `PATCH` (modifier partiellement), `DELETE` (supprimer).
  - Codes de réponse : `200` OK, `201` créé, `204` OK sans contenu, `400` mauvaise requête,
    `401` non authentifié, `404` introuvable, `409` conflit (déjà existant), `500` erreur serveur.
- **JSON** : le format de données échangé, lisible par l'humain :
  `{ "title": "Marcher", "frequency": "daily", "active": true }`.
- **Endpoint (route)** : une adresse précise de l'API, ex. `GET /api/tasks`.
- **JWT (JSON Web Token)** : un « badge » signé par le serveur, qui prouve l'identité. Il contient l'id de l'utilisateur et une date d'expiration.
- **Hash (bcrypt)** : on ne stocke **jamais** un mot de passe en clair. On le transforme en une empreinte **irréversible**. Pour vérifier, on re-hache et on compare.
- **Middleware** : une étape intermédiaire, comme un **portier** qui vérifie le badge avant de laisser entrer.
- **Validation** : vérifier que les données reçues sont correctes (bon type, bonne longueur…) avant de les utiliser.
- **Mongoose** : une bibliothèque qui fait le **traducteur** entre les objets JavaScript et les documents MongoDB.
- **`.env`** : un fichier de **configuration secrète** (mot de passe base, clé JWT…). Il n'est **jamais** mis sur Git.
- **CORS** : une règle de sécurité du navigateur ; le serveur doit **autoriser** le front à l'appeler.
- **Port** : un numéro de « porte » sur la machine. Backend : `4000`. Front (Vite) : `5173`.

---

## 5. Le backend (API) en détail

Dossier : `backend/`

```
backend/
├── package.json
├── .env.example          # modèle du fichier .env (sans secret)
├── docs/STATS.md         # calcul documenté des stats (B4)
├── scripts/smoke-test.mjs# test de bout en bout (script manuel)
├── tests/                # tests Jest + Supertest
│   ├── api.test.js       # parcours API (auth, tâches, habitudes, stats)
│   └── stats.test.js     # agrégations B4
└── src/
    ├── app.js            # l'application Express (routes, middlewares, erreurs)
    ├── server.js         # démarrage : connexion base + écoute du port
    ├── config/           # env.js (variables) + db.js (connexion MongoDB)
    ├── models/           # User, Task, Habit, HabitEvent (formes des données)
    ├── validators/       # règles de validation (Zod)
    ├── middleware/       # auth.js (badge JWT) + validate.js (validation)
    ├── controllers/      # la logique de chaque route
    ├── routes/           # les adresses de l'API
    ├── services/         # statsService.js (calculs B4)
    └── utils/            # errors.js (format d'erreur) + heatmap.js (B3)
```

### 5.1 Les modèles (formes des données)

| Modèle | Champs | Rôle |
| --- | --- | --- |
| **User** | `email` (unique), `password` (hash) | Un compte |
| **Task** | `title`, `status` (todo/doing/done), `description`, `dueDate`, `completedAt`, `priority`, `user` (propriétaire) | Une tâche ponctuelle |
| **Habit** | `ownerId`, `title`, `frequency` (daily/weekly), `active` | Une habitude récurrente |
| **HabitEvent** | `habitId`, `ownerId`, `date` (YYYY-MM-DD) | Une réalisation datée d'une habitude |

> Différence clé : une **tâche** a un **statut** (elle se fait **une fois**).
> Une **habitude** n'a pas de statut : elle a **plein de dates de réalisation** (elle se répète).

### 5.2 Les routes de l'API

| Méthode | Route | Auth | Rôle |
| --- | --- | --- | --- |
| GET | `/api/health` | non | Sonde de vie → `{"status":"ok"}` |
| POST | `/api/auth/register` | non | Inscription → `{user, token}` |
| POST | `/api/auth/login` | non | Connexion → `{user, token}` |
| GET | `/api/auth/me` | oui | Profil courant |
| GET | `/api/tasks` | oui | Lister ses tâches (filtres possibles) |
| POST | `/api/tasks` | oui | Créer une tâche |
| GET | `/api/tasks/count` | oui | Compteur par statut (bonus B1) |
| GET | `/api/tasks/:id` | oui | Détail |
| PATCH | `/api/tasks/:id` | oui | Modifier |
| DELETE | `/api/tasks/:id` | oui | Supprimer |
| GET | `/api/habits` | oui | Lister ses habitudes (B2) |
| POST | `/api/habits` | oui | Créer une habitude |
| GET | `/api/habits/:id` | oui | Détail |
| PATCH | `/api/habits/:id` | oui | Modifier (ex. activer/désactiver) |
| DELETE | `/api/habits/:id` | oui | Supprimer (et ses réalisations) |
| GET | `/api/habits/:id/events` | oui | Réalisations datées |
| POST | `/api/habits/:id/events` | oui | Marquer une réalisation (`{date}`) |
| DELETE | `/api/habits/:id/events/:date` | oui | Retirer une réalisation |
| GET | `/api/stats/weekly` | oui | Taux de complétion hebdo (B4) |
| GET | `/api/heatmap` | oui | Heatmap journalière (B3) |

### 5.3 L'authentification (JWT) expliquée

- À l'inscription, le mot de passe est **haché** avec `bcrypt` avant d'être stocké.
- À la connexion, on compare le mot de passe fourni avec le hash.
- Si c'est bon, on signe un **token JWT** contenant l'id de l'utilisateur, valable 7 jours.
- Le **middleware `requireAuth`** lit le token dans l'en-tête `Authorization: Bearer ...`,
  le vérifie, et met l'utilisateur dans `req.user`.
- **Important** : le propriétaire (`ownerId` / `user`) est **toujours** pris du token,
  **jamais** du client. Un utilisateur ne peut donc pas accéder aux données d'un autre.

### 5.4 Le format d'erreur commun

Toutes les erreurs ont la même forme :
```json
{ "error": { "code": "INVALID_INPUT", "message": "Message lisible" } }
```
Codes : `INVALID_INPUT` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `EMAIL_ALREADY_USED` (409).

### 5.5 La validation (Zod)

Avant d'utiliser les données, on vérifie leur forme avec **Zod** :
- `title` : 1 à 120 caractères (après `trim`).
- `status` : exactement `todo`, `doing` ou `done`.
- `dueDate` : date réelle `YYYY-MM-DD` ou `null`.
- `frequency` : `daily` ou `weekly` ; `active` : booléen **obligatoire**.
- On **refuse** les champs inconnus (ex. envoyer `ownerId` dans un POST → 400).

---

## 6. Le frontend en détail

Dossier : `frontend/Taskflow/`

```
frontend/Taskflow/
├── index.html
├── .env                  # VITE_API_URL (non versionné)
├── .env.example          # modèle
└── src/
    ├── main.jsx          # point d'entrée React
    ├── App.jsx           # affiche Connexion OU l'app selon le token
    ├── api/              # la couche qui parle à l'API
    │   ├── client.js     # fetch centralisé (URL, token, erreurs, no-cache)
    │   ├── auth.js       # login / register
    │   ├── tasks.js      # tâches
    │   ├── habits.js     # habitudes
    │   ├── stats.js      # stats (B4)
    │   └── heatmap.js    # heatmap (B3)
    ├── components/
    │   ├── LoginForm.jsx / RegisterForm.jsx
    │   ├── Navbar.jsx    # navigation (Tâches / Habitudes / Statistiques)
    │   ├── HomePage.jsx  # page Tâches
    │   ├── HabitsPage.jsx# page Habitudes
    │   └── StatsPage.jsx # page Statistiques (heatmap + taux)
    ├── utils/dates.js    # dates civiles (YYYY-MM-DD)
    └── css/              # styles (un fichier par composant + index.css)
```

### 6.1 La couche API (le point clé du front)

`api/client.js` est **le seul endroit** qui parle à l'API :
- il connaît l'URL (`VITE_API_URL`),
- ajoute le **token** dans l'en-tête,
- convertit en JSON,
- **lève une erreur** si la réponse est mauvaise,
- utilise `cache: 'no-store'` pour **toujours** avoir des données fraîches.

Les composants appellent ensuite des fonctions simples :
`listTasks(token)`, `createHabit(token, data)`, etc.

### 6.2 Le flux de connexion dans l'interface

1. `App.jsx` regarde s'il y a un token dans le `localStorage`.
2. Pas de token → écran **Connexion / Inscription**.
3. Connexion réussie → on stocke le token → `App.jsx` affiche l'app.
4. Bouton **Se déconnecter** → on supprime le token → retour à l'écran de connexion.

### 6.3 Les 3 pages

- **Tâches** : liste, création, édition, suppression, filtres (statut/priorité),
  compteur, case pour terminer en un clic.
- **Habitudes** : création, édition, suppression, activer/désactiver,
  et les **7 derniers jours** cliquables pour marquer une réalisation.
- **Statistiques** : **heatmap** type GitHub (12 semaines d'activité) +
  **taux de complétion hebdomadaire** (tâches et habitudes).

---

## 7. Les fonctionnalités (MVP + bonus)

**MVP obligatoire** ✅
- inscription / connexion,
- liste de **ses** tâches,
- ajout, détail, édition, suppression,
- validations + messages d'erreur,
- stockage persistant (MongoDB),
- autorisation côté API (JWT).

**Bonus** ✅
- **B1 — Priorité et filtres** : champ `priority` (low/medium/high), filtres par statut/échéance, compteur `/api/tasks/count`.
- **B2 — Habit tracker** : entité `Habit` + réalisations **datées** (`HabitEvent`). Une tâche cochée n'est **pas** une habitude récurrente.
- **B3 — Heatmap type GitHub** : agrégation quotidienne (tâches terminées + habitudes), grille calendrier, légende, jours à zéro, fuseau horaire.
- **B4 — Statistiques** : taux de complétion hebdomadaire, évolution par période, calcul **documenté** (`docs/STATS.md`) et **tests** sur les agrégations.

---

## 8. Comment lancer le projet

**Prérequis** : Node.js (≥ 20), MongoDB en local.

**Terminal 1 — le backend**
```bash
cd backend
npm install
cp .env.example .env      # puis changer JWT_SECRET
npm run dev               # API sur http://localhost:4000
```

**Terminal 2 — le frontend**
```bash
cd frontend/Taskflow
npm install
npm run dev               # site sur http://localhost:5173
```

MongoDB doit tourner :
```bash
brew services start mongodb-community
```

---

## 9. Comment tester

| Commande | Où | Ce que ça teste |
| --- | --- | --- |
| `npm test` | `backend/` | tests **Jest + Supertest** : agrégations B4 + parcours API complet |
| `npm run smoke` | `backend/` | parcours complet en script (auth, tâches, habitudes, stats) |
| `npm run lint` | `frontend/Taskflow/` | qualité du code front |

**Test manuel** : ouvre `http://localhost:5173`, crée un compte, puis joue avec les 3 pages.
(Un compte de démo existe en local : `demo@taskflow.test` / `demo1234`.)

---

## 10. Git : les commandes utiles

```bash
git status                 # où j'en suis
git switch -c ma-branche   # créer + aller sur une branche
git add .                  # préparer les fichiers
git commit -m "message"    # enregistrer
git push                   # envoyer sur GitHub
git pull                   # récupérer les nouveautés
```

- On travaille sur une **branche**, puis on fait une **Pull Request** vers `main`.
- On ne commit **jamais** `node_modules/` ni `.env` (déjà dans `.gitignore`).

---

## 11. Plan de soutenance (10 minutes)

1. **Le sujet** (30 s) : gérer des tâches + suivre des habitudes, chacun ne voit que ses données.
2. **L'architecture** (1 min) : front React ↔ API Express ↔ MongoDB. Montrer le schéma.
3. **Démonstration** (3 min) : inscription → tâches (créer, terminer, filtrer) → habitudes (marquer un jour) → stats (heatmap + taux).
4. **Le backend** (2 min) : routes, modèles, validation, format d'erreur.
5. **La sécurité** (1 min) : hash bcrypt, JWT, middleware, propriétaire pris du token.
6. **Les bonus** (1 min 30) : B1 priorité, B2 habitudes, B3 heatmap, B4 stats.
7. **Les tests** (30 s) : `npm test` (Jest + Supertest) + `npm run smoke`.
8. **Conclusion** (30 s) : ce qui marche, ce qu'on améliorerait.

---

## 12. Questions probables du jury (et réponses)

- **Pourquoi MongoDB et pas SQL ?** → Schémas souples, pratique pour des données imbriquées/variables ; Mongoose gère la structure.
- **Pourquoi un token JWT ?** → Le serveur reste « sans état » : le token contient l'identité et est vérifiable sans stocker de session.
- **Où est le propriétaire d'une tâche ?** → Jamais choisi par le client : il vient **du token vérifié**.
- **Que se passe-t-il si j'accède à la tâche d'un autre ?** → `404`, comme si elle n'existait pas.
- **Le mot de passe est-il en clair ?** → Non, hashé avec bcrypt.
- **Différence tâche / habitude ?** → Tâche = ponctuelle (un statut). Habitude = récurrente (plusieurs dates de réalisation).
- **Comment sont calculées les stats ?** → Agrégations MongoDB par semaine (lundi-dimanche) ; formule dans `docs/STATS.md`.
- **Comment gère-t-on les fuseaux horaires ?** → Les dates sont des dates **civiles** `YYYY-MM-DD` ; la heatmap accepte un fuseau IANA.

---

## 13. Limites / pistes d'amélioration

- Le front est en français uniquement.
- Pas de pagination sur les listes.
- Les tests (Jest + Supertest) couvrent les agrégations et les routes principales ; on pourrait en ajouter pour les cas limites.
- On pourrait ajouter un `completedAt` visible/éditable, des rappels, un mode sombre, etc.

---

## 14. En résumé

- **Front** React (Vite) : 3 pages + connexion, design simple.
- **Back** Express + Mongoose : routes REST, JWT, validation Zod, format d'erreur commun.
- **Base** MongoDB : 4 modèles (User, Task, Habit, HabitEvent).
- **Fonctions** : MVP complet + 4 bonus.
- **Tests** : `npm test` (Jest + Supertest) et `npm run smoke` (parcours complet).

C'est une application **complète et cohérente** : un vrai petit produit Full Stack.
