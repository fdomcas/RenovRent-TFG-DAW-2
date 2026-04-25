import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.jsx'

export default function Navbar() {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        🏠 <span style={styles.logoText}>RenovRent</span>
      </Link>

      <div style={styles.menu}>
        <Link to="/" style={styles.link}>Inicio</Link>
        <Link to="/propiedades" style={styles.link}>Propiedades</Link>
        <Link to="/recomendaciones" style={styles.link}>Recomendaciones</Link>
        {usuario && <Link to="/perfil" style={styles.link}>Perfil</Link>}
      </div>

      <div style={styles.right}>
        {usuario ? (
          <>
            <span style={styles.username}>@{usuario.Nikname}</span>
            <button style={styles.btnLogout} onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <button style={styles.btnLogin} onClick={() => navigate('/login')}>
            👤
          </button>
        )}
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    height: '64px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontSize: '1.2rem',
  },
  logoText: { fontWeight: '700', color: '#F97316' },
  menu: { display: 'flex', gap: '2rem' },
  link: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: '500',
    fontSize: '0.95rem',
    transition: 'color 0.2s',
  },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  username: { color: '#666', fontSize: '0.9rem' },
  btnLogin: {
    background: 'none',
    border: '1.5px solid #ddd',
    borderRadius: '50%',
    width: '38px',
    height: '38px',
    cursor: 'pointer',
    fontSize: '1.1rem',
  },
  btnLogout: {
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4rem 0.9rem',
    cursor: 'pointer',
    fontWeight: '600',
  },
}