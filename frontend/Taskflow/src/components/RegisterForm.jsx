import { useState } from 'react'
import { register } from '../api/auth.js'
import '../css/RegisterForm.css'

export default function RegisterForm({ onAuthenticated }) {
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
      const token = await register(email, password)
      localStorage.setItem('taskflow-token', token)
      onAuthenticated()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <h2 className="register-form__title">Inscription</h2>
      <input
        autoComplete="email"
        className="register-form__input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        autoComplete="new-password"
        className="register-form__input"
        type="password"
        placeholder="Mot de passe (8 caractères minimum)"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button className="register-form__submit" type="submit">
        S'inscrire
      </button>
      {message && <p className="register-form__message">{message}</p>}
    </form>
  )
}
