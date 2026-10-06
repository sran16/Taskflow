import { useState } from 'react'
import './LoginForm.css'

const API_URL = 'http://localhost:4000/api'

export default function LoginForm({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      setMessage(data?.error?.message || 'Erreur')
      return
    }

    localStorage.setItem('taskflow-token', data.token)
    onAuthenticated()
  }

  return (
    <div className="login-form">
      <h2 className="login-form__title">Connexion</h2>
      <input
        className="login-form__input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="login-form__input"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="login-form__submit" onClick={handleLogin}>
        Se connecter
      </button>
      {message && <p className="login-form__message">{message}</p>}
    </div>
  )
}
