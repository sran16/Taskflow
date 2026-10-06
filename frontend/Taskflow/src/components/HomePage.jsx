import { useEffect, useState } from 'react'
import { createTask, listTasks } from '../api/tasks.js'
import Navbar from './Navbar.jsx'
import '../css/HomePage.css'

const emptyForm = { title: '', description: '', dueDate: '', priority: 'medium' }

export default function HomePage({ onLogout, token }) {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadTasks() {
      setIsLoading(true)
      setLoadError('')

      try {
        const loadedTasks = await listTasks(token)
        if (isCurrent) setTasks(loadedTasks)
      } catch (requestError) {
        if (isCurrent) setLoadError(requestError.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadTasks()

    return () => {
      isCurrent = false
    }
  }, [token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setIsSaving(true)

    try {
      const taskData = {
        ...form,
        dueDate: form.dueDate || null,
        status: 'todo',
      }
      const createdTask = await createTask(token, taskData)

      setTasks((currentTasks) => [createdTask, ...currentTasks])
      setForm(emptyForm)
    } catch (requestError) {
      setSubmitError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="home-page">
      <Navbar onLogout={onLogout} />

      <div className="home-content">
        <h1>Mes tâches</h1>

        <div className="task-layout">
          <section className="task-form-panel">
            <h2>Ajouter une tâche</h2>

            <form className="task-form" onSubmit={handleSubmit}>
              <label className="task-field">
                <span>Titre</span>
                <input
                  autoFocus
                  maxLength={120}
                  name="title"
                  onChange={handleChange}
                  placeholder="Ex. Préparer la présentation"
                  required
                  value={form.title}
                />
              </label>

              <label className="task-field">
                <span>Détails <small>FACULTATIF</small></span>
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

              {submitError && <p className="task-error" role="alert">{submitError}</p>}

              <button className="task-submit" disabled={isSaving} type="submit">
                {isSaving ? 'Ajout en cours…' : 'Ajouter à ma liste'}
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          <section className="task-list-panel" aria-labelledby="task-list-title">
            <h2 id="task-list-title">Liste ({tasks.length})</h2>
            {isLoading ? (
              <p>Chargement…</p>
            ) : loadError ? (
              <p className="task-error" role="alert">{loadError}</p>
            ) : tasks.length === 0 ? (
              <p>Aucune tâche pour le moment.</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li className="task-item" key={task.id}>
                    <div className="task-item__content">
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                      {task.dueDate && <time dateTime={task.dueDate}>Pour le {task.dueDate}</time>}
                    </div>
                    <div className="task-item__details">
                      <span className={`task-status task-status--${task.status}`}>
                        {task.status === 'doing' ? 'En cours' : task.status === 'done' ? 'Terminée' : 'À faire'}
                      </span>
                      <span className={`task-priority task-priority--${task.priority}`}>
                        Priorité : {task.priority === 'high' ? 'haute' : task.priority === 'low' ? 'basse' : 'normale'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
