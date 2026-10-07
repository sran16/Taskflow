import { useEffect, useMemo, useState } from 'react'
import { listTasks } from '../api/tasks.js'
import { listHabits } from '../api/habits.js'
import { lastNDays } from '../utils/dates.js'
import { buildWeeks, computeHeatmap, computeWeeklyStats } from '../utils/stats.js'
import '../css/StatsPage.css'

const HEATMAP_DAYS = lastNDays(12 * 7)
const LEGEND = ['0', '1', '2 à 3', '4 à 6', '7+']

function formatDay(civilDate) {
  const [, month, day] = civilDate.split('-')
  return `${day}/${month}`
}

function RateBar({ label, rate, detail }) {
  const percent = Math.round(rate * 100)

  return (
    <div className="rate-bar">
      <span className="rate-bar__label">{label}</span>
      <span className="rate-bar__track">
        <span className="rate-bar__fill" style={{ width: `${percent}%` }} />
      </span>
      <span className="rate-bar__value">{percent}%</span>
      <span className="rate-bar__detail">{detail}</span>
    </div>
  )
}

export default function StatsPage({ token }) {
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const [loadedTasks, loadedHabits] = await Promise.all([listTasks(token), listHabits(token)])
        if (!isCurrent) return
        setTasks(loadedTasks)
        setHabits(loadedHabits)
      } catch (requestError) {
        if (isCurrent) setError(requestError.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    load()

    return () => {
      isCurrent = false
    }
  }, [token])

  const heatmap = useMemo(() => computeHeatmap(tasks, habits, HEATMAP_DAYS), [tasks, habits])
  const weeks = useMemo(() => buildWeeks(heatmap), [heatmap])
  const weekly = useMemo(() => computeWeeklyStats(tasks, habits, 8), [tasks, habits])
  const total = heatmap.reduce((sum, day) => sum + day.count, 0)

  return (
    <div className="home-content">
      <h1>Statistiques</h1>

      {isLoading ? (
        <p className="stats-subtitle">Chargement…</p>
      ) : error ? (
        <p className="stats-error" role="alert">{error}</p>
      ) : (
        <>
          <section className="stats-panel">
            <div className="stats-panel__head">
              <h2>Activité</h2>
              <span className="stats-panel__hint">{total} activités sur 12 semaines</span>
            </div>

            <div className="heatmap">
              <div className="heatmap__labels">
                {['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'].map((label, index) => (
                  <span className="heatmap__label" key={label}>
                    {index % 2 === 1 ? label : ''}
                  </span>
                ))}
              </div>

              <div className="heatmap__grid">
                {weeks.flat().map((day, index) =>
                  day ? (
                    <span
                      className={`heatmap__cell heatmap__cell--${day.level}`}
                      key={day.date}
                      title={`${day.date} : ${day.count}`}
                    />
                  ) : (
                    <span className="heatmap__cell heatmap__cell--empty" key={`empty-${index}`} />
                  ),
                )}
              </div>
            </div>

            <div className="heatmap__legend">
              <span>Moins</span>
              {LEGEND.map((label, level) => (
                <span className={`heatmap__cell heatmap__cell--${level}`} key={label} title={label} />
              ))}
              <span>Plus</span>
            </div>
          </section>

          <section className="stats-panel">
            <div className="stats-panel__head">
              <h2>Taux de complétion hebdomadaire</h2>
              <span className="stats-panel__hint">8 dernières semaines</span>
            </div>

            <ul className="weekly-list">
              {weekly.map((week) => (
                <li className="weekly-item" key={week.weekStart}>
                  <span className="weekly-item__week">Semaine du {formatDay(week.weekStart)}</span>
                  <div className="weekly-item__bars">
                    <RateBar
                      detail={`${week.tasks.completed}/${week.tasks.open}`}
                      label="Tâches"
                      rate={week.tasks.rate}
                    />
                    <RateBar
                      detail={`${week.habits.done}/${week.habits.expected}`}
                      label="Habitudes"
                      rate={week.habits.rate}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
