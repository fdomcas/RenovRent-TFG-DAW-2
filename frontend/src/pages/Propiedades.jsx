import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'

export default function Propiedades() {
  const [inmuebles, setInmuebles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/inmuebles/')
      .then(r => setInmuebles(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.titulo}>Propiedades disponibles</h1>

        {loading && <p style={styles.info}>Cargando...</p>}

        <div style={styles.grid}>
          {inmuebles.map(i => (
            <div key={i.id} style={styles.card}>
              <div style={styles.imgWrap}>
                <img
                  src={i.fotos || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'}
                  alt={i.nombre}
                  style={styles.img}
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'
                  }}
                />
                <span style={styles.badge}>{i.tipo}</span>
              </div>
              <div style={styles.body}>
                <h3 style={styles.nombre}>{i.nombre}</h3>
                <p style={styles.ubicacion}>📍 {i.ubicacion}</p>
                <div style={styles.stats}>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Precio</span>
                    <span style={styles.statVal}>{Number(i.precio).toLocaleString('es-ES')} €</span>
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.statLabel}>Retorno anual</span>
                    <span style={{ ...styles.statVal, color: '#16a34a' }}>{i.retorno_anual_porcentaje}%</span>
                  </div>
                </div>
                <button style={styles.btn} onClick={() => navigate(`/propiedades/${i.id}`)}>
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && inmuebles.length === 0 && (
          <p style={styles.info}>No hay propiedades disponibles.</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f5f5f0' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' },
  titulo: { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' },
  imgWrap: { position: 'relative', height: '180px' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  badge: { position: 'absolute', top: '10px', left: '10px', background: '#F97316', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  body: { padding: '1rem' },
  nombre: { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.3rem' },
  ubicacion: { fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem' },
  stats: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', background: '#f9f9f7', borderRadius: '8px', padding: '0.6rem 0.8rem' },
  stat: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel: { fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal: { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a' },
  btn: { width: '100%', padding: '0.65rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  info: { textAlign: 'center', color: '#888', marginTop: '3rem' },
}