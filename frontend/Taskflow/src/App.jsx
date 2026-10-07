import { useState } from 'react'
import HomePage from './components/HomePage'
import HabitsPage from './components/HabitsPage'
import StatsPage from './components/StatsPage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Navbar from './components/Navbar'
import './css/App.css'

function App() {
  const [showLogin, setShowLogin] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('taskflow-token')),
  )
  const [view, setView] = useState('tasks')

  const token = localStorage.getItem('taskflow-token')

  const handleLogout = () => {
    localStorage.removeItem('taskflow-token')
    setIsAuthenticated(false)
  }

  const handleAuthenticated = () => {
    setView('tasks')
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1 className="auth-card__title">TaskFlow</h1>
          <p className="auth-card__subtitle">Tes tâches et tes habitudes, au même endroit.</p>

          <div className="auth-switch">
            <button
              className={`auth-switch__button ${showLogin ? 'auth-switch__button--active' : ''}`}
              onClick={() => setShowLogin(true)}
            >
              Connexion
            </button>
            <button
              className={`auth-switch__button ${!showLogin ? 'auth-switch__button--active' : ''}`}
              onClick={() => setShowLogin(false)}
            >
              Inscription
            </button>
          </div>

          {showLogin ? (
            <LoginForm onAuthenticated={handleAuthenticated} />
          ) : (
            <RegisterForm onAuthenticated={handleAuthenticated} />
          )}
        </section>
      </main>
    )
  }

  return (
    <div className="home-page">
      <Navbar view={view} onNavigate={setView} onLogout={handleLogout} />

      {view === 'tasks' && <HomePage token={token} />}
      {view === 'habits' && <HabitsPage token={token} />}
      {view === 'stats' && <StatsPage token={token} />}
    </div>
  )
}

export default App
