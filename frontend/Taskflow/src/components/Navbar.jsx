import '../css/Navbar.css'

export default function Navbar({ onLogout }) {
  return (
    <header className="navbar">
      <a className="navbar__brand" href="#tasks">TaskFlow</a>
      <button className="navbar__logout" onClick={onLogout} type="button">
        Se déconnecter
      </button>
    </header>
  )
}