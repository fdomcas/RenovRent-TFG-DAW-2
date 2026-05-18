import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.jsx'
import { T } from '../theme.js'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Navbar() {
  const { user: usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false) }
  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav style={s.nav}>

        <Link to="/" style={s.logo} onClick={closeMenu}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill={T.naranja}/>
            <path d="M6 20V13L14 7L22 13V20H17V15H11V20H6Z" fill="white"/>
          </svg>
          <span style={s.logoText}>RenovRent</span>
        </Link>

        {!isMobile && (
          <div style={s.menu}>
            <Link to="/" style={s.link}>Inicio</Link>
            <Link to="/propiedades" style={s.link}>Propiedades</Link>
            <Link to="/recomendaciones" style={s.link}>Recomendaciones</Link>
            {usuario && <Link to="/perfil" style={s.link}>Perfil</Link>}
          </div>
        )}

        {!isMobile && (
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
              <button style={s.btnLogin} onClick={() => navigate('/login')}>
                Iniciar sesión
              </button>
            )}
          </div>
        )}


        {isMobile && (
          <button
            style={s.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Abrir menú"
          >
            {menuOpen ? (

              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 4L18 18M18 4L4 18" stroke={T.texto} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (

              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 6H19M3 11H19M3 16H19" stroke={T.texto} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={s.mobileMenu}>
          <Link to="/" style={s.mobileLink} onClick={closeMenu}>Inicio</Link>
          <Link to="/propiedades" style={s.mobileLink} onClick={closeMenu}>Propiedades</Link>
          <Link to="/recomendaciones" style={s.mobileLink} onClick={closeMenu}>Recomendaciones</Link>
          {usuario && <Link to="/perfil" style={s.mobileLink} onClick={closeMenu}>Perfil</Link>}

          <div style={s.mobileDivider} />

          {usuario ? (
            <div style={s.mobileBottom}>
              <div style={s.userChip}>
                <div style={s.avatar}>{usuario.Nikname?.[0]?.toUpperCase()}</div>
                <span style={s.username}>@{usuario.Nikname}</span>
              </div>
              <button style={{ ...s.btnLogout, width: '100%' }} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              style={{ ...s.btnLogin, width: '100%', padding: '0.75rem' }}
              onClick={() => { navigate('/login'); closeMenu() }}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}
    </>
  )
}

const s = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.2rem',
    height: '64px',
    background: T.blanco,
    borderBottom: `1px solid ${T.borde}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: '0.6rem', textDecoration: 'none',
  },
  logoText: {
    fontFamily: T.fontDisplay, fontWeight: '700',
    fontSize: '1.2rem', color: T.texto,
  },
  menu: { display: 'flex', gap: '2rem' },
  link: {
    textDecoration: 'none', color: T.textoSuave,
    fontWeight: '500', fontSize: '0.9rem',
  },
  right: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  hamburger: {
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.4rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px',
  },

  mobileMenu: {
    position: 'fixed',
    top: '64px',
    left: 0,
    right: 0,
    background: T.blanco,
    borderBottom: `1px solid ${T.borde}`,
    padding: '1rem 1.2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    zIndex: 99,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  mobileLink: {
    textDecoration: 'none',
    color: T.textoSuave,
    fontWeight: '500',
    fontSize: '1rem',
    padding: '0.75rem 0.5rem',
    borderRadius: '8px',
    borderBottom: `1px solid ${T.borde}`,
  },
  mobileDivider: {
    height: '1px',
    background: T.borde,
    margin: '0.5rem 0',
  },
  mobileBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },


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
    background: T.naranja, color: '#fff', border: 'none',
    borderRadius: '8px', padding: '0.45rem 1.1rem',
    cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem',
    textAlign: 'center',
  },
  btnLogout: {
    background: 'none', color: T.textoMuted,
    border: `1.5px solid ${T.borde}`, borderRadius: '8px',
    padding: '0.4rem 0.9rem', cursor: 'pointer',
    fontWeight: '600', fontSize: '0.85rem', textAlign: 'center',
  },
}