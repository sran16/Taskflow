import { useEffect, useState } from 'react'
import { getHeatmap } from '../api/heatmap.js'
import { getWeeklyStats } from '../api/stats.js'
import { lastNDays } from '../utils/dates.js'
import '../css/StatsPage.css'

const RANGE_DAYS = 182
const RANGE = lastNDays(RANGE_DAYS)
const FROM = RANGE[0]
const TO = RANGE[RANGE.length - 1]
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const DAY_LABELS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']

function formatDay(civil) {
  const [, month, day] = civil.split('-')
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
  const [heatmap, setHeatmap] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const [map, stats] = await Promise.all([
          getHeatmap(token, { from: FROM, to: TO, timezone: TIMEZONE }),
          getWeeklyStats(token, 8),
        ])
        if (!isCurrent) return
        setHeatmap(map)
        setWeekly(stats)
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
              <span className="stats-panel__hint">
                {heatmap.total} réalisations · fuseau {heatmap.timezone}
              </span>
            </div>

            <div className="heatmap">
              <div className="heatmap__labels">
                {DAY_LABELS.map((label, index) => (
                  <span className="heatmap__label" key={label}>
                    {index % 2 === 1 ? label : ''}
                  </span>
                ))}
              </div>

              <div className="heatmap__grid">
                {heatmap.weeks.map((week) =>
                  week.days.map((day, index) =>
                    day ? (
                      <span
                        className={`heatmap__cell heatmap__cell--${day.level}`}
                        key={day.date}
                        title={`${day.date} : ${day.count}`}
                      />
                    ) : (
                      <span className="heatmap__cell heatmap__cell--empty" key={`${week.weekStart}-${index}`} />
                    ),
                  ),
                )}
              </div>
            </div>

            <div className="heatmap__legend">
              <span>Moins</span>
              {heatmap.legend.map((item) => (
                <span
                  className={`heatmap__cell heatmap__cell--${item.level}`}
                  key={item.level}
                  title={item.label}
                />
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
