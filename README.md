# TaskFlow

Application de gestion de tâches personnelles (EFREI — Full Stack JS, sujet A).

> **MVP** : inscription / connexion, liste de **ses** tâches, ajout, détail, édition,
> suppression, validations et messages d'erreur, stockage persistant, autorisation côté API.

---

## 1. Prérequis

À installer sur la machine **avant** de cloner / lancer le projet :

| Outil | Version | Vérifier |
| --- | --- | --- |
| Node.js | ≥ 20 | `node --version` |
| npm | ≥ 10 | `npm --version` |
| MongoDB | ≥ 7 (serveur local) | `mongod --version` |

> Pas de MongoDB en local ? Utilise un cluster gratuit **MongoDB Atlas** et colle son URI
> dans `MONGO_URI` à l'étape 3.

## 2. Récupérer le projet et installer

```bash
git clone <URL_DU_REPO> taskflow
cd taskflow/backend
npm install
```

`npm install` installe automatiquement toutes les dépendances listées dans
`backend/package.json` (voir la liste en section 5). Pas besoin de les ajouter une par une.

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Puis édite `backend/.env` :

| Variable | Valeur par défaut | Rôle |
| --- | --- | --- |
| `NODE_ENV` | `development` | Environnement |
| `PORT` | `4000` | Port du serveur |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/taskflow` | Connexion MongoDB |
| `JWT_SECRET` | `change-me-with-a-long-random-string` | Secret de signature des jetons (à changer) |
| `JWT_EXPIRES_IN` | `7d` | Durée de validité du token |
| `CORS_ORIGIN` | `http://localhost:5173` | Origine autorisée (frontend Vite) |

> ⚠️ Le fichier `.env` est ignoré par Git : chaque membre doit créer le sien.
> Ne jamais committer de secret.

## 4. Lancer l'API

S'assurer que MongoDB tourne, puis :

```bash
npm run dev     # démarre avec rechargement automatique (node --watch)
# ou
npm start       # démarrage simple, sans watch
```

L'API écoute sur **http://localhost:4000**.
Sonde de vie : `GET http://localhost:4000/api/health`.

## 5. Dépendances (déjà incluses dans `package.json`)

Installées par `npm install`, pas besoin de les taper à la main :

| Paquet | Rôle |
| --- | --- |
| `express` | Framework HTTP : routes et middlewares |
| `mongoose` | ODM MongoDB : schémas et modèles |
| `zod` | Validation des données entrantes |
| `bcryptjs` | Hachage des mots de passe |
| `jsonwebtoken` | Génération / vérification des tokens JWT |
| `dotenv` | Chargement du fichier `.env` |
| `cors` | Autoriser les appels du frontend |
| `morgan` | Logs des requêtes HTTP |

## 6. Structure du projet

```
taskflow/
├── backend/                  # API REST (Node.js + Express + Mongoose)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── app.js            # application Express (sans listen → testable)
│       ├── server.js         # connexion MongoDB + démarrage
│       ├── config/           # env + connexion base
│       ├── models/           # schémas Mongoose (User, Task)
│       ├── validators/       # schémas Zod
│       ├── middleware/       # auth, validation, gestion d'erreurs
│       ├── controllers/      # logique des routes
│       ├── routes/           # endpoints /api/*
│       └── utils/            # helpers (JWT, erreurs, dates)
└── frontend/                 # Application cliente (à venir)
```

## 7. Contrat d'API (à implémenter)

Format des réponses : succès sous `data`, erreurs sous
`{ "error": { "message": "...", "details": [...] } }`.

| Méthode | Route | Auth | Rôle |
| --- | --- | --- | --- |
| `GET` | `/api/health` | – | Sonde de vie |
| `POST` | `/api/auth/register` | – | Inscription → token |
| `POST` | `/api/auth/login` | – | Connexion → token |
| `GET` | `/api/auth/me` | ✅ | Profil courant |
| `GET` | `/api/tasks` | ✅ | Liste ses tâches |
| `POST` | `/api/tasks` | ✅ | Créer une tâche |
| `GET` | `/api/tasks/:id` | ✅ | Détail |
| `PATCH` | `/api/tasks/:id` | ✅ | Éditer |
| `DELETE` | `/api/tasks/:id` | ✅ | Supprimer |

### Règles du modèle `Task`

| Champ | Requis (POST) | Règle |
| --- | --- | --- |
| `title` | ✅ | Chaîne, `1` à `120` caractères après `trim` |
| `status` | ✅ | Exactement `todo`, `doing` ou `done` |
| `description` | – | Chaîne de `0` à `1000` caractères (défaut `""`) |
| `dueDate` | – | Date civile réelle `YYYY-MM-DD` ou `null` (défaut `null`) |

## 8. Convention Git

- Branches : `feat/auth`, `feat/tasks-crud`, `feat/frontend`… puis Pull Request vers `main`.
- Ne jamais committer `node_modules/` ni `.env` (déjà dans `.gitignore`).
