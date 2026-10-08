import { useCallback, useEffect, useState } from 'react'
import { countTasks, createTask, deleteTask, listTasks, updateTask } from '../api/tasks.js'
import '../css/HomePage.css'

const emptyForm = { title: '', description: '', dueDate: '', priority: 'medium', status: 'todo' }

const STATUS_LABELS = { todo: 'À faire', doing: 'En cours', done: 'Terminée' }
const PRIORITY_LABELS = { low: 'basse', medium: 'normale', high: 'haute' }

const STATUS_FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'todo', label: 'À faire' },
  { value: 'doing', label: 'En cours' },
  { value: 'done', label: 'Terminées' },
]

export default function HomePage({ token }) {
  const [tasks, setTasks] = useState([])
  const [count, setCount] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [loadedTasks, counts] = await Promise.all([
        listTasks(token, { status: statusFilter }),
        countTasks(token),
      ])
      setTasks(loadedTasks)
      setCount(counts)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [token, statusFilter])

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
      description: form.description,
      dueDate: form.dueDate || null,
      priority: form.priority,
      status: form.status,
    }

    try {
      if (editingId) await updateTask(token, editingId, payload)
      else await createTask(token, payload)

      resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (task) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'medium',
      status: task.status,
    })
  }

  const handleToggleDone = async (task) => {
    try {
      await updateTask(token, task.id, { status: task.status === 'done' ? 'todo' : 'done' })
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Supprimer « ${task.title} » ?`)) return

    try {
      await deleteTask(token, task.id)
      if (editingId === task.id) resetForm()
      await load()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const visibleTasks = priorityFilter
    ? tasks.filter((task) => task.priority === priorityFilter)
    : tasks

  return (
    <div className="home-content">
      <h1>Mes tâches</h1>

      {count && (
        <div className="task-stats">
          <div className="task-stat task-stat--todo">
            <strong>{count.byStatus.todo}</strong>
            <span>à faire</span>
          </div>
          <div className="task-stat task-stat--doing">
            <strong>{count.byStatus.doing}</strong>
            <span>en cours</span>
          </div>
          <div className="task-stat task-stat--done">
            <strong>{count.byStatus.done}</strong>
            <span>terminées</span>
          </div>
        </div>
      )}

      {error && <p className="task-error" role="alert">{error}</p>}

      <div className="task-layout">
        <section className="task-form-panel">
          <h2>{editingId ? 'Modifier la tâche' : 'Ajouter une tâche'}</h2>

          <form className="task-form" onSubmit={handleSubmit}>
            <label className="task-field">
              <span>Titre</span>
              <input
                maxLength={120}
                name="title"
                onChange={handleChange}
                placeholder="Ex. Préparer la présentation"
                value={form.title}
              />
            </label>

            <label className="task-field">
              <span>Détails</span>
              <textarea
                maxLength={1000}
                name="description"
                onChange={handleChange}
                placeholder="Ajouter quelques précisions…"
                rows={3}
                value={form.description}
              />
            </label>

            <div className="task-form__row">
              <label className="task-field">
                <span>Échéance</span>
                <input name="dueDate" onChange={handleChange} type="date" value={form.dueDate} />
              </label>
              <label className="task-field">
                <span>Priorité</span>
                <select name="priority" onChange={handleChange} value={form.priority}>
                  <option value="low">Basse</option>
                  <option value="medium">Normale</option>
                  <option value="high">Haute</option>
                </select>
              </label>
            </div>

            <label className="task-field">
              <span>Statut</span>
              <select name="status" onChange={handleChange} value={form.status}>
                <option value="todo">À faire</option>
                <option value="doing">En cours</option>
                <option value="done">Terminée</option>
              </select>
            </label>

            <div className="task-form__actions">
              {editingId && (
                <button className="task-cancel" onClick={resetForm} type="button">
                  Annuler
                </button>
              )}
              <button className="task-submit" disabled={isSaving} type="submit">
                {isSaving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter à ma liste'}
              </button>
            </div>
          </form>
        </section>

        <section className="task-list-panel" aria-labelledby="task-list-title">
          <h2 id="task-list-title">Liste ({visibleTasks.length})</h2>

          <div className="task-filters">
            <div className="task-chips">
              {STATUS_FILTERS.map((filter) => (
                <button
                  className={`task-chip ${statusFilter === filter.value ? 'task-chip--active' : ''}`}
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <select
              className="task-priority-filter"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="">Toutes priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Normale</option>
              <option value="high">Haute</option>
            </select>
          </div>

          {isLoading ? (
            <p>Chargement…</p>
          ) : visibleTasks.length === 0 ? (
            <p>Aucune tâche pour le moment.</p>
          ) : (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li
                  className={`task-item task-item--${task.priority} ${task.status === 'done' ? 'task-item--done' : ''}`}
                  key={task.id}
                >
                  <button
                    aria-label={task.status === 'done' ? 'Marquer à faire' : 'Marquer terminée'}
                    className="task-check"
                    onClick={() => handleToggleDone(task)}
                    type="button"
                  >
                    {task.status === 'done' && <span aria-hidden="true">✓</span>}
                  </button>

                  <div className="task-item__content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    {task.dueDate && <time dateTime={task.dueDate}>Pour le {task.dueDate}</time>}
                  </div>

                  <div className="task-item__details">
                    <span className={`task-status task-status--${task.status}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span className={`task-priority task-priority--${task.priority}`}>
                      Priorité : {PRIORITY_LABELS[task.priority]}
                    </span>
                    <div className="task-item__actions">
                      <button onClick={() => handleEdit(task)} type="button">Modifier</button>
                      <button onClick={() => handleDelete(task)} type="button">Supprimer</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
