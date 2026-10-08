import { useState } from 'react'
import { login } from '../api/auth.js'
import '../css/LoginForm.css'

export default function LoginForm({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      setMessage('Merci de remplir tous les champs.')
      return
    }

    try {
      const token = await login(email, password)
      localStorage.setItem('taskflow-token', token)
      onAuthenticated()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2 className="login-form__title">Connexion</h2>
      <input
        autoComplete="email"
        className="login-form__input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        autoComplete="current-password"
        className="login-form__input"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button className="login-form__submit" type="submit">
        Se connecter
      </button>
      {message && <p className="login-form__message">{message}</p>}
    </form>
  )
}
