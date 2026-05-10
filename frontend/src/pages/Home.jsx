import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'

const FALLBACK = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
]

export default function Home() {
  const { user } = useAuthStore()
  const [fotos, setFotos] = useState(FALLBACK)
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/inmuebles/')
      .then(r => r.json())
      .then(data => {
        const urls = data.filter(i => i.fotos).map(i => i.fotos)
        if (urls.length > 0) setFotos(urls)
      })
      .catch(() => {})
  }, [])

  const prev = () => setCurrent((c) => (c - 1 + fotos.length) % fotos.length)
  const next = () => setCurrent((c) => (c + 1) % fotos.length)

  useEffect(() => {
    const interval = setInterval(next, 3500)
    return () => clearInterval(interval)
  }, [fotos])

  const getVisible = () => {
    return [-2, -1, 0, 1, 2].map(offset => {
      const index = (current + offset + fotos.length) % fotos.length
      return { index, offset }
    })
  }

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.hero}>
        <div style={styles.bgBlur} />

        <div style={styles.carouselWrapper}>
          <button style={styles.arrow} onClick={prev}>‹</button>

          <div style={styles.carousel}>
            {getVisible().map(({ index, offset }) => {
              const scale = offset === 0 ? 1 : Math.abs(offset) === 1 ? 0.82 : 0.65
              const zIndex = offset === 0 ? 5 : Math.abs(offset) === 1 ? 4 : 3
              const translateX = offset * 220
              const opacity = Math.abs(offset) === 2 ? 0.5 : 1

              return (
                <div
                  key={offset}
                  style={{
                    ...styles.slide,
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    zIndex,
                    opacity,
                  }}
                >
                  <img src={fotos[index]} alt="inmueble" style={styles.img} />
                </div>
              )
            })}
          </div>

          <button style={{ ...styles.arrow, right: 0 }} onClick={next}>›</button>
        </div>

        {!user && (
          <div style={styles.btns}>
            <button style={styles.btnNaranja} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <button style={styles.btnNaranja} onClick={() => navigate('/registro')}>
              Registrarse
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f0f0f0' },
  hero: {
    position: 'relative',
    minHeight: 'calc(100vh - 64px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)',
  },
  bgBlur: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(8px) brightness(1.1)',
    opacity: 0.3,
    zIndex: 0,
  },
  carouselWrapper: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 0',
  },
  carousel: {
    position: 'relative',
    height: '280px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    position: 'absolute',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    width: '260px',
    height: '200px',
  },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  arrow: {
    position: 'absolute',
    zIndex: 10,
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    fontSize: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
  },
  btns: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  btnNaranja: {
    padding: '0.75rem 2rem',
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
    transition: 'background 0.2s',
  },
}