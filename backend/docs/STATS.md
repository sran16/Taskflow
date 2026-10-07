# B4 — Statistiques

Calcul du **taux de complétion hebdomadaire** et de son **évolution** par période.

## Route

```
GET /api/stats/weekly?weeks=8      (auth obligatoire)
```

`weeks` : entier entre 1 et 52 (défaut : 8). Renvoie les `weeks` dernières semaines,
de la plus ancienne à la plus récente.

Réponse :

```json
{
  "items": [
    {
      "weekStart": "2026-10-05",
      "weekEnd": "2026-10-11",
      "tasks":  { "completed": 2, "open": 3, "rate": 0.667 },
      "habits": { "done": 4, "expected": 8, "rate": 0.5 },
      "evolution": { "tasks": 0.667, "habits": 0.5 }
    }
  ]
}
```

## Semaines

Semaines **ISO**, du lundi au dimanche, calculées en **UTC**.

## Taux de complétion — tâches

```
rate = completed / open
```

- `open` = tâches qui étaient **encore ouvertes** à un moment de la semaine :
  créées avant la fin de la semaine **et** pas déjà terminées avant son début.
- `completed` = tâches dont `completedAt` tombe dans la semaine.

Une tâche terminée fait toujours partie de `open`, donc `rate` reste entre 0 et 1.

## Taux de complétion — habitudes

```
rate = done / expected
```

- `expected` = somme sur les habitudes **actives** : 7 jours pour une habitude
  `daily`, 1 pour une `weekly`.
- `done` = somme sur les habitudes actives de `min(jours réalisés, expected)`.

Une réalisation = un `HabitEvent` pour une date donnée (une par jour et par habitude),
donc « jours réalisés » = nombre d'événements.

## Évolution

`evolution.tasks` et `evolution.habits` = différence de taux par rapport à la
semaine précédente (`null` pour la première semaine de la série).

## Tests

Les agrégations sont testées dans `backend/test/stats.test.js` :

```bash
cd backend
npm test
```

Les tests d'agrégation utilisent une base dédiée (`MONGO_URI_TEST`, par défaut
`mongodb://127.0.0.1:27017/taskflow_test`) et la suppriment à la fin.
