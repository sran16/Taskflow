import { useState } from 'react'
import HomePage from './components/HomePage'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import './css/App.css'

function App() {
  const [showLogin, setShowLogin] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('taskflow-token')),
  )

  const handleLogout = () => {
    localStorage.removeItem('taskflow-token')
    setIsAuthenticated(false)
  }

  if (isAuthenticated) {
    return <HomePage onLogout={handleLogout} token={localStorage.getItem('taskflow-token')} />
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-card__title">TaskFlow</h1>

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
          <LoginForm onAuthenticated={() => setIsAuthenticated(true)} />
        ) : (
          <RegisterForm onAuthenticated={() => setIsAuthenticated(true)} />
        )}
      </section>
    </main>
  )
}

export default App
