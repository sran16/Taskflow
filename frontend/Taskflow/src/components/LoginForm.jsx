import { useState } from 'react'
import { login } from '../api/auth.js'
import '../css/LoginForm.css'

export default function LoginForm({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    try {
      const token = await login(email, password)
      localStorage.setItem('taskflow-token', token)
      onAuthenticated()
    } catch (error) {
      setMessage(error.message)
    }
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
