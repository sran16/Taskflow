import '../css/Navbar.css'

export default function Navbar({ view, onNavigate, onLogout }) {
  return (
    <header className="navbar">
      <button className="navbar__brand" onClick={() => onNavigate('tasks')} type="button">
        TaskFlow
      </button>

      <nav className="navbar__nav">
        <button
          className={`navbar__link ${view === 'tasks' ? 'navbar__link--active' : ''}`}
          onClick={() => onNavigate('tasks')}
          type="button"
        >
          Tâches
        </button>
        <button
          className={`navbar__link ${view === 'habits' ? 'navbar__link--active' : ''}`}
          onClick={() => onNavigate('habits')}
          type="button"
        >
          Habitudes
        </button>
        <button
          className={`navbar__link ${view === 'stats' ? 'navbar__link--active' : ''}`}
          onClick={() => onNavigate('stats')}
          type="button"
        >
          Statistiques
        </button>
      </nav>

      <button className="navbar__logout" onClick={onLogout} type="button">
        Se déconnecter
      </button>
    </header>
  )
}
