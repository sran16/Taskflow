import { useState } from 'react'
import './RegisterForm.css'

const API_URL = 'http://localhost:4000/api'

export default function RegisterForm({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleRegister = async () => {
    const response = await fetch(`${API_URL}/auth/register`, {
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
    <div className="register-form">
      <h2 className="register-form__title">Inscription</h2>
      <input
        className="register-form__input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="register-form__input"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="register-form__submit" onClick={handleRegister}>
        S'inscrire
      </button>
      {message && <p className="register-form__message">{message}</p>}
    </div>
  )
}
