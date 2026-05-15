import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.jsx'
import { T } from '../theme.js'

export default function Navbar() {
  const { user: usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill={T.naranja}/>
          <path d="M6 20V13L14 7L22 13V20H17V15H11V20H6Z" fill="white"/>
        </svg>
        <span style={s.logoText}>RenovRent</span>
      </Link>

      <div style={s.menu}>
        <Link to="/" style={s.link}>Inicio</Link>
        <Link to="/propiedades" style={s.link}>Propiedades</Link>
        <Link to="/recomendaciones" style={s.link}>Recomendaciones</Link>
        {usuario && <Link to="/perfil" style={s.link}>Perfil</Link>}
      </div>

      <div style={s.right}>
        {usuario ? (
          <>
            <div style={s.userChip}>
              <div style={s.avatar}>{usuario.Nikname?.[0]?.toUpperCase()}</div>
              <span style={s.username}>@{usuario.Nikname}</span>
            </div>
            <button style={s.btnLogout} onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <button style={s.btnLogin} onClick={() => navigate('/login')}>Iniciar sesión</button>
        )}
      </div>
    </nav>
  )
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px', background: T.blanco,
    borderBottom: `1px solid ${T.borde}`, position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' },
  logoText: { fontFamily: T.fontDisplay, fontWeight: '700', fontSize: '1.2rem', color: T.texto },
  menu: { display: 'flex', gap: '2rem' },
  link: { textDecoration: 'none', color: T.textoSuave, fontWeight: '500', fontSize: '0.9rem' },
  right: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  userChip: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: T.bgSecundario, padding: '0.3rem 0.7rem 0.3rem 0.3rem',
    borderRadius: T.radioPill, border: `1px solid ${T.borde}`,
  },
  avatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: T.naranja, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: '700',
  },
  username: { color: T.textoSuave, fontSize: '0.85rem', fontWeight: '500' },
  btnLogin: {
    background: T.naranja, color: '#fff', border: 'none', borderRadius: '8px',
    padding: '0.45rem 1.1rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
  },
  btnLogout: {
    background: 'none', color: T.textoMuted, border: `1.5px solid ${T.borde}`,
    borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer',
    fontWeight: '600', fontSize: '0.85rem',
  },
}