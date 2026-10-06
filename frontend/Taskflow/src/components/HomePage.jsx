import './HomePage.css'

export default function HomePage({ onLogout }) {
  return (
    <main className="home-page">
      <section className="home-card">
        <h1 className="home-card__title">TaskFlow</h1>
        <h2 className="home-card__message">Vous êtes bien connecté(e)</h2>
        <button className="home-card__logout" onClick={onLogout}>
          Se déconnecter
        </button>
      </section>
    </main>
  )
}
