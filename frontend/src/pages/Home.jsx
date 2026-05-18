import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../componentes/Navbar.jsx'
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

export default function Home() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <div style={{ ...s.page, overflowX: 'hidden' }}>
      <Navbar />

      <main style={{
        ...s.mainContainer,
        padding: isMobile ? '1rem' : '2rem 1.5rem',
        gap: isMobile ? '2rem' : '5rem',
      }}>
        <section style={{
          ...s.heroSection,
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
          gap: isMobile ? '1.5rem' : '4rem',
          paddingTop: isMobile ? '1rem' : '2rem',
        }}>


          <div style={s.heroTextContent}>
            <div style={s.badge}>Plataforma de Inversión Nº1</div>

            <h1 style={{
              ...s.heroTitle,
              fontSize: isMobile ? 'clamp(1.8rem, 7vw, 2.4rem)' : 'clamp(2.5rem, 4vw, 3.5rem)',
            }}>
              Invierte en <span style={{ color: T.naranja }}>inmuebles</span><br />
              de forma inteligente.
            </h1>

            <p style={{
              ...s.heroSubtitle,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              maxWidth: isMobile ? '100%' : '500px',
            }}>
              Accede al mercado inmobiliario desde pequeñas cantidades.
              Genera ingresos pasivos y construye tu patrimonio sin las complicaciones tradicionales.
            </p>

            <div style={{
              ...s.heroActions,
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto',
            }}>
              <button
                style={{ ...s.btnPrimary, width: isMobile ? '100%' : 'auto' }}
                onClick={() => navigate('/propiedades')}
              >
                Explorar Oportunidades
              </button>
              {!user && (
                <button
                  style={{ ...s.btnSecondary, width: isMobile ? '100%' : 'auto' }}
                  onClick={() => navigate('/registro')}
                >
                  Crear cuenta gratis
                </button>
              )}
            </div>

            <div style={{ ...s.statsRow, maxWidth: isMobile ? '100%' : '400px' }}>
              <div style={s.statItem}>
                <span style={s.statNumber}>+15%</span>
                <span style={s.statLabel}>Retorno medio</span>
              </div>
              <div style={s.statDivider} />
              <div style={s.statItem}>
                <span style={s.statNumber}>100€</span>
                <span style={s.statLabel}>Inversión mínima</span>
              </div>
            </div>
          </div>


          {!isMobile && (
            <div style={s.heroVisual}>
              <div style={s.imageWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
                  alt="Propiedad moderna"
                  style={s.heroImage}
                />
                <div style={s.floatingCard}>
                  <div style={s.fcHeader}>Rentabilidad Anual</div>
                  <div style={s.fcValue}>12.4%</div>
                  <div style={s.fcFooter}>🟢 +2.1% este mes</div>
                </div>
              </div>
            </div>
          )}


          {isMobile && (
            <div style={s.floatingCardMobile}>
              <div style={s.fcHeader}>Rentabilidad Anual</div>
              <div style={s.fcValue}>12.4%</div>
              <div style={s.fcFooter}>🟢 +2.1% este mes</div>
            </div>
          )}

        </section>
      </main>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: T.bg,
    color: T.texto,
    fontFamily: "'Inter', sans-serif",
    paddingBottom: '5rem',
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },
  heroSection: {
    display: 'grid',
    alignItems: 'center',
  },
  heroTextContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1.5rem',
  },
  badge: {
    background: 'rgba(232, 98, 26, 0.1)',
    color: T.naranja,
    padding: '0.4rem 1rem',
    borderRadius: '100px',
    fontSize: '0.85rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: '800',
    lineHeight: '1.1',
    margin: 0,
    color: '#1a1a1a',
  },
  heroSubtitle: {
    lineHeight: '1.6',
    color: T.textoMuted,
    margin: 0,
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  btnPrimary: {
    background: T.naranja,
    color: T.blanco,
    padding: '1rem 2rem',
    borderRadius: '100px',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(232, 98, 26, 0.3)',
    textAlign: 'center',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#1a1a1a',
    padding: '1rem 2rem',
    borderRadius: '100px',
    fontSize: '1rem',
    fontWeight: '600',
    border: `2px solid ${T.borde}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: `1px solid ${T.borde}`,
    width: '100%',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#1a1a1a',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: T.textoMuted,
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: T.borde,
  },
  heroVisual: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: '450px',
  },
  heroImage: {
    width: '100%',
    height: '600px',
    objectFit: 'cover',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    transform: 'perspective(1000px) rotateY(-5deg)',
    display: 'block',
  },
  floatingCard: {
    position: 'absolute',
    bottom: '40px',
    left: '-40px',
    background: T.blanco,
    padding: '1.2rem',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    zIndex: 2,
  },
  floatingCardMobile: {
    background: T.blanco,
    padding: '1.2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    border: `1px solid ${T.borde}`,
  },
  fcHeader: { fontSize: '0.8rem', color: T.textoMuted, fontWeight: '600' },
  fcValue: { fontSize: '1.5rem', fontWeight: '800', color: '#1a1a1a', fontVariantNumeric: 'tabular-nums' },
  fcFooter: { fontSize: '0.75rem', color: T.ok, fontWeight: '600', marginTop: '0.2rem' },
  dashboardSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    fontFamily: "'Playfair Display', serif",
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  kpiCard: {
    background: T.blanco,
    padding: '1.5rem',
    borderRadius: '16px',
    border: `1px solid ${T.borde}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  kpiCardActive: {
    background: '#1a1a1a',
    padding: '1.5rem',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  kpiLabel: {
    fontSize: '0.9rem',
    color: T.textoMuted,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#1a1a1a',
  },
}