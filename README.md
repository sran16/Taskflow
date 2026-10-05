# TaskFlow

une app de gestion de tâches.

## Ce que ça fait

- inscription et connexion (JWT)
- chaque utilisateur ne voit que ses propres tâches
- créer, consulter, modifier et supprimer une tâche

## Lancer le projet

Il faut Node (v20+) et MongoDB installés, puis :

```bash
cd backend
npm install
cp .env.example .env
```

Pense à changer `JWT_SECRET` dans le `.env`.

Ensuite, avec MongoDB qui tourne :

```bash
npm run dev
```

L'API est disponible sur http://localhost:4000 (test : `GET /api/health`).

## Routes

```
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
```

`/api/auth/me` et tout `/api/tasks` demandent le token dans le header :
`Authorization: Bearer <token>`.

Une tâche a un `title` (obligatoire), un `status` (`todo`, `doing` ou `done`),
une `description` et une `dueDate` (optionnelles).
