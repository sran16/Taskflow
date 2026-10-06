import { useState } from 'react'
import Navbar from './Navbar.jsx'
import '../css/HomePage.css'

const emptyForm = { title: '', description: '', dueDate: '', priority: 'medium' }
const sampleTasks = [
  {
    id: 1,
    title: 'Préparer la présentation',
    description: 'Finaliser les diapositives pour la réunion.',
    dueDate: '2026-10-08',
    status: 'doing',
    priority: 'high',
  },
  {
    id: 2,
    title: 'Répondre aux e-mails',
    description: 'Traiter les messages en attente.',
    dueDate: '',
    status: 'todo',
    priority: 'medium',
  },
]

export default function HomePage({ onLogout }) {
  const [form, setForm] = useState(emptyForm)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  return (
    <main className="home-page">
      <Navbar onLogout={onLogout} />

      <div className="home-content">
        <h1>Mes tâches</h1>

        <div className="task-layout">
          <section className="task-form-panel">
            <h2>Ajouter une tâche</h2>

            <form className="task-form" onSubmit={(event) => event.preventDefault()}>
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

              <button className="task-submit" type="submit">
                Ajouter à ma liste
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          <section className="task-list-panel" aria-labelledby="task-list-title">
            <h2 id="task-list-title">Liste ({sampleTasks.length})</h2>
            <ul className="task-list">
              {sampleTasks.map((task) => (
                <li className="task-item" key={task.id}>
                  <div className="task-item__content">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    {task.dueDate && <time dateTime={task.dueDate}>Pour le {task.dueDate}</time>}
                  </div>
                  <div className="task-item__details">
                    <span className={`task-status task-status--${task.status}`}>
                      {task.status === 'doing' ? 'En cours' : 'À faire'}
                    </span>
                    <span className={`task-priority task-priority--${task.priority}`}>
                      Priorité {task.priority === 'high' ? 'haute' : 'normale'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
