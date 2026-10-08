import { dayLabel, lastNDays } from '../utils/dates.js'
import '../css/HabitsPage.css'
import { useCallback, useEffect, useState } from 'react'
import {
  addHabitDate,
  createHabit,
  deleteHabit,
  listHabits,
  removeHabitDate,
  updateHabit,
} from '../api/habits.js'

const emptyForm = { title: '', frequency: 'daily', active: 'yes' }
const FREQUENCY_LABELS = { daily: 'Quotidienne', weekly: 'Hebdomadaire' }

export default function HabitsPage({ token }) {
  const [habits, setHabits] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Last 7 civil dates, recomputed on every render.
  const days = lastNDays(7)

  const replace = (updated) =>
    setHabits((current) => current.map((habit) => (habit.id === updated.id ? updated : habit)))

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      setHabits(await listHabits(token))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Le titre est obligatoire')
      return
    }

    setError('')
    setIsSaving(true)

    const payload = {
      title: form.title,
      frequency: form.frequency,
      active: form.active === 'yes',
    }

    try {
      if (editingId) await updateHabit(token, editingId, payload)
      else await createHabit(token, payload)

      resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (habit) => {
    setEditingId(habit.id)
    setForm({ title: habit.title, frequency: habit.frequency, active: habit.active ? 'yes' : 'no' })
  }

  const handleToggleActive = async (habit) => {
    try {
      replace(await updateHabit(token, habit.id, { active: !habit.active }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleToggleDate = async (habit, date) => {
    try {
      const dates = habit.dates || []
      const updated = dates.includes(date)
        ? await removeHabitDate(token, habit.id, date)
        : await addHabitDate(token, habit.id, date)

      replace(updated)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (habit) => {
    if (!window.confirm(`Supprimer « ${habit.title} » ?`)) return

    try {
      await deleteHabit(token, habit.id)
      if (editingId === habit.id) resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="home-content">
      <h1>Mes habitudes</h1>
      <p className="habit-counter">
        {habits.length} habitude{habits.length > 1 ? 's' : ''} · clique un jour pour marquer une réalisation
      </p>

      {error && <p className="habit-error" role="alert">{error}</p>}

      <div className="habit-layout">
        <section className="habit-form-panel">
          <h2>{editingId ? "Modifier l'habitude" : 'Ajouter une habitude'}</h2>

          <form className="habit-form" onSubmit={handleSubmit}>
            <label className="habit-field">
              <span>Titre</span>
              <input
                maxLength={120}
                name="title"
                onChange={handleChange}
                placeholder="Ex. Marcher 30 min"
                value={form.title}
              />
            </label>

            <div className="habit-form__row">
              <label className="habit-field">
                <span>Fréquence</span>
                <select name="frequency" onChange={handleChange} value={form.frequency}>
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </label>
              <label className="habit-field">
                <span>Active</span>
                <select name="active" onChange={handleChange} value={form.active}>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </label>
            </div>

            <div className="habit-form__actions">
              {editingId && (
                <button className="habit-cancel" onClick={resetForm} type="button">
                  Annuler
                </button>
              )}
              <button className="habit-submit" disabled={isSaving} type="submit">
                {isSaving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter à ma liste'}
              </button>
            </div>
          </form>
        </section>

        <section className="habit-list-panel" aria-labelledby="habit-list-title">
          <h2 id="habit-list-title">Liste ({habits.length})</h2>

          {isLoading ? (
            <p>Chargement…</p>
          ) : habits.length === 0 ? (
            <p>Aucune habitude pour le moment.</p>
          ) : (
            <ul className="habit-list">
              {habits.map((habit) => {
                const realized = new Set(habit.dates || [])
                const weekCount = days.filter((date) => realized.has(date)).length

                return (
                  <li className="habit-item" key={habit.id}>
                    <div className="habit-item__content">
                      <h3>{habit.title}</h3>
                      <p className="habit-item__meta">
                        <span className={`habit-badge habit-badge--${habit.frequency}`}>
                          {FREQUENCY_LABELS[habit.frequency]}
                        </span>
                        <span className="habit-week">{weekCount}/{days.length} cette semaine</span>
                        {!habit.active && <span className="habit-badge habit-badge--off">Inactive</span>}
                      </p>

                      <div className="habit-days">
                        {days.map((date) => (
                          <button
                            className={`habit-day ${realized.has(date) ? 'habit-day--on' : ''}`}
                            disabled={!habit.active}
                            key={date}
                            onClick={() => handleToggleDate(habit, date)}
                            title={date}
                            type="button"
                          >
                            {dayLabel(date)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="habit-item__actions">
                      <button onClick={() => handleToggleActive(habit)} type="button">
                        {habit.active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => handleEdit(habit)} type="button">Modifier</button>
                      <button onClick={() => handleDelete(habit)} type="button">Supprimer</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
