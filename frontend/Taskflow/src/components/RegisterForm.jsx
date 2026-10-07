import { useState } from 'react'
import { register } from '../api/auth.js'
import '../css/RegisterForm.css'

export default function RegisterForm({ onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleRegister = async () => {
    try {
      const token = await register(email, password)
      localStorage.setItem('taskflow-token', token)
      onAuthenticated()
    } catch (error) {
      setMessage(error.message)
    }
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
