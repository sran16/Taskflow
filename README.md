# TaskFlow

Petite app de gestion de tâches et d'habitudes (EFREI — Full Stack JS).

## Ce que ça fait

- inscription / connexion (JWT)
- chaque utilisateur ne voit que ses propres données
- tâches : créer, lister, modifier, supprimer, filtrer, compter
- habitudes : créer, activer/désactiver, marquer des jours de réalisation
- statistiques : heatmap + taux de complétion hebdomadaire (calculés côté front)

## Lancer le projet

Il faut Node (v20+) et MongoDB installés.

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # puis changer JWT_SECRET
npm run dev               # API sur http://localhost:4000
```

**Frontend**

```bash
cd frontend/Taskflow
npm install
npm run dev               # site sur http://localhost:5173
```

## Routes de l'API

```
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/count
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/habits
POST   /api/habits
GET    /api/habits/:id
PATCH  /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/events
DELETE /api/habits/:id/events/:date
```

Toutes les routes, sauf `/api/health` et `/api/auth/register|login`, demandent le header
`Authorization: Bearer <token>`.

## Tests

```bash
cd backend
npm test        # Jest + Supertest
```

## Documentation

Swagger : http://localhost:4000/api-docs (backend lancé)
