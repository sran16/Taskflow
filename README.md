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
GET    /api/heatmap
```

`/api/auth/me`, `/api/heatmap` et toutes les routes `/api/tasks` demandent le token dans le header :
`Authorization: Bearer <token>`.

Une tâche a un `title` (obligatoire), un `status` (`todo`, `doing` ou `done`),
une `description` et une `dueDate` (optionnelles).

## Tests backend

Depuis la racine du projet, lance les tests Jest du backend avec :

```bash
cd backend
npm install
npm run test:jest
```

Les tests couvrent la création, la modification et la suppression des tâches, y compris quelques cas d'erreur. Ils n'ont pas besoin d'une instance MongoDB.

## Swagger 

Lien : http://localhost:4000/api-docs/#/