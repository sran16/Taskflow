import { useCallback, useEffect, useState } from 'react'
import {
  addHabitEvent,
  createHabit,
  deleteHabit,
  listHabitEvents,
  listHabits,
  removeHabitEvent,
  updateHabit,
} from '../api/habits.js'
import { dayLabel, lastNDays } from '../utils/dates.js'
import '../css/HabitsPage.css'

const DAYS = lastNDays(7)
const emptyForm = { title: '', frequency: 'daily', active: 'yes' }
const FREQUENCY_LABELS = { daily: 'Quotidienne', weekly: 'Hebdomadaire' }

export default function HabitsPage({ token }) {
  const [habits, setHabits] = useState([])
  const [events, setEvents] = useState({})
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const loadedHabits = await listHabits(token)
      const entries = await Promise.all(
        loadedHabits.map(async (habit) => [habit.id, await listHabitEvents(token, habit.id)]),
      )
      setHabits(loadedHabits)
      setEvents(Object.fromEntries(entries))
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
      await updateHabit(token, habit.id, { active: !habit.active })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleToggleDate = async (habit, date) => {
    const realized = events[habit.id] || []

    try {
      if (realized.includes(date)) await removeHabitEvent(token, habit.id, date)
      else await addHabitEvent(token, habit.id, date)

      const updated = await listHabitEvents(token, habit.id)
      setEvents((currentEvents) => ({ ...currentEvents, [habit.id]: updated }))
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
                required
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
                const realized = new Set(events[habit.id] || [])

                return (
                  <li className="habit-item" key={habit.id}>
                    <div className="habit-item__content">
                      <h3>{habit.title}</h3>
                      <p className="habit-item__meta">
                        <span className={`habit-badge habit-badge--${habit.frequency}`}>
                          {FREQUENCY_LABELS[habit.frequency]}
                        </span>
                        {!habit.active && <span className="habit-badge habit-badge--off">Inactive</span>}
                      </p>

                      <div className="habit-days">
                        {DAYS.map((date) => (
                          <button
                            className={`habit-day ${realized.has(date) ? 'habit-day--on' : ''}`}
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
